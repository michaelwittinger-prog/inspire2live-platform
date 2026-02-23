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

    const users: UserRow[] = (profiles ?? []).map((p: { id: string; name: string | null; role: string | null }) => {
      const userOverrides = overrideMap.get(p.id)
      const overrides = Object.fromEntries(
        PLATFORM_SPACES.map((space) => [space, userOverrides?.get(space) ?? null])
      ) as Record<PlatformSpace, AccessLevel | null>
      return { id: p.id, name: p.name || null, email: null, role: p.role || null, overrides }
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