import { describe, expect, it } from 'vitest'
import { loadAdminRoleDefaultsData } from '@/lib/admin-role-defaults-data'

type QueryResponse<T> = { data: T | null; error: { message: string; code?: string } | null }

function makeSupabaseMock(opts: {
  rows?: QueryResponse<{ role: string; space: string; access_level: string }[]>
  throwOnQuery?: boolean
}) {
  const rows = opts.rows ?? { data: [], error: null }

  return {
    from: (_table: 'role_space_default_overrides') => ({
      select: async (_columns: string) => {
        if (opts.throwOnQuery) throw new Error('simulated role-defaults query crash')
        return rows
      },
    }),
  }
}

describe('loadAdminRoleDefaultsData', () => {
  it('loads override rows and merges onto defaults', async () => {
    const supabase = makeSupabaseMock({
      rows: {
        data: [{ role: 'Clinician', space: 'admin', access_level: 'view' }],
        error: null,
      },
    })

    const result = await loadAdminRoleDefaultsData(supabase)

    expect(result.warning).toBeNull()
    expect(result.roleDefaults.Clinician.admin).toBe('view')
  })

  it('returns guidance warning when relation is missing (42P01)', async () => {
    const supabase = makeSupabaseMock({
      rows: {
        data: null,
        error: { message: 'relation "role_space_default_overrides" does not exist', code: '42P01' },
      },
    })

    const result = await loadAdminRoleDefaultsData(supabase)

    expect(result.warning).toContain('migration 00023 likely not applied')
    expect(result.roleDefaults.PatientAdvocate.dashboard).toBe('view')
  })

  it('catches unexpected exceptions and returns safe warning', async () => {
    const supabase = makeSupabaseMock({ throwOnQuery: true })

    const result = await loadAdminRoleDefaultsData(supabase)

    expect(result.warning).toContain('unexpected')
  })
})
