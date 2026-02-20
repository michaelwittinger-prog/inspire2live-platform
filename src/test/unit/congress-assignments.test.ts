import { describe, expect, it } from 'vitest'
import { isAssignmentEffectiveOn, rowToCongressAssignment } from '@/lib/congress-assignments'
import type { CongressAssignmentRow } from '@/lib/congress-assignments'

describe('congress-assignments', () => {
  it('maps a DB row into the domain model', () => {
    const row: CongressAssignmentRow = {
      id: 'a1',
      user_id: 'u1',
      congress_id: 'c1',
      project_role: 'Ops Lead',
      scope_all: true,
      workstream_ids: [],
      effective_from: '2026-01-01',
      effective_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const a = rowToCongressAssignment(row)
    expect(a.projectRole).toBe('Ops Lead')
    expect(a.scope.kind).toBe('all')
  })

  it('evaluates effective date windows correctly', () => {
    const a = {
      id: 'a1',
      userId: 'u1',
      congressId: 'c1',
      projectRole: 'Ops Lead' as const,
      scope: { kind: 'all' as const },
      effectiveFrom: '2026-01-10',
      effectiveTo: '2026-02-10',
    }

    expect(isAssignmentEffectiveOn(a, '2026-01-09')).toBe(false)
    expect(isAssignmentEffectiveOn(a, '2026-01-10')).toBe(true)
    expect(isAssignmentEffectiveOn(a, '2026-02-10')).toBe(true)
    expect(isAssignmentEffectiveOn(a, '2026-02-11')).toBe(false)
  })
})
