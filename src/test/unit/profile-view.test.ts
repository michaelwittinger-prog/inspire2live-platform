import { describe, expect, it } from 'vitest'
import {
  formatMemberSince,
  getProfileInitials,
  humanizeAction,
  normalizeExpertiseTags,
  parseExpertiseInput,
} from '@/lib/profile-view'

describe('profile-view helpers', () => {
  it('derives initials safely', () => {
    expect(getProfileInitials('Maria Silva')).toBe('MS')
    expect(getProfileInitials('  ')).toBe('U')
  })

  it('formats member since string', () => {
    expect(formatMemberSince('2026-01-10T00:00:00Z')).toMatch(/January|Jan/)
    expect(formatMemberSince(null)).toBe('Unknown')
  })

  it('normalizes expertise tags', () => {
    expect(normalizeExpertiseTags([' Advocacy ', '', 'Research'])).toEqual(['Advocacy', 'Research'])
    expect(normalizeExpertiseTags(null)).toEqual([])
  })

  it('parses expertise input to unique values', () => {
    expect(parseExpertiseInput('Policy, Advocacy, Policy')).toEqual(['Policy', 'Advocacy'])
  })

  it('humanizes action values', () => {
    expect(humanizeAction('task_completed')).toBe('task completed')
  })
})
