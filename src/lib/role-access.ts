export type PlatformRole =
  | 'PatientAdvocate'
  | 'Clinician'
  | 'Researcher'
  | 'Moderator'
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
  | 'stories'
  | 'resources'
  | 'partners'
  | 'network'
  | 'board'
  | 'notifications'
  | 'profile'
  | 'admin'

export type NavItemConfig = {
  key: NavKey
  label: string
  href: string
}

const DEFAULT_ROLE: PlatformRole = 'PatientAdvocate'

const ACCESS_BY_ROLE: Record<PlatformRole, string[]> = {
  PatientAdvocate:  ['dashboard', 'initiatives', 'tasks', 'congress', 'stories', 'resources', 'network', 'notifications', 'profile'],
  Clinician:        ['dashboard', 'initiatives', 'tasks', 'congress', 'stories', 'resources', 'network', 'notifications', 'profile'],
  Researcher:       ['dashboard', 'initiatives', 'tasks', 'congress', 'stories', 'resources', 'network', 'notifications', 'profile'],
  Moderator:        ['dashboard', 'stories', 'congress', 'resources', 'network', 'notifications', 'profile'],
  IndustryPartner:  ['dashboard', 'partners', 'congress', 'resources', 'network', 'notifications', 'profile'],
  BoardMember:      ['dashboard', 'initiatives', 'congress', 'stories', 'resources', 'network', 'board', 'notifications', 'profile'],
  HubCoordinator:   ['dashboard', 'bureau', 'initiatives', 'tasks', 'congress', 'stories', 'partners', 'resources', 'network', 'notifications', 'profile'],
  PlatformAdmin:    ['dashboard', 'bureau', 'initiatives', 'tasks', 'congress', 'stories', 'partners', 'resources', 'network', 'board', 'notifications', 'profile', 'admin'],
}

const NAV_BY_ROLE: Record<PlatformRole, NavItemConfig[]> = {
  PatientAdvocate: [
    { key: 'dashboard',     label: 'Dashboard',      href: '/app/dashboard' },
    { key: 'initiatives',   label: 'My Initiatives', href: '/app/initiatives' },
    { key: 'tasks',         label: 'My Tasks',       href: '/app/tasks' },
    { key: 'network',       label: 'My Network',     href: '/app/network' },
    { key: 'congress',      label: 'Congress',       href: '/app/congress/workspace' },
    { key: 'stories',       label: 'My Stories',     href: '/app/stories' },
    { key: 'resources',     label: 'Resources',      href: '/app/resources' },
    { key: 'profile',       label: 'Profile',        href: '/app/profile' },
  ],
  Clinician: [
    { key: 'dashboard',     label: 'Dashboard',      href: '/app/dashboard' },
    { key: 'initiatives',   label: 'My Initiatives', href: '/app/initiatives' },
    { key: 'tasks',         label: 'My Tasks',       href: '/app/tasks' },
    { key: 'network',       label: 'My Network',     href: '/app/network' },
    { key: 'congress',      label: 'Congress',       href: '/app/congress/workspace' },
    { key: 'stories',       label: 'Stories',        href: '/app/stories' },
    { key: 'resources',     label: 'Resources',      href: '/app/resources' },
    { key: 'profile',       label: 'Profile',        href: '/app/profile' },
  ],
  Researcher: [
    { key: 'dashboard',     label: 'Dashboard',      href: '/app/dashboard' },
    { key: 'initiatives',   label: 'My Initiatives', href: '/app/initiatives' },
    { key: 'tasks',         label: 'My Tasks',       href: '/app/tasks' },
    { key: 'network',       label: 'My Network',     href: '/app/network' },
    { key: 'congress',      label: 'Congress',       href: '/app/congress/workspace' },
    { key: 'stories',       label: 'Stories',        href: '/app/stories' },
    { key: 'resources',     label: 'Resources',      href: '/app/resources' },
    { key: 'profile',       label: 'Profile',        href: '/app/profile' },
  ],
  Moderator: [
    { key: 'dashboard',     label: 'Dashboard',       href: '/app/dashboard' },
    { key: 'stories',       label: 'Stories',         href: '/app/stories' },
    { key: 'network',       label: 'My Network',      href: '/app/network' },
    { key: 'congress',      label: 'Congress',        href: '/app/congress/workspace' },
    { key: 'resources',     label: 'Resources',       href: '/app/resources' },
    { key: 'profile',       label: 'Profile',         href: '/app/profile' },
  ],
  IndustryPartner: [
    { key: 'dashboard',     label: 'Dashboard',      href: '/app/dashboard' },
    { key: 'partners',      label: 'My Engagements', href: '/app/partners' },
    { key: 'network',       label: 'My Network',     href: '/app/network' },
    { key: 'congress',      label: 'Congress',       href: '/app/congress/workspace' },
    { key: 'resources',     label: 'Resources',      href: '/app/resources' },
    { key: 'profile',       label: 'Profile',        href: '/app/profile' },
  ],
  BoardMember: [
    { key: 'dashboard',     label: 'Board Overview', href: '/app/dashboard' },
    { key: 'board',         label: 'Board View',     href: '/app/board' },
    { key: 'initiatives',   label: 'Initiatives',    href: '/app/initiatives' },
    { key: 'network',       label: 'My Network',     href: '/app/network' },
    { key: 'congress',      label: 'Congress',       href: '/app/congress/workspace' },
    { key: 'stories',       label: 'Stories',        href: '/app/stories' },
    { key: 'resources',     label: 'Resources',      href: '/app/resources' },
    { key: 'profile',       label: 'Profile',        href: '/app/profile' },
  ],
  HubCoordinator: [
    { key: 'dashboard',     label: 'Dashboard',       href: '/app/dashboard' },
    { key: 'bureau',        label: 'Bureau',          href: '/app/bureau' },
    { key: 'initiatives',   label: 'All Initiatives', href: '/app/initiatives' },
    { key: 'network',       label: 'My Network',      href: '/app/network' },
    { key: 'congress',      label: 'Congress',        href: '/app/congress/workspace' },
    { key: 'stories',       label: 'Stories',         href: '/app/stories' },
    { key: 'partners',      label: 'Partners',        href: '/app/partners' },
    { key: 'resources',     label: 'Resources',       href: '/app/resources' },
    { key: 'profile',       label: 'Profile',         href: '/app/profile' },
  ],
  PlatformAdmin: [
    { key: 'dashboard',     label: 'Dashboard',       href: '/app/dashboard' },
    { key: 'bureau',        label: 'Bureau',          href: '/app/bureau' },
    { key: 'initiatives',   label: 'All Initiatives', href: '/app/initiatives' },
    { key: 'network',       label: 'My Network',      href: '/app/network' },
    { key: 'board',         label: 'Board View',      href: '/app/board' },
    { key: 'congress',      label: 'Congress',        href: '/app/congress/workspace' },
    { key: 'stories',       label: 'Stories',         href: '/app/stories' },
    { key: 'partners',      label: 'Partners',        href: '/app/partners' },
    { key: 'resources',     label: 'Resources',       href: '/app/resources' },
    { key: 'admin',         label: 'User Management', href: '/app/admin/users' },
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
