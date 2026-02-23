'use client'

import { useMemo, useState } from 'react'
import { getRoleBadgeColor, getRoleLabel } from '@/lib/role-access'
import { PLATFORM_SPACES, ROLE_SPACE_DEFAULTS, resolveAccessFromRole } from '@/lib/permissions'
import type { AccessLevel, PlatformSpace } from '@/lib/permissions'
import type { UserRow } from '@/lib/admin-permissions-data'
import type { RoleDefaultsMatrix } from '@/lib/admin-role-defaults-data'
import { PermissionOverridePanel } from '@/components/admin/permission-override-panel'
import { setRoleDefaultOverride } from '@/app/app/admin/permissions/actions'

type Props = {
  users: UserRow[]
  overrideCount: number
  pageError: string | null
  roleDefaults: RoleDefaultsMatrix
}

type RoleContext = 'platform' | 'initiative' | 'congress'

const ACCESS_BADGE: Record<AccessLevel, string> = {
  invisible: 'bg-neutral-100 text-neutral-400',
  view: 'bg-sky-100 text-sky-700',
  edit: 'bg-emerald-100 text-emerald-700',
  manage: 'bg-orange-100 text-orange-700',
}

const CONTEXTS: { key: RoleContext; label: string }[] = [
  { key: 'platform', label: 'Platform role' },
  { key: 'initiative', label: 'Initiative role' },
  { key: 'congress', label: 'Congress role' },
]

export function PermissionsWorkspaceShell({ users, overrideCount, pageError, roleDefaults }: Props) {
  const [roleContext, setRoleContext] = useState<RoleContext>('platform')
  const [selectedRole, setSelectedRole] = useState('')
  const [query, setQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(users[0]?.id ?? null)
  const [draft, setDraft] = useState<Partial<Record<PlatformSpace, AccessLevel>>>({})
  const [isSavingDefaults, setIsSavingDefaults] = useState(false)
  const [roleSaveError, setRoleSaveError] = useState<string | null>(null)
  const [roleSaveSuccess, setRoleSaveSuccess] = useState<string | null>(null)
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null)
  const [lastActionScope, setLastActionScope] = useState<string | null>(null)

  const platformRoles = useMemo(() => Object.keys(roleDefaults), [roleDefaults])
  const roleOptions = roleContext === 'platform' ? platformRoles : []

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users.slice(0, 8)
    return users
      .filter((u) => (u.name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q))
      .slice(0, 8)
  }, [query, users])

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? users[0] ?? null,
    [selectedUserId, users]
  )

  const roleStepReady = selectedRole.length > 0

  const sourceDefaults = useMemo(() => {
    if (!roleStepReady || roleContext !== 'platform') return null
    const role = selectedRole as keyof typeof ROLE_SPACE_DEFAULTS
    return roleDefaults[role] ?? null
  }, [roleContext, roleDefaults, roleStepReady, selectedRole])

  const effectiveDefaults = useMemo(() => {
    if (!sourceDefaults) return null
    return Object.fromEntries(
      PLATFORM_SPACES.map((space) => [space, (draft[space] as AccessLevel | undefined) ?? sourceDefaults[space]])
    ) as Record<(typeof PLATFORM_SPACES)[number], AccessLevel>
  }, [draft, sourceDefaults])

  const dirtySpaces = useMemo(() => {
    if (!sourceDefaults) return [] as PlatformSpace[]
    return PLATFORM_SPACES.filter((space) => draft[space] !== undefined && draft[space] !== sourceDefaults[space])
  }, [draft, sourceDefaults])

  const isDirty = dirtySpaces.length > 0

  function resetDraftForSelection() {
    setDraft({})
    setRoleSaveError(null)
    setRoleSaveSuccess(null)
  }

  function setDraftLevel(space: (typeof PLATFORM_SPACES)[number], level: AccessLevel) {
    setDraft((current) => ({ ...current, [space]: level }))
    setRoleSaveSuccess(null)
  }

  async function handleSaveRoleDefaults() {
    if (!sourceDefaults || roleContext !== 'platform') return

    setRoleSaveError(null)
    setRoleSaveSuccess(null)
    setIsSavingDefaults(true)

    const role = selectedRole as keyof typeof ROLE_SPACE_DEFAULTS

    try {
      for (const space of dirtySpaces) {
        const accessLevel = draft[space] as AccessLevel
        const result = await setRoleDefaultOverride({ role, space, accessLevel })
        if (result.error) {
          setRoleSaveError(result.error)
          setIsSavingDefaults(false)
          return
        }
      }

      setRoleSaveSuccess(`Saved ${dirtySpaces.length} role default change${dirtySpaces.length !== 1 ? 's' : ''}`)
      setDraft({})
    } catch (error) {
      setRoleSaveError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsSavingDefaults(false)
    }
  }

  return (
    <div className="space-y-6">
      {pageError && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-xs text-orange-700">
          <span className="font-semibold">⚠️ Partial load:</span> {pageError}
          <span className="ml-2 text-orange-500">Showing available data only.</span>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Permission Management</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Configure role defaults first, then apply user-specific overrides where needed.
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

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-neutral-900">Role permissions (primary)</h2>
          <p className="text-xs text-neutral-500">Set context and role first, then review defaults in Step 2.</p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {CONTEXTS.map((ctx) => (
            <button
              key={ctx.key}
              onClick={() => {
                setRoleContext(ctx.key)
                setSelectedRole('')
                resetDraftForSelection()
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                roleContext === ctx.key
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {ctx.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-xs font-semibold text-neutral-700">Step 1 · Select role</p>
            <select
              className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value)
                resetDraftForSelection()
              }}
            >
              <option value="">
                {roleContext === 'platform' ? 'Choose a platform role' : `Choose a ${roleContext} role (coming next)`}
              </option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
          </div>

          <div className={`rounded-lg border p-3 ${roleStepReady ? 'border-neutral-200 bg-white' : 'border-neutral-200 bg-neutral-50'}`}>
            <p className="text-xs font-semibold text-neutral-700">Step 2 · Role default permissions</p>
            {!roleStepReady ? (
              <p className="mt-2 text-xs text-neutral-500">Select a role in Step 1 to enable Step 2.</p>
            ) : roleContext !== 'platform' ? (
              <p className="mt-2 text-xs text-neutral-500">
                Initiative and Congress role matrices are scaffolded in Phase 1 and will be wired in next phases.
              </p>
            ) : (
              <>
                <div className="mt-2 grid grid-cols-2 gap-1.5 lg:grid-cols-3">
                  {PLATFORM_SPACES.map((space) => {
                    const lvl = effectiveDefaults?.[space] ?? resolveAccessFromRole(selectedRole, space)
                    return (
                      <button
                        key={space}
                        onClick={() => {
                          const nextLevel: AccessLevel =
                            lvl === 'invisible' ? 'view' : lvl === 'view' ? 'edit' : lvl === 'edit' ? 'manage' : 'invisible'
                          setDraftLevel(space, nextLevel)
                        }}
                        className={`rounded px-2 py-1 text-left text-[11px] font-mono transition hover:opacity-90 ${ACCESS_BADGE[lvl]}`}
                        title="Click to cycle level"
                      >
                        {space}: {lvl === 'invisible' ? '—' : lvl}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleSaveRoleDefaults}
                    disabled={!isDirty || isSavingDefaults}
                    className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSavingDefaults ? 'Saving…' : `Save defaults${isDirty ? ` (${dirtySpaces.length})` : ''}`}
                  </button>
                  <button
                    onClick={() => setDraft({})}
                    disabled={!isDirty || isSavingDefaults}
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Discard
                  </button>
                  {isDirty && <span className="text-[11px] text-orange-600">Unsaved changes</span>}
                </div>

                {roleSaveError && <p className="mt-2 text-[11px] text-red-600">{roleSaveError}</p>}
                {roleSaveSuccess && <p className="mt-2 text-[11px] text-emerald-600">{roleSaveSuccess}</p>}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-neutral-900">User permissions (overrides)</h2>
          <p className="text-xs text-neutral-500">
            Search by name or email, select one user, then override role defaults where needed.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <label htmlFor="user-search" className="text-xs font-semibold text-neutral-700">
              Find user
            </label>
            <input
              id="user-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type name or email"
              className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            />
            <div className="mt-2 space-y-1">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-xs ${
                    selectedUserId === u.id
                      ? 'border-orange-300 bg-orange-50 text-orange-800'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <span className="truncate">{u.name ?? 'Unnamed'} · {u.email ?? 'no-email'}</span>
                </button>
              ))}
              {filteredUsers.length === 0 && <p className="text-xs text-neutral-500">No matching users found.</p>}
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-3">
            {selectedUser ? (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeColor(selectedUser.role)}`}>
                    {getRoleLabel(selectedUser.role)}
                  </span>
                  <p className="truncate text-xs text-neutral-500">{selectedUser.name ?? 'Unnamed'} · {selectedUser.email ?? 'no-email'}</p>
                </div>

                {lastActionMessage && (
                  <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <p className="text-[11px] font-medium text-emerald-700">✓ Last action</p>
                    <p className="text-[11px] text-emerald-700">{lastActionMessage}</p>
                    {lastActionScope && (
                      <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                        scope: {lastActionScope}
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-px bg-neutral-100 sm:grid-cols-3">
                  {PLATFORM_SPACES.map((space) => {
                    const override = selectedUser.overrides[space]
                    const defaultLevel = resolveAccessFromRole(selectedUser.role, space)
                    const effectiveLevel = override ?? defaultLevel
                    const isOverridden = override !== null
                    return (
                      <PermissionOverridePanel
                        key={space}
                        userId={selectedUser.id}
                        userName={selectedUser.name ?? selectedUser.id.slice(0, 8)}
                        space={space}
                        override={override}
                        defaultLevel={defaultLevel}
                        effectiveLevel={effectiveLevel}
                        isOverridden={isOverridden}
                        scopedOverrideCount={selectedUser.scopedOverrideCounts[space]}
                        onActionComplete={({ message, scopeLabel }) => {
                          setLastActionMessage(`${selectedUser.name ?? selectedUser.id.slice(0, 8)} · ${message}`)
                          setLastActionScope(scopeLabel)
                        }}
                      />
                    )
                  })}
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2.5">
                    <p className="text-[11px] font-semibold text-indigo-700">Scoped override preview</p>
                    {selectedUser.recentScopedOverrides.length === 0 ? (
                      <p className="mt-1 text-[11px] text-indigo-600">No scoped overrides found.</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {selectedUser.recentScopedOverrides.map((item, index) => (
                          <li key={`${item.space}-${item.scopeType}-${item.scopeId ?? 'none'}-${index}`} className="text-[11px] text-indigo-700">
                            <span className="font-mono">{item.space}</span> → {item.accessLevel} ({item.scopeType}{item.scopeId ? `:${item.scopeId}` : ''})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
                    <p className="text-[11px] font-semibold text-neutral-700">Recent permission audit</p>
                    {selectedUser.recentAudit.length === 0 ? (
                      <p className="mt-1 text-[11px] text-neutral-500">No recent audit entries.</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {selectedUser.recentAudit.map((entry, index) => (
                          <li key={`${entry.createdAt}-${index}`} className="text-[11px] text-neutral-600">
                            <span className="font-mono text-[10px] text-neutral-500">{entry.createdAt}</span> · {entry.summary}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-neutral-500">No users available.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
