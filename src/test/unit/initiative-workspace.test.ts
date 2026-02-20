import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  canManageInitiativeWorkspace,
  groupTasksByStatus,
  taskStatusStyle,
  milestoneStatusConfig,
  threadTypeConfig,
  translationBadge,
  resourceTypeIcon,
  memberRoleLabel,
  memberRoleStyle,
  activityLevel,
  activityDotStyle,
  priorityTone,
} from '@/lib/initiative-workspace'

describe('initiative workspace helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

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

  it('returns task status styles', () => {
    expect(taskStatusStyle('done')).toContain('emerald')
    expect(taskStatusStyle('in_progress')).toContain('blue')
    expect(taskStatusStyle('review')).toContain('violet')
    expect(taskStatusStyle('blocked')).toContain('red')
    expect(taskStatusStyle('unknown')).toContain('neutral')
  })

  it('returns milestone status config', () => {
    expect(milestoneStatusConfig('completed').badge).toContain('emerald')
    expect(milestoneStatusConfig('in_progress').dot).toContain('blue')
    expect(milestoneStatusConfig('overdue').label).toBe('Overdue')
    expect(milestoneStatusConfig('unknown').label).toBe('Upcoming')
  })

  it('returns discussion thread type config', () => {
    expect(threadTypeConfig('decision').style).toContain('blue')
    expect(threadTypeConfig('question').label).toBe('Question')
    expect(threadTypeConfig('blocker').style).toContain('red')
    expect(threadTypeConfig('idea').style).toContain('violet')
    expect(threadTypeConfig('unknown').label).toBe('General')
  })

  it('returns evidence translation badge config', () => {
    expect(translationBadge('translated').style).toContain('emerald')
    expect(translationBadge('needs_translation').label).toContain('Needs')
    expect(translationBadge('unknown').label).toBe('Original')
  })

  it('returns resource icons', () => {
    expect(resourceTypeIcon('document')).toBe('📄')
    expect(resourceTypeIcon('data')).toBe('📊')
    expect(resourceTypeIcon('recording')).toBe('🎥')
    expect(resourceTypeIcon('template')).toBe('📋')
    expect(resourceTypeIcon('report')).toBe('📑')
    expect(resourceTypeIcon('link')).toBe('🔗')
    expect(resourceTypeIcon('unknown')).toBe('📎')
  })

  it('returns member role styles/labels', () => {
    expect(memberRoleStyle('lead')).toContain('primary')
    expect(memberRoleLabel('lead')).toBe('Lead')
    expect(memberRoleStyle('reviewer')).toContain('violet')
    expect(memberRoleLabel('partner')).toBe('Partner')
    expect(memberRoleLabel('unknown')).toBe('Contributor')
  })

  it('computes activity levels and dot styles', () => {
    const now = Date.now()
    const mk = (daysAgo: number) => new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString()

    expect(activityLevel(undefined)).toBe('inactive')
    expect(activityLevel(null)).toBe('inactive')
    expect(activityLevel(mk(3))).toBe('active')
    expect(activityLevel(mk(10))).toBe('recent')
    expect(activityLevel(mk(30))).toBe('inactive')

    expect(activityDotStyle('active')).toContain('emerald')
    expect(activityDotStyle('recent')).toContain('amber')
    expect(activityDotStyle('inactive')).toContain('neutral')
  })
})
