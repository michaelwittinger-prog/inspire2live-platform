import { describe, expect, it } from 'vitest'
import {
  getDefaultAttendanceKind,
  getEventSetupContent,
  isI2LOwnedEvent,
  requiresOwnerAssignment,
  supportsAttendanceSetup,
} from '@/lib/comms-events'

describe('communications event setup rules', () => {
  it('treats podcasts as I2L-owned events with a required owner', () => {
    expect(
      isI2LOwnedEvent({
        eventType: 'podcast',
        isI2lOrganised: false,
        isAnnualCongress: false,
      })
    ).toBe(true)
    expect(
      requiresOwnerAssignment({
        eventType: 'podcast',
        isI2lOrganised: false,
        isAnnualCongress: false,
      })
    ).toBe(true)
    expect(
      supportsAttendanceSetup({
        eventType: 'podcast',
        isI2lOrganised: false,
        isAnnualCongress: false,
      })
    ).toBe(false)
  })

  it('keeps external conference attendance separate from owned-event ownership', () => {
    expect(
      requiresOwnerAssignment({
        eventType: 'conference',
        isI2lOrganised: false,
        isAnnualCongress: false,
      })
    ).toBe(false)
    expect(
      supportsAttendanceSetup({
        eventType: 'conference',
        isI2lOrganised: false,
        isAnnualCongress: false,
      })
    ).toBe(true)
    expect(
      getDefaultAttendanceKind({
        eventType: 'conference',
        isI2lOrganised: false,
        isAnnualCongress: false,
      })
    ).toBe('visitor')
  })

  it('uses owner-focused wording for I2L-owned event setups', () => {
    const setup = getEventSetupContent({
      eventType: 'workshop',
      isI2lOrganised: true,
      isAnnualCongress: false,
    })

    expect(setup.ownerLabel).toBe('Responsible owner')
    expect(setup.attendeeLegend).toBeNull()
    expect(setup.organiserLabel).toBe('Lead organiser / hosting team')
  })
})
