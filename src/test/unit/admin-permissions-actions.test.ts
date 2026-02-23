import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockRevalidatePath = vi.fn()

const mockAuthGetUser = vi.fn()
const mockProfilesSingle = vi.fn()

const mockPermissionsMaybeSingle = vi.fn()
const mockPermissionsUpsert = vi.fn()
const mockPermissionsDeleteFinal = vi.fn()

const mockAuditInsert = vi.fn()
const mockRoleDefaultsUpsert = vi.fn()

function buildProfilesTable() {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: mockProfilesSingle,
      })),
    })),
  }
}

function buildPermissionsTable() {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({ maybeSingle: mockPermissionsMaybeSingle })),
          })),
        })),
      })),
    })),
    upsert: mockPermissionsUpsert,
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: mockPermissionsDeleteFinal,
          })),
        })),
      })),
    })),
  }
}

function buildAuditTable() {
  return {
    insert: mockAuditInsert,
  }
}

function buildRoleDefaultsTable() {
  return {
    upsert: mockRoleDefaultsUpsert,
  }
}

const mockSupabase = {
  auth: {
    getUser: mockAuthGetUser,
  },
  from: vi.fn((table: string) => {
    if (table === 'profiles') return buildProfilesTable()
    if (table === 'user_space_permissions') return buildPermissionsTable()
    if (table === 'permission_audit_log') return buildAuditTable()
    if (table === 'role_space_default_overrides') return buildRoleDefaultsTable()
    throw new Error(`Unexpected table: ${table}`)
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}))

describe('admin permission actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } })
    mockProfilesSingle.mockResolvedValue({ data: { role: 'PlatformAdmin' }, error: null })

    mockPermissionsMaybeSingle.mockResolvedValue({ data: { access_level: 'view' }, error: null })
    mockPermissionsUpsert.mockResolvedValue({ error: null })
    mockPermissionsDeleteFinal.mockResolvedValue({ error: null })

    mockAuditInsert.mockResolvedValue({ error: null })
    mockRoleDefaultsUpsert.mockResolvedValue({ error: null })
  })

  it('validates scopeId must be present for scoped overrides', async () => {
    const { setPermissionOverride } = await import('@/app/app/admin/permissions/actions')

    const result = await setPermissionOverride({
      targetUserId: 'user-1',
      space: 'dashboard',
      accessLevel: 'view',
      scopeType: 'initiative',
    })

    expect(result.error).toBe('scopeId is required for scoped permissions')
  })

  it('validates scopeId must be empty for global overrides', async () => {
    const { setPermissionOverride } = await import('@/app/app/admin/permissions/actions')

    const result = await setPermissionOverride({
      targetUserId: 'user-1',
      space: 'dashboard',
      accessLevel: 'view',
      scopeType: 'global',
      scopeId: 'initiative-1',
    })

    expect(result.error).toBe('scopeId must be empty when scopeType is global')
  })

  it('writes override + audit log on success', async () => {
    const { setPermissionOverride } = await import('@/app/app/admin/permissions/actions')

    const result = await setPermissionOverride({
      targetUserId: 'user-1',
      space: 'dashboard',
      accessLevel: 'manage',
    })

    expect(result.error).toBeNull()
    expect(mockPermissionsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        space: 'dashboard',
        access_level: 'manage',
        scope_type: 'global',
        scope_id: null,
        granted_by: 'admin-1',
      }),
      { onConflict: 'user_id,space,scope_type,scope_id', ignoreDuplicates: false }
    )
    expect(mockAuditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        target_user_id: 'user-1',
        changed_by: 'admin-1',
        change_type: 'permission_override',
      })
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith('/app/admin/permissions')
  })

  it('validates scope rules in removePermissionOverride as well', async () => {
    const { removePermissionOverride } = await import('@/app/app/admin/permissions/actions')

    const result = await removePermissionOverride('user-1', 'dashboard', 'congress')

    expect(result.error).toBe('scopeId is required for scoped permissions')
  })

  it('rejects invalid role default space values', async () => {
    const { setRoleDefaultOverride } = await import('@/app/app/admin/permissions/actions')

    const result = await setRoleDefaultOverride({
      role: 'Clinician',
      space: 'not-a-space' as unknown as 'dashboard',
      accessLevel: 'view',
    })

    expect(result.error).toBe('Invalid space value')
  })

  it('returns migration guidance if role default table is missing', async () => {
    mockRoleDefaultsUpsert.mockResolvedValue({
      error: { message: 'relation missing', code: '42P01' },
    })

    const { setRoleDefaultOverride } = await import('@/app/app/admin/permissions/actions')

    const result = await setRoleDefaultOverride({
      role: 'Clinician',
      space: 'dashboard',
      accessLevel: 'view',
    })

    expect(result.error).toBe('role defaults table missing (migration 00023 required)')
  })
})
