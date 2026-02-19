export type PlatformRole =
  | 'PatientAdvocate'
  | 'Clinician'
  | 'Researcher'
  | 'HubCoordinator'
  | 'IndustryPartner'
  | 'BoardMember'
  | 'PlatformAdmin'

export type NavKey =
  | 'dashboard'
  | 'initiatives'
  | 'tasks'
  | 'bureau'
  | 'congress'
  | 'resources'
  | 'partners'
  | 'notifications'
  | 'profile'

export type NavItemConfig = {
  key: NavKey
  label: string
  href: string
}

const DEFAULT_ROLE: PlatformRole = 'PatientAdvocate'

const ACCESS_BY_ROLE: Record<PlatformRole, string[]> = {
  PatientAdvocate:  ['dashboard', 'initiatives', 'tasks', 'congress', 'resources', 'notifications', 'profile'],
  Clinician:        ['dashboard', 'initiatives', 'tasks', 'congress', 'resources', 'notifications', 'profile'],
  Researcher:       ['dashboard', 'initiatives', 'tasks', 'congress', 'resources', 'notifications', 'profile'],
  IndustryPartner:  ['dashboard', 'partners', 'congress', 'resources', 'notifications', 'profile'],
  BoardMember:      ['dashboard', 'initiatives', 'congress', 'resources', 'notifications', 'profile'],
  HubCoordinator:   ['dashboard', 'bureau', 'initiatives', 'tasks', 'congress', 'partners', 'resources', 'notifications', 'profile'],
  PlatformAdmin:    ['dashboard', 'bureau', 'initiatives', 'tasks', 'congress', 'partners', 'resources', 'notifications', 'profile'],
}

const NAV_BY_ROLE: Record<PlatformRole, NavItemConfig[]> = {
  PatientAdvocate: [
    { key: 'dashboard',     label: 'Dashboard',      href: '/app/dashboard' },
    { key: 'initiatives',   label: 'My Initiatives', href: '/app/initiatives' },
    { key: 'tasks',         label: 'My Tasks',       href: '/app/tasks' },
    { key: 'congress',      label: 'Congress',       href: '/app/congress' },
    { key: 'resources',     label: 'Resources',      href: '/app/resources' },
    { key: 'profile',       label: 'Profile',        href: '/app/profile' },
  ],
  Clinician: [
    { key: 'dashboard',     label: 'Dashboard',      href: '/app/dashboard' },
    { key: 'initiatives',   label: 'My Initiatives', href: '/app/initiatives' },
    { key: 'tasks',         label: 'My Tasks',       href: '/app/tasks' },
    { key: 'congress',      label: 'Congress',       href: '/app/congress' },
    { key: 'resources',     label: 'Resources',      href: '/app/resources' },
    { key: 'profile',       label: 'Profile',        href: '/app/profile' },
  ],
  Researcher: [
    { key: 'dashboard',     label: 'Dashboard',      href: '/app/dashboard' },
    { key: 'initiatives',   label: 'My Initiatives', href: '/app/initiatives' },
    { key: 'tasks',         label: 'My Tasks',       href: '/app/tasks' },
    { key: 'congress',      label: 'Congress',       href: '/app/congress' },
    { key: 'resources',     label: 'Resources',      href: '/app/resources' },
    { key: 'profile',       label: 'Profile',        href: '/app/profile' },
  ],
  IndustryPartner: [
    { key: 'dashboard',     label: 'Dashboard',      href: '/app/dashboard' },
    { key: 'partners',      label: 'My Engagements', href: '/app/partners' },
    { key: 'congress',      label: 'Congress',       href: '/app/congress' },
    { key: 'resources',     label: 'Resources',      href: '/app/resources' },
    { key: 'profile',       label: 'Profile',        href: '/app/profile' },
  ],
  BoardMember: [
    { key: 'dashboard',     label: 'Board Overview', href: '/app/dashboard' },
    { key: 'initiatives',   label: 'Initiatives',    href: '/app/initiatives' },
    { key: 'congress',      label: 'Congress',       href: '/app/congress' },
    { key: 'resources',     label: 'Resources',      href: '/app/resources' },
    { key: 'profile',       label: 'Profile',        href: '/app/profile' },
  ],
  HubCoordinator: [
    { key: 'dashboard',     label: 'Dashboard',       href: '/app/dashboard' },
    { key: 'bureau',        label: 'Bureau',          href: '/app/bureau' },
    { key: 'initiatives',   label: 'All Initiatives', href: '/app/initiatives' },
    { key: 'congress',      label: 'Congress',        href: '/app/congress' },
    { key: 'partners',      label: 'Partners',        href: '/app/partners' },
    { key: 'resources',     label: 'Resources',       href: '/app/resources' },
    { key: 'profile',       label: 'Profile',         href: '/app/profile' },
  ],
  PlatformAdmin: [
    { key: 'dashboard',     label: 'Dashboard',       href: '/app/dashboard' },
    { key: 'bureau',        label: 'Bureau',          href: '/app/bureau' },
    { key: 'initiatives',   label: 'All Initiatives', href: '/app/initiatives' },
    { key: 'congress',      label: 'Congress',        href: '/app/congress' },
    { key: 'partners',      label: 'Partners',        href: '/app/partners' },
    { key: 'resources',     label: 'Resources',       href: '/app/resources' },
    { key: 'profile',       label: 'Profile',         href: '/app/profile' },
  ],
}

export function normalizeRole(role?: string | null): PlatformRole {
  if (!role) return DEFAULT_ROLE
  if (role in ACCESS_BY_ROLE) return role as PlatformRole
  return DEFAULT_ROLE
}

function getAppSection(pathname: string): string | null {
  if (!pathname.startsWith('/app')) return null
  if (pathname === '/app' || pathname === '/app/') return 'dashboard'
  const [, , section] = pathname.split('/')
  return section || 'dashboard'
}

export function canAccessAppPath(role: string | null | undefined, pathname: string): boolean {
  const section = getAppSection(pathname)
  if (!section) return true
  const normalized = normalizeRole(role)
  return ACCESS_BY_ROLE[normalized].includes(section)
}

export function getSideNavItems(role: string | null | undefined): NavItemConfig[] {
  return NAV_BY_ROLE[normalizeRole(role)]
}
