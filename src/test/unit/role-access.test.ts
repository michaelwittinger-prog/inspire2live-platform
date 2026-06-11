import { describe, expect, it } from 'vitest'
import { canAccessAppPath, getSideNavSections, normalizeRole } from '@/lib/role-access'
import { ROLE_SPACE_DEFAULTS } from '@/lib/permissions'
import type { PlatformRole } from '@/lib/platform-roles'

// The unified nav is permission-driven: it filters the single MASTER_NAV tree by a
// role's resolved space access. Tests feed the role-default matrix as the spaces map
// (server adds DB overrides on top in production).
const spacesFor = (role: PlatformRole) => ROLE_SPACE_DEFAULTS[role]
const labelsIn = (role: PlatformRole) =>
  getSideNavSections(spacesFor(role)).flatMap((s) => s.items.map((i) => i.label))

describe('normalizeRole', () => {
  it('falls back to PatientAdvocate for unknown values', () => {
    expect(normalizeRole('UnknownRole')).toBe('PatientAdvocate')
    expect(normalizeRole(undefined)).toBe('PatientAdvocate')
    expect(normalizeRole(null)).toBe('PatientAdvocate')
  })

  it('keeps known role values', () => {
    expect(normalizeRole('BoardMember')).toBe('BoardMember')
    expect(normalizeRole('PlatformAdmin')).toBe('PlatformAdmin')
  })
})

describe('canAccessAppPath', () => {
  it('allows public paths', () => {
    expect(canAccessAppPath('PatientAdvocate', '/login')).toBe(true)
    expect(canAccessAppPath('PatientAdvocate', '/')).toBe(true)
  })

  it('blocks BoardMember from bureau and tasks routes', () => {
    expect(canAccessAppPath('BoardMember', '/app/bureau')).toBe(false)
    expect(canAccessAppPath('BoardMember', '/app/tasks')).toBe(false)
  })

  it('allows HubCoordinator to access bureau', () => {
    expect(canAccessAppPath('HubCoordinator', '/app/bureau')).toBe(true)
  })

  it('blocks IndustryPartner from tasks, allows partners', () => {
    expect(canAccessAppPath('IndustryPartner', '/app/tasks')).toBe(false)
    expect(canAccessAppPath('IndustryPartner', '/app/partners')).toBe(true)
  })

  it('allows PatientAdvocate to access stories', () => {
    expect(canAccessAppPath('PatientAdvocate', '/app/stories')).toBe(true)
  })
})

describe('getSideNavSections — one permission-driven tree', () => {
  it('starts with Overview/Dashboard for every role', () => {
    const sections = getSideNavSections(spacesFor('PatientAdvocate'))
    expect(sections.length).toBeGreaterThan(1)
    expect(sections.every((s) => s.label && s.items.length > 0)).toBe(true)
    expect(sections[0]?.label).toBe('Overview')
    expect(sections[0]?.items[0]?.href).toBe('/app/dashboard')
  })

  it('preserves the Comms blueprint workspace items and the campus badge', () => {
    const workspace = getSideNavSections(spacesFor('Comms')).find((s) => s.label === 'Workspace')
    // Comms keeps its blueprint comms items, and (permission-driven) also gains
    // Initiatives, which it can view.
    expect(workspace?.items.map((i) => i.label)).toEqual([
      'Planner',
      'Campus',
      'WhatsApp',
      'CRM',
      'Initiatives',
    ])
    expect(workspace?.items.find((i) => i.label === 'Campus')?.badge).toBe('campus')
  })

  it('never surfaces Profile, Tasks, Bureau, or Partners as nav items', () => {
    for (const role of Object.keys(ROLE_SPACE_DEFAULTS) as PlatformRole[]) {
      const labels = labelsIn(role)
      expect(labels).not.toContain('Profile')
      expect(labels).not.toContain('Tasks')
      expect(labels).not.toContain('My Tasks')
      expect(labels).not.toContain('Bureau')
      expect(labels).not.toContain('Partners')
    }
  })

  it('hides comms items from roles without comms access (Moderator)', () => {
    const labels = labelsIn('Moderator')
    expect(labels).not.toContain('Planner')
    expect(labels).not.toContain('CRM')
    // but shared spaces it can view are present
    expect(labels).toContain('Stories')
    expect(labels).toContain('Initiatives')
  })

  it('shows the full extended tree for PlatformAdmin, incl. User Management', () => {
    const sections = getSideNavSections(spacesFor('PlatformAdmin'))
    const account = sections.find((s) => s.label === 'Account')
    expect(account?.items.some((i) => i.id === 'admin')).toBe(true)
    const labels = sections.flatMap((s) => s.items.map((i) => i.label))
    expect(labels).toEqual(expect.arrayContaining(['Planner', 'CRM', 'Board', 'User Management']))
  })

  it('reveals comms items when a space override grants access', () => {
    const base = spacesFor('PatientAdvocate')
    expect(labelsIn('PatientAdvocate')).not.toContain('Planner')
    const withComms = { ...base, comms: 'view' as const }
    const labels = getSideNavSections(withComms).flatMap((s) => s.items.map((i) => i.label))
    expect(labels).toContain('Planner')
  })

  it('uses a single canonical dashboard and congress href for all roles', () => {
    for (const role of Object.keys(ROLE_SPACE_DEFAULTS) as PlatformRole[]) {
      const items = getSideNavSections(spacesFor(role)).flatMap((s) => s.items)
      const dashboard = items.find((i) => i.id === 'dashboard')
      const congress = items.find((i) => i.id === 'congress')
      expect(dashboard?.href).toBe('/app/dashboard')
      if (congress) expect(congress.href).toBe('/app/congress')
    }
  })
})
