import { PLATFORM_SPACES } from '@/lib/permissions'
import type { AccessLevel, PlatformSpace } from '@/lib/permissions'

export type UserRow = {
  id: string
  name: string | null
  email: string | null
  role: string | null
  overrides: Record<PlatformSpace, AccessLevel | null>
}

type OverrideRow = { user_id: string; space: string; access_level: string }
type ProfileRow = { id: string; name: string | null; role: string | null }

type QueryResult<T> = Promise<{ data: T | null; error: { message: string; code?: string } | null }>

type AdminPermissionsSupabase = {
  from: (table: 'profiles' | 'user_space_permissions') => {
    select: (columns: string) => {
      order: (column: string) => QueryResult<ProfileRow[]>
      eq: (column: string, value: string) => QueryResult<OverrideRow[]>
    }
  }
}

export type AdminPermissionsData = {
  users: UserRow[]
  overrideCount: number
  pageError: string | null
}

export async function loadAdminPermissionsData(
  supabase: AdminPermissionsSupabase
): Promise<AdminPermissionsData> {
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .order('name')

    const { data: overrideData, error: overrideError } = await supabase
      .from('user_space_permissions')
      .select('user_id, space, access_level')
      .eq('scope_type', 'global')

    const allOverrides: OverrideRow[] = overrideData ?? []
    const overrideMap = new Map<string, Map<string, AccessLevel>>()
    for (const o of allOverrides) {
      if (!overrideMap.has(o.user_id)) overrideMap.set(o.user_id, new Map())
      overrideMap.get(o.user_id)!.set(o.space, o.access_level as AccessLevel)
    }

    const users: UserRow[] = (profiles ?? []).map((p) => {
      const userOverrides = overrideMap.get(p.id)
      const overrides = Object.fromEntries(
        PLATFORM_SPACES.map((space) => [space, userOverrides?.get(space) ?? null])
      ) as Record<PlatformSpace, AccessLevel | null>
      return { id: p.id, name: p.name ?? null, email: null, role: p.role ?? null, overrides }
    })

    const overrideCount = users.reduce((sum, u) => sum + Object.values(u.overrides).filter(Boolean).length, 0)
    const pageError: string | null = profilesError
      ? `profiles: ${profilesError.message}`
      : overrideError
        ? overrideError.code === '42P01'
          ? 'overrides: relation "user_space_permissions" does not exist (migration 00022 likely not applied)'
          : `overrides: ${overrideError.message}`
        : null

    return { users, overrideCount, pageError }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { users: [], overrideCount: 0, pageError: `unexpected: ${message}` }
  }
}
