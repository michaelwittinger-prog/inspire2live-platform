import { describe, expect, it } from 'vitest'
import {
  canManageInitiativeWorkspace,
  groupTasksByStatus,
  priorityTone,
} from '@/lib/initiative-workspace'

describe('initiative workspace helpers', () => {
  it('groups tasks by canonical status', () => {
    const grouped = groupTasksByStatus([
      { id: '1', title: 'A', status: 'todo', priority: 'high', assignee_id: 'u1', due_date: null },
      { id: '2', title: 'B', status: 'blocked', priority: 'urgent', assignee_id: 'u2', due_date: null },
    ])

    expect(grouped.todo).toHaveLength(1)
    expect(grouped.blocked).toHaveLength(1)
    expect(grouped.review).toHaveLength(0)
  })

  it('determines manage permission from platform role and member role', () => {
    expect(canManageInitiativeWorkspace('PlatformAdmin', null)).toBe(true)
    expect(canManageInitiativeWorkspace('PatientAdvocate', 'lead')).toBe(true)
    expect(canManageInitiativeWorkspace('PatientAdvocate', 'contributor')).toBe(false)
  })

  it('returns priority tones', () => {
    expect(priorityTone('urgent')).toContain('red')
    expect(priorityTone('high')).toContain('orange')
    expect(priorityTone('medium')).toContain('amber')
    expect(priorityTone('low')).toContain('neutral')
  })
})
