import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { normalizeRole, getRoleLabel, getRoleBadgeColor } from '@/lib/role-access'
import { ROLE_SPACE_DEFAULTS, PLATFORM_SPACES, resolveAccessFromRole } from '@/lib/permissions'
import type { AccessLevel, PlatformSpace } from '@/lib/permissions'
import { loadAdminPermissionsData } from '@/lib/admin-permissions-data'
import { PermissionOverridePanel } from '@/components/admin/permission-override-panel'

// ─── Page ─────────────────────────────────────────────────────────────────────

export const metadata = { title: 'Permission Management · Admin' }

export default async function AdminPermissionsPage() {
  /* ── Auth & admin gate ────────────────────────────────────────────────────── */
  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = await createClient()
  } catch (err) {
    return <DiagnosticError stage="createClient" error={err} />
  }

  let userId: string
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      console.error('[permissions page] auth failed', { message: authError?.message ?? 'no user' })
      redirect('/login')
    }
    userId = authData.user.id
  } catch (err) {
    // redirect() throws a special NEXT_REDIRECT — re-throw it
    if (isNextRedirect(err)) throw err
    return <DiagnosticError stage="auth.getUser" error={err} />
  }

  let myRole: string
  try {
    const { data: me, error: meError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (meError) {
      console.error('[permissions page] failed to load current profile', {
        userId,
        message: meError.message,
        code: (meError as { code?: string }).code,
      })
      return (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Permission Management</h1>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-semibold text-red-700">⚠️ Unable to validate admin access</p>
            <p className="mt-1 font-mono text-xs text-red-600">current profile: {meError.message}</p>
            <p className="mt-3 text-xs text-red-500">
              This is usually caused by a profile RLS issue, missing profile row, or an auth/session mismatch.
              Check Vercel function logs for <code className="font-mono">[permissions page]</code> entries.
            </p>
          </div>
        </div>
      )
    }

    myRole = normalizeRole(me?.role)
  } catch (err) {
    if (isNextRedirect(err)) throw err
    return <DiagnosticError stage="profiles.select" error={err} />
  }

  // redirect() OUTSIDE try/catch — Next.js requirement
  if (myRole !== 'PlatformAdmin') redirect('/app/dashboard')

  /* ── Data loading ─────────────────────────────────────────────────────────── */
  let users: Awaited<ReturnType<typeof loadAdminPermissionsData>>['users'] = []
  let overrideCount = 0
  let pageError: string | null = null

  try {
    const result = await loadAdminPermissionsData(supabase)
    users = result.users
    overrideCount = result.overrideCount
    pageError = result.pageError
  } catch (err) {
    return <DiagnosticError stage="loadAdminPermissionsData" error={err} />
  }

  if (pageError) {
    console.error('[permissions page] data load issue', { message: pageError })
  }

  /* ── Render ───────────────────────────────────────────────────────────────── */
  try {
    return renderPage({ users, overrideCount, pageError })
  } catch (err) {
    return <DiagnosticError stage="renderPage" error={err} />
  }
}

// ─── Render helper (extracted so we can try/catch the JSX) ────────────────────

type PageData = {
  users: Awaited<ReturnType<typeof loadAdminPermissionsData>>['users']
  overrideCount: number
  pageError: string | null
}

function renderPage({ users, overrideCount, pageError }: PageData) {
  // Error state: no users AND an error
  if (pageError && users.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Permission Management</h1>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-semibold text-red-700">⚠️ Page failed to load</p>
          <p className="mt-1 font-mono text-xs text-red-600">{pageError}</p>
          <p className="mt-3 text-xs text-red-500">
            Check Vercel function logs for the full stack trace.
            Common causes: RLS policy mismatch (your DB role must be exactly &ldquo;PlatformAdmin&rdquo;),
            or a missing/unapplied database migration.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Non-fatal warning banner */}
      {pageError && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-xs text-orange-700">
          <span className="font-semibold">⚠️ Partial load:</span> {pageError}
          <span className="ml-2 text-orange-500">Showing role defaults only.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Permission Management</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Override default role-based access levels per user per space.
            Changes take effect immediately on next page load.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-orange-100 px-3 py-0.5 text-xs font-medium text-orange-700">
            {overrideCount} active override{overrideCount !== 1 ? 's' : ''}
          </span>
          <a
            href="/app/admin/users"
            className="text-xs text-neutral-400 underline underline-offset-2 hover:text-neutral-600"
          >
            ← Back to User Management
          </a>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-600">
        <span className="font-medium text-neutral-700">Access levels:</span>
        {(['invisible', 'view', 'edit', 'manage'] as AccessLevel[]).map((lvl) => (
          <span key={lvl} className={`rounded px-2 py-0.5 font-mono font-medium ${ACCESS_BADGE[lvl]}`}>
            {lvl}
          </span>
        ))}
        <span className="ml-2 text-neutral-400">• Grey = role default, no override</span>
      </div>

      {/* User cards */}
      <div className="space-y-4">
        {users.map((u) => {
          const hasAnyOverride = Object.values(u.overrides).some(Boolean)

          return (
            <div
              key={u.id}
              className={`rounded-xl border bg-white shadow-sm ${hasAnyOverride ? 'border-orange-200' : 'border-neutral-200'}`}
            >
              {/* User header */}
              <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-medium text-neutral-600">
                  {(u.name || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">{u.name ?? '—'}</p>
                  <p className="truncate text-xs text-neutral-400">{u.id.slice(0, 8)}…</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                  {getRoleLabel(u.role)}
                </span>
                {hasAnyOverride && (
                  <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                    overrides active
                  </span>
                )}
              </div>

              {/* Space grid */}
              <div className="grid grid-cols-2 gap-px bg-neutral-100 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {PLATFORM_SPACES.map((space) => {
                  const override = u.overrides[space]
                  const defaultLevel = resolveAccessFromRole(u.role, space)
                  const effectiveLevel = override ?? defaultLevel
                  const isOverridden = override !== null

                  return (
                    <PermissionOverridePanel
                      key={space}
                      userId={u.id}
                      userName={u.name ?? u.id.slice(0, 8)}
                      space={space}
                      override={override}
                      defaultLevel={defaultLevel}
                      effectiveLevel={effectiveLevel}
                      isOverridden={isOverridden}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {users.length === 0 && !pageError && (
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
          No users found.
        </div>
      )}

      {/* Role defaults reference table */}
      <details className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
          Role defaults reference ▾
        </summary>
        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="pb-2 pr-3 text-left font-medium text-neutral-500">Space</th>
                {Object.keys(ROLE_SPACE_DEFAULTS).map((role) => (
                  <th key={role} className="pb-2 px-2 text-center font-medium text-neutral-500 whitespace-nowrap">
                    {getRoleLabel(role)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLATFORM_SPACES.map((space) => (
                <tr key={space} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-1.5 pr-3 font-mono text-neutral-700">{space}</td>
                  {Object.keys(ROLE_SPACE_DEFAULTS).map((role) => {
                    const lvl = ROLE_SPACE_DEFAULTS[role as keyof typeof ROLE_SPACE_DEFAULTS]?.[space] ?? 'invisible'
                    return (
                      <td key={role} className="py-1.5 px-2 text-center">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-mono ${ACCESS_BADGE[lvl]}`}>
                          {lvl === 'invisible' ? '—' : lvl}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCESS_BADGE: Record<AccessLevel, string> = {
  invisible: 'bg-neutral-100 text-neutral-400',
  view:      'bg-sky-100 text-sky-700',
  edit:      'bg-emerald-100 text-emerald-700',
  manage:    'bg-orange-100 text-orange-700',
}

/**
 * Diagnostic error component — shows the actual error message on the page
 * instead of Next.js's generic production error.
 * Only visible to PlatformAdmin users (this route is admin-only).
 */
function DiagnosticError({ stage, error }: { stage: string; error: unknown }) {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  console.error(`[permissions page] CRASH at stage="${stage}"`, error)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-neutral-900">Permission Management</h1>
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 space-y-3">
        <p className="text-sm font-semibold text-red-700">
          ⚠️ Server Component crashed at stage: <code className="font-mono">{stage}</code>
        </p>
        <div className="rounded-lg bg-white border border-red-100 px-4 py-3">
          <p className="font-mono text-xs font-medium text-red-600 break-all">
            {message}
          </p>
        </div>
        {stack && (
          <details className="text-xs">
            <summary className="cursor-pointer text-red-500 hover:text-red-700">Stack trace</summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded bg-neutral-900 p-3 text-[10px] text-green-400">
              {stack}
            </pre>
          </details>
        )}
        <p className="text-xs text-red-500">
          This diagnostic is only visible to PlatformAdmin users.
          Check Vercel function logs for <code className="font-mono">[permissions page] CRASH</code>.
        </p>
        <a
          href="/app/admin/users"
          className="inline-block text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-700"
        >
          ← Back to User Management
        </a>
      </div>
    </div>
  )
}

/** Detect Next.js redirect() "errors" so we re-throw them */
function isNextRedirect(err: unknown): boolean {
  if (typeof err === 'object' && err !== null && 'digest' in err) {
    const digest = (err as { digest: string }).digest
    return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')
  }
  return false
}