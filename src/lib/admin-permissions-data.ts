import { PLATFORM_SPACES } from '@/lib/permissions'
import type { AccessLevel, PlatformSpace } from '@/lib/permissions'

export type ScopedOverridePreview = {
  space: PlatformSpace
  accessLevel: AccessLevel
  scopeType: Exclude<string, 'global'>
  scopeId: string | null
  updatedAt: string | null
}

export type PermissionAuditPreview = {
  createdAt: string
  summary: string
}

export type UserRow = {
  id: string
  name: string | null
  email: string | null
  role: string | null
  overrides: Record<PlatformSpace, AccessLevel | null>
  scopedOverrideCounts: Record<PlatformSpace, number>
  recentScopedOverrides: ScopedOverridePreview[]
  recentAudit: PermissionAuditPreview[]
}

type OverrideRow = { user_id: string; space: string; access_level: string }
type ScopedOverrideRow = {
  user_id: string
  space: string
  access_level: string
  scope_type: string
  scope_id: string | null
  updated_at: string | null
}

type AuditRow = {
  target_user_id: string
  change_type: string
  created_at: string
  new_value: Record<string, unknown> | null
}

export type AdminPermissionsData = {
  users: UserRow[]
  overrideCount: number
  pageError: string | null
}

/**
 * Loads all profiles + permission overrides for the admin permissions page.
 *
 * Accepts `any` for the supabase client to avoid deep type-instantiation issues
 * with the generated Database types. The function is only called from the
 * admin permissions Server Component which already validates the client.
 */
export async function loadAdminPermissionsData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<AdminPermissionsData> {
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .order('name')

    const { data: globalOverrideData, error: overrideError } = await supabase
      .from('user_space_permissions')
      .select('user_id, space, access_level')
      .eq('scope_type', 'global')

    const { data: scopedOverrideData, error: scopedOverrideError } = await supabase
      .from('user_space_permissions')
      .select('user_id, space, access_level, scope_type, scope_id, updated_at')
      .neq('scope_type', 'global')

    const { data: auditData, error: auditError } = await supabase
      .from('permission_audit_log')
      .select('target_user_id, change_type, created_at, new_value')
      .order('created_at', { ascending: false })
      .limit(200)

    const allOverrides: OverrideRow[] = globalOverrideData ?? []
    const overrideMap = new Map<string, Map<string, AccessLevel>>()
    for (const o of allOverrides) {
      if (!overrideMap.has(o.user_id)) overrideMap.set(o.user_id, new Map())
      overrideMap.get(o.user_id)!.set(o.space, o.access_level as AccessLevel)
    }

    const scopedOverridesByUser = new Map<string, ScopedOverridePreview[]>()
    const scopedCountsByUser = new Map<string, Record<PlatformSpace, number>>()

    for (const row of (scopedOverrideData ?? []) as ScopedOverrideRow[]) {
      if (!PLATFORM_SPACES.includes(row.space as PlatformSpace)) continue
      const space = row.space as PlatformSpace
      const item: ScopedOverridePreview = {
        space,
        accessLevel: row.access_level as AccessLevel,
        scopeType: row.scope_type,
        scopeId: row.scope_id,
        updatedAt: row.updated_at,
      }

      if (!scopedOverridesByUser.has(row.user_id)) scopedOverridesByUser.set(row.user_id, [])
      scopedOverridesByUser.get(row.user_id)!.push(item)

      if (!scopedCountsByUser.has(row.user_id)) {
        scopedCountsByUser.set(
          row.user_id,
          Object.fromEntries(PLATFORM_SPACES.map((spaceName) => [spaceName, 0])) as Record<PlatformSpace, number>
        )
      }
      scopedCountsByUser.get(row.user_id)![space] += 1
    }

    const auditByUser = new Map<string, PermissionAuditPreview[]>()
    for (const row of (auditData ?? []) as AuditRow[]) {
      if (!auditByUser.has(row.target_user_id)) auditByUser.set(row.target_user_id, [])
      const summary = summarizeAuditEntry(row)
      const current = auditByUser.get(row.target_user_id)!
      if (current.length < 5) {
        current.push({ createdAt: row.created_at, summary })
      }
    }

    const users: UserRow[] = (profiles ?? []).map((p: { id: string; name: string | null; email: string | null; role: string | null }) => {
      const userOverrides = overrideMap.get(p.id)
      const overrides = Object.fromEntries(
        PLATFORM_SPACES.map((space) => [space, userOverrides?.get(space) ?? null])
      ) as Record<PlatformSpace, AccessLevel | null>

      const scopedCounts =
        scopedCountsByUser.get(p.id) ??
        (Object.fromEntries(PLATFORM_SPACES.map((space) => [space, 0])) as Record<PlatformSpace, number>)

      const scopedItems = (scopedOverridesByUser.get(p.id) ?? [])
        .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
        .slice(0, 6)

      return {
        id: p.id,
        name: p.name || null,
        email: p.email || null,
        role: p.role || null,
        overrides,
        scopedOverrideCounts: scopedCounts,
        recentScopedOverrides: scopedItems,
        recentAudit: auditByUser.get(p.id) ?? [],
      }
    })

    const overrideCount = users.reduce((sum, u) => sum + Object.values(u.overrides).filter(Boolean).length, 0)
    const pageError: string | null = profilesError
      ? `profiles: ${profilesError.message}`
      : overrideError
        ? overrideError.code === '42P01'
          ? 'overrides: relation "user_space_permissions" does not exist (migration 00022 likely not applied)'
          : `overrides: ${overrideError.message}`
        : scopedOverrideError
          ? `scoped overrides: ${scopedOverrideError.message}`
          : auditError
            ? `audit: ${auditError.message}`
        : null

    return { users, overrideCount, pageError }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { users: [], overrideCount: 0, pageError: `unexpected: ${message}` }
  }
}

function summarizeAuditEntry(row: AuditRow): string {
  const newValue = row.new_value ?? null
  const space = typeof newValue?.space === 'string' ? newValue.space : 'unknown-space'
  const accessLevel = typeof newValue?.access_level === 'string' ? newValue.access_level : row.change_type
  const scopeType = typeof newValue?.scope_type === 'string' ? newValue.scope_type : 'global'
  const scopeId = typeof newValue?.scope_id === 'string' ? newValue.scope_id : null
  if (scopeType === 'global') return `${space}: ${accessLevel} (global)`
  return `${space}: ${accessLevel} (${scopeType}${scopeId ? `:${scopeId}` : ''})`
}