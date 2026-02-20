import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import {
  computeDecisionStats,
  daysUntil,
  enrichDecisions,
  formatEventDates,
  getProgramPhase,
  hoursElapsed,
  normalizeConversionStatus,
  normalizeEventStatus,
  normalizeSessionType,
  normalizeTopicStatus,
  slaBadge,
  slaHoursRemaining,
  type CongressDecision,
  type CongressEvent,
} from '@/lib/congress'

describe('congress helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('normalizes unknown enum-like values safely', () => {
    expect(normalizeEventStatus('live')).toBe('live')
    expect(normalizeEventStatus('UNKNOWN')).toBe('planning')

    expect(normalizeTopicStatus('approved')).toBe('approved')
    expect(normalizeTopicStatus('UNKNOWN')).toBe('submitted')

    expect(normalizeConversionStatus('converted')).toBe('converted')
    expect(normalizeConversionStatus('UNKNOWN')).toBe('pending')

    expect(normalizeSessionType('panel')).toBe('panel')
    expect(normalizeSessionType('UNKNOWN')).toBe('plenary')
  })

  it('formats event date ranges', () => {
    expect(formatEventDates('2026-11-13', null)).toBe('13 November 2026')
    expect(formatEventDates('2026-11-13', '2026-11-13')).toBe('13 November 2026')
    expect(formatEventDates('2026-11-13', '2026-11-14')).toBe('13–14 November 2026')
    expect(formatEventDates('2026-11-30', '2026-12-01')).toBe('30 November – 1 December 2026')
  })

  it('computes relative time helpers', () => {
    expect(daysUntil(null)).toBeNull()
    expect(daysUntil('2026-01-02T00:00:00.000Z')).toBe(1)

    vi.setSystemTime(new Date('2026-01-03T00:00:00.000Z'))
    expect(hoursElapsed('2026-01-01T00:00:00.000Z')).toBe(48)
    expect(slaHoursRemaining('2026-01-01T00:00:00.000Z')).toBe(0)
  })

  it('classifies SLA badge correctly for pending and non-pending decisions', () => {
    vi.setSystemTime(new Date('2026-01-03T00:00:00.000Z'))

    const base: Omit<CongressDecision, 'conversion_status' | 'captured_at'> = {
      id: 'd1',
      title: 'Decision',
      body: null,
      description: null,
      event_id: null,
      congress_year: 2026,
      session_id: null,
      initiative_id: null,
      owner_id: null,
      deadline: null,
      converted_task_id: null,
      carryover_to_event_id: null,
    }

    // Overdue (49h ago)
    const overdue = slaBadge({
      ...base,
      conversion_status: 'pending',
      captured_at: '2025-12-31T23:00:00.000Z',
    })
    expect(overdue.urgent).toBe(true)
    expect(overdue.badge).toContain('red')
    expect(overdue.label).toContain('overdue')

    // Urgent (<12h remaining): captured 40h ago => 8h remaining
    const urgent = slaBadge({
      ...base,
      conversion_status: 'pending',
      captured_at: '2026-01-01T08:00:00.000Z',
    })
    expect(urgent.urgent).toBe(true)
    expect(urgent.badge).toContain('orange')

    // Safe-ish: captured 20h ago => 28h remaining
    const safe = slaBadge({
      ...base,
      conversion_status: 'pending',
      captured_at: '2026-01-02T04:00:00.000Z',
    })
    expect(safe.urgent).toBe(false)
    expect(safe.badge).toContain('yellow')

    // Non-pending delegates to conversion meta
    const converted = slaBadge({
      ...base,
      conversion_status: 'converted',
      captured_at: '2026-01-02T04:00:00.000Z',
    })
    expect(converted.urgent).toBe(false)
    expect(converted.badge).toContain('green')
  })

  it('enriches decisions and computes stats', () => {
    vi.setSystemTime(new Date('2026-01-03T00:00:00.000Z'))

    const decisions: CongressDecision[] = [
      {
        id: 'a',
        title: 'A',
        body: null,
        description: null,
        event_id: null,
        congress_year: 2026,
        session_id: null,
        initiative_id: null,
        owner_id: null,
        deadline: null,
        conversion_status: 'pending',
        converted_task_id: null,
        captured_at: '2026-01-01T00:00:00.000Z', // 48h ago
        carryover_to_event_id: null,
      },
      {
        id: 'b',
        title: 'B',
        body: null,
        description: null,
        event_id: null,
        congress_year: 2026,
        session_id: null,
        initiative_id: null,
        owner_id: null,
        deadline: null,
        conversion_status: 'converted',
        converted_task_id: 't1',
        captured_at: '2026-01-02T00:00:00.000Z',
        carryover_to_event_id: null,
      },
      {
        id: 'c',
        title: 'C',
        body: null,
        description: null,
        event_id: null,
        congress_year: 2026,
        session_id: null,
        initiative_id: null,
        owner_id: null,
        deadline: null,
        conversion_status: 'declined',
        converted_task_id: null,
        captured_at: '2026-01-02T00:00:00.000Z',
        carryover_to_event_id: null,
      },
    ]

    const enriched = enrichDecisions(decisions)
    expect(enriched[0].hours_since_capture).toBeCloseTo(48, 5)
    expect(enriched[0].sla_hours_remaining).toBeCloseTo(0, 5)

    const stats = computeDecisionStats(enriched)
    expect(stats.total).toBe(3)
    expect(stats.pending).toBe(1)
    expect(stats.converted).toBe(1)
    expect(stats.declined).toBe(1)
    expect(stats.conversion_rate_pct).toBe(33)
  })

  it('derives program phase from status and dates', () => {
    const baseEvent: Omit<CongressEvent, 'status' | 'start_date'> = {
      id: 'e',
      year: 2026,
      title: 'Congress 2026',
      description: null,
      location: null,
      end_date: null,
      theme_headline: null,
      parent_event_id: null,
      created_at: '2026-01-01T00:00:00.000Z',
    }

    expect(getProgramPhase({ ...baseEvent, status: 'archived', start_date: '2026-11-13T00:00:00.000Z' })).toBe('archived')
    expect(getProgramPhase({ ...baseEvent, status: 'live', start_date: '2026-11-13T00:00:00.000Z' })).toBe('live')
    expect(getProgramPhase({ ...baseEvent, status: 'post_congress', start_date: '2026-11-13T00:00:00.000Z' })).toBe('post')

    // Missing start_date defaults to months_out
    expect(getProgramPhase({ ...baseEvent, status: 'planning', start_date: null })).toBe('months_out')

    // Open for topics: >30 days => topics_open
    expect(getProgramPhase({ ...baseEvent, status: 'open_for_topics', start_date: '2026-03-15T00:00:00.000Z' })).toBe('topics_open')

    // Open for topics but close to event => agenda_building
    expect(getProgramPhase({ ...baseEvent, status: 'open_for_topics', start_date: '2026-01-20T00:00:00.000Z' })).toBe('agenda_building')

    // Agenda set and imminent (<= 14 days)
    expect(getProgramPhase({ ...baseEvent, status: 'agenda_set', start_date: '2026-01-10T00:00:00.000Z' })).toBe('imminent')
  })
})
