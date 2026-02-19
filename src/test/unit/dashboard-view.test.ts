import { describe, expect, it } from 'vitest'
import { buildDashboardGreeting, resolveDashboardVariant } from '@/lib/dashboard-view'

describe('resolveDashboardVariant', () => {
  it('maps coordinator/admin roles to coordinator dashboard', () => {
    expect(resolveDashboardVariant('HubCoordinator')).toBe('coordinator')
    expect(resolveDashboardVariant('PlatformAdmin')).toBe('coordinator')
  })

  it('maps board role to board dashboard', () => {
    expect(resolveDashboardVariant('BoardMember')).toBe('board')
  })

  it('falls back to advocate dashboard for unknown roles', () => {
    expect(resolveDashboardVariant('Unknown')).toBe('advocate')
    expect(resolveDashboardVariant(undefined)).toBe('advocate')
  })
})

describe('buildDashboardGreeting', () => {
  it('returns default greeting when no name exists', () => {
    expect(buildDashboardGreeting(null)).toBe('Welcome.')
  })

  it('returns first-name personalized greeting', () => {
    expect(buildDashboardGreeting('Maria Silva')).toBe('Good work, Maria.')
  })
})
