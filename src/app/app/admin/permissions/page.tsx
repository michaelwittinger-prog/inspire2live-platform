import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { normalizeRole, getRoleLabel, getRoleBadgeColor } from '@/lib/role-access'
import { ROLE_SPACE_DEFAULTS, PLATFORM_SPACES, resolveAccessFromRole } from '@/lib/permissions'
import type { AccessLevel, PlatformSpace } from '@/lib/permissions'
import { PermissionOverridePanel } from '@/components/admin/permission-override-panel'

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRow = {
  id: string
  name: string | null
  email: string | null
  role: string | null
  overrides: Record<PlatformSpace, AccessLevel | null>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const metadata = { title: 'Permission Management · Admin' }

export default async function AdminPermissionsPage() {
  const supabase = await createClient()

  // Auth + role guard
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (normalizeRole(me?.role) !== 'PlatformAdmin') redirect('/app/dashboard')

  // Fetch all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, role')
    .order('name')

  // Fetch all global permission overrides in one query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allOverrides } = await (supabase as any)
    .from('user_space_permissions')
    .select('user_id, space, access_level')
    .eq('scope_type', 'global') as {
      data: { user_id: string; space: string; access_level: string }[] | null
    }

  // Build override map: userId → space → AccessLevel
  const overrideMap = new Map<string, Map<string, AccessLevel>>()
  for (const o of allOverrides ?? []) {
    if (!overrideMap.has(o.user_id)) overrideMap.set(o.user_id, new Map())
    overrideMap.get(o.user_id)!.set(o.space, o.access_level as AccessLevel)
  }

  // Assemble user rows
  const users: UserRow[] = (profiles ?? []).map((p) => {
    const userOverrides = overrideMap.get(p.id)
    const overrides = Object.fromEntries(
      PLATFORM_SPACES.map((space) => [space, userOverrides?.get(space) ?? null])
    ) as Record<PlatformSpace, AccessLevel | null>
    return { id: p.id, name: p.name, email: null, role: p.role, overrides }
  })

  const overrideCount = users.reduce(
    (sum, u) => sum + Object.values(u.overrides).filter(Boolean).length,
    0
  )

  return (
    <div className="space-y-6">
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
          const normalizedRole = normalizeRole(u.role)
          const hasAnyOverride = Object.values(u.overrides).some(Boolean)

          return (
            <div
              key={u.id}
              className={`rounded-xl border bg-white shadow-sm ${hasAnyOverride ? 'border-orange-200' : 'border-neutral-200'}`}
            >
              {/* User header */}
              <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-medium text-neutral-600">
                  {(u.name ?? 'U')[0].toUpperCase()}
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

      {users.length === 0 && (
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
                    const lvl = ROLE_SPACE_DEFAULTS[role as keyof typeof ROLE_SPACE_DEFAULTS][space]
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
