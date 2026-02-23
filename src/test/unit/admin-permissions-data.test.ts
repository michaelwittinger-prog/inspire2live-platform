import { describe, expect, it } from 'vitest'
import { loadAdminPermissionsData } from '@/lib/admin-permissions-data'

type QueryResponse<T> = { data: T | null; error: { message: string; code?: string } | null }

function makeSupabaseMock(opts: {
  profiles?: QueryResponse<{ id: string; name: string | null; email?: string | null; role: string | null }[]>
  overrides?: QueryResponse<{ user_id: string; space: string; access_level: string }[]>
  scopedOverrides?: QueryResponse<
    { user_id: string; space: string; access_level: string; scope_type: string; scope_id: string | null; updated_at: string | null }[]
  >
  audit?: QueryResponse<
    { target_user_id: string; change_type: string; created_at: string; new_value: Record<string, unknown> | null }[]
  >
  throwOnOverrides?: boolean
}) {
  const profiles = opts.profiles ?? { data: [], error: null }
  const overrides = opts.overrides ?? { data: [], error: null }
  const scopedOverrides = opts.scopedOverrides ?? { data: [], error: null }
  const audit = opts.audit ?? { data: [], error: null }

  return {
    from: (table: 'profiles' | 'user_space_permissions' | 'permission_audit_log') => ({
      select: (_columns: string) => {
        if (table === 'profiles') {
          return {
            order: async (_column: string) => profiles,
            eq: async (_column: string, _value: string) => ({ data: [], error: null }),
          }
        }

        if (table === 'user_space_permissions') {
          return {
            order: async (_column: string) => ({ data: [], error: null }),
            eq: async (_column: string, _value: string) => {
              if (opts.throwOnOverrides) throw new Error('simulated override query crash')
              return overrides
            },
            neq: async (_column: string, _value: string) => scopedOverrides,
          }
        }

        return {
          order: (_column: string, _opts?: { ascending?: boolean }) => ({
            limit: async (_n: number) => audit,
          }),
        }
      },
    }),
  }
}

describe('loadAdminPermissionsData', () => {
  it('builds users and override count on happy path', async () => {
    const supabase = makeSupabaseMock({
      profiles: {
        data: [{ id: 'u1', name: 'Ada', email: 'ada@example.org', role: 'PlatformAdmin' }],
        error: null,
      },
      overrides: {
        data: [{ user_id: 'u1', space: 'dashboard', access_level: 'manage' }],
        error: null,
      },
    })

    const result = await loadAdminPermissionsData(supabase)

    expect(result.pageError).toBeNull()
    expect(result.users).toHaveLength(1)
    expect(result.users[0].name).toBe('Ada')
    expect(result.users[0].email).toBe('ada@example.org')
    expect(result.users[0].overrides.dashboard).toBe('manage')
    expect(result.overrideCount).toBe(1)
  })

  it('maps missing relation 42P01 to migration guidance', async () => {
    const supabase = makeSupabaseMock({
      profiles: { data: [{ id: 'u1', name: 'Ada', email: 'ada@example.org', role: 'PlatformAdmin' }], error: null },
      overrides: {
        data: null,
        error: { message: 'relation "user_space_permissions" does not exist', code: '42P01' },
      },
    })

    const result = await loadAdminPermissionsData(supabase)

    expect(result.pageError).toContain('migration 00022 likely not applied')
    expect(result.users).toHaveLength(1)
  })

  it('includes scoped override and audit previews', async () => {
    const supabase = makeSupabaseMock({
      profiles: {
        data: [{ id: 'u1', name: 'Ada', email: 'ada@example.org', role: 'PlatformAdmin' }],
        error: null,
      },
      scopedOverrides: {
        data: [
          {
            user_id: 'u1',
            space: 'dashboard',
            access_level: 'edit',
            scope_type: 'initiative',
            scope_id: 'init-1',
            updated_at: '2026-02-23T22:00:00Z',
          },
        ],
        error: null,
      },
      audit: {
        data: [
          {
            target_user_id: 'u1',
            change_type: 'permission_override',
            created_at: '2026-02-23T22:01:00Z',
            new_value: { space: 'dashboard', access_level: 'edit', scope_type: 'initiative', scope_id: 'init-1' },
          },
        ],
        error: null,
      },
    })

    const result = await loadAdminPermissionsData(supabase)

    expect(result.users[0].scopedOverrideCounts.dashboard).toBe(1)
    expect(result.users[0].recentScopedOverrides[0]?.scopeType).toBe('initiative')
    expect(result.users[0].recentAudit[0]?.summary).toContain('dashboard: edit (initiative:init-1)')
  })

  it('returns profiles error when profiles query fails', async () => {
    const supabase = makeSupabaseMock({
      profiles: { data: null, error: { message: 'permission denied for table profiles' } },
    })

    const result = await loadAdminPermissionsData(supabase)

    expect(result.pageError).toBe('profiles: permission denied for table profiles')
    expect(result.users).toHaveLength(0)
  })

  it('catches unexpected thrown exceptions and returns a safe error', async () => {
    const supabase = makeSupabaseMock({ throwOnOverrides: true })

    const result = await loadAdminPermissionsData(supabase)

    expect(result.pageError).toContain('unexpected: simulated override query crash')
    expect(result.users).toEqual([])
    expect(result.overrideCount).toBe(0)
  })
})
