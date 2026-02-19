import { describe, it, expect } from 'vitest'
import { deriveRAGStatus, ragColorClass } from '@/lib/rag-status'

const TODAY = '2026-02-19'

describe('deriveRAGStatus', () => {
  it('returns green when item is completed, regardless of due date or blocker', () => {
    expect(
      deriveRAGStatus({
        dueDate: '2026-02-01', // past
        hasBlocker: true,
        completed: true,
        today: TODAY,
      })
    ).toBe('green')
  })

  it('returns red when there is an active blocker (not completed)', () => {
    expect(
      deriveRAGStatus({
        dueDate: '2026-03-15', // future
        hasBlocker: true,
        completed: false,
        today: TODAY,
      })
    ).toBe('red')
  })

  it('returns red when the item is overdue (past due date, no blocker)', () => {
    expect(
      deriveRAGStatus({
        dueDate: '2026-02-10', // in the past
        hasBlocker: false,
        completed: false,
        today: TODAY,
      })
    ).toBe('red')
  })

  it('returns amber when due date is within 7 days', () => {
    expect(
      deriveRAGStatus({
        dueDate: '2026-02-24', // 5 days from TODAY
        hasBlocker: false,
        completed: false,
        today: TODAY,
      })
    ).toBe('amber')
  })

  it('returns amber when due date is exactly today', () => {
    expect(
      deriveRAGStatus({
        dueDate: TODAY,
        hasBlocker: false,
        completed: false,
        today: TODAY,
      })
    ).toBe('amber')
  })

  it('returns green when due date is more than 7 days away and no issues', () => {
    expect(
      deriveRAGStatus({
        dueDate: '2026-03-15', // 24 days from TODAY
        hasBlocker: false,
        completed: false,
        today: TODAY,
      })
    ).toBe('green')
  })

  it('returns red for overdue even if dueDate is only 1 day ago', () => {
    expect(
      deriveRAGStatus({
        dueDate: '2026-02-18', // yesterday
        hasBlocker: false,
        completed: false,
        today: TODAY,
      })
    ).toBe('red')
  })
})

describe('ragColorClass', () => {
  it('returns red classes for red status', () => {
    expect(ragColorClass('red')).toContain('red')
  })

  it('returns amber classes for amber status', () => {
    expect(ragColorClass('amber')).toContain('amber')
  })

  it('returns green classes for green status', () => {
    expect(ragColorClass('green')).toContain('green')
  })
})
