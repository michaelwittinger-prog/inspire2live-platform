import { PLATFORM_SPACES, ROLE_SPACE_DEFAULTS } from '@/lib/permissions'
import type { AccessLevel, PlatformSpace } from '@/lib/permissions'
import type { PlatformRole } from '@/lib/platform-roles'

export type RoleDefaultsMatrix = Record<PlatformRole, Record<PlatformSpace, AccessLevel>>

export type AdminRoleDefaultsData = {
  roleDefaults: RoleDefaultsMatrix
  warning: string | null
}

const VALID_LEVELS = new Set<AccessLevel>(['invisible', 'view', 'edit', 'manage'])

function cloneDefaults(): RoleDefaultsMatrix {
  return Object.fromEntries(
    (Object.keys(ROLE_SPACE_DEFAULTS) as PlatformRole[]).map((role) => [
      role,
      Object.fromEntries(
        PLATFORM_SPACES.map((space) => [space, ROLE_SPACE_DEFAULTS[role][space]])
      ) as Record<PlatformSpace, AccessLevel>,
    ])
  ) as RoleDefaultsMatrix
}

/**
 * Loads platform role default overrides from DB and merges them over static defaults.
 * If table is missing, returns static defaults with a warning (non-fatal).
 */
export async function loadAdminRoleDefaultsData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<AdminRoleDefaultsData> {
  const roleDefaults = cloneDefaults()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('role_space_default_overrides')
      .select('role, space, access_level')

    if (error) {
      if ((error as { code?: string }).code === '42P01') {
        return {
          roleDefaults,
          warning: 'role defaults: relation "role_space_default_overrides" does not exist (migration 00023 likely not applied)',
        }
      }
      return { roleDefaults, warning: `role defaults: ${error.message}` }
    }

    for (const row of data ?? []) {
      const role = row.role as PlatformRole
      const space = row.space as PlatformSpace
      const access = row.access_level as AccessLevel

      if (!(role in roleDefaults)) continue
      if (!PLATFORM_SPACES.includes(space)) continue
      if (!VALID_LEVELS.has(access)) continue

      roleDefaults[role][space] = access
    }

    return { roleDefaults, warning: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { roleDefaults, warning: `role defaults unexpected: ${message}` }
  }
}
