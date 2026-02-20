import { describe, expect, it } from 'vitest'
import { canPerformCongressAction, responsibilitySummary } from '@/lib/congress-policy'

describe('congress-policy', () => {
  it('denies edits for non-editor platform roles', () => {
    const res = canPerformCongressAction('PatientAdvocate', 'update_task')
    expect(res.allowed).toBe(false)
  })

  it('allows edits for coordinator/admin platform roles', () => {
    expect(canPerformCongressAction('HubCoordinator', 'update_task').allowed).toBe(true)
    expect(canPerformCongressAction('PlatformAdmin', 'update_task').allowed).toBe(true)
  })

  it('surfaces responsibility/permission conflicts with clear messaging', () => {
    const msg = responsibilitySummary('PatientAdvocate', ['Ops Lead'])
    expect(msg.tone).toBe('warning')
    expect(msg.message).toMatch(/read-only/i)
  })
})
