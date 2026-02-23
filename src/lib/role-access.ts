export type PlatformRole =
  | 'PatientAdvocate'
  | 'Clinician'
  | 'Researcher'
  | 'Moderator'
  | 'HubCoordinator'
  | 'IndustryPartner'
  | 'BoardMember'
  | 'PlatformAdmin'

/**
 * Human-readable labels for every platform role.
 * Always use this map when displaying role names in the UI.
 * Never render raw DB values directly.
 */
export const ROLE_LABELS: Record<PlatformRole, string> = {
  PatientAdvocate: 'Patient Advocate',
  Clinician:       'Clinician',
  Researcher:      'Researcher',
  Moderator:       'Moderator',
  HubCoordinator:  'Hub Coordinator',
  IndustryPartner: 'Industry Partner',
  BoardMember:     'Board Member',
  PlatformAdmin:   'Platform Admin',
}

/**
 * Tailwind colour classes for role badges.
 * Always use this instead of inline maps in pages/components.
 */
export const ROLE_BADGE_COLORS: Record<PlatformRole, string> = {
  PlatformAdmin:   'bg-red-100 text-red-700',
  BoardMember:     'bg-purple-100 text-purple-700',
  HubCoordinator:  'bg-orange-100 text-orange-700',
  PatientAdvocate: 'bg-blue-100 text-blue-700',
  Researcher:      'bg-emerald-100 text-emerald-700',
  Clinician:       'bg-teal-100 text-teal-700',
  Moderator:       'bg-pink-100 text-pink-700',
  IndustryPartner: 'bg-amber-100 text-amber-700',
}

/**
 * Legacy / alternate DB values that may appear in older records.
 * Maps them to the canonical PlatformRole value.
 */
const LEGACY_ROLE_MAP: Record<string, PlatformRole> = {
  patient:          'PatientAdvocate',
  advocate:         'PatientAdvocate',
  patient_advocate: 'PatientAdvocate',
  patientuser:      'PatientAdvocate',
  'patient user':   'PatientAdvocate',
  admin:            'PlatformAdmin',
  hub_coordinator:  'HubCoordinator',
  board_member:     'BoardMember',
  industry_partner: 'IndustryPartner',
}

/**
 * Returns the human-readable label for any role string,
 * including legacy values. Safe to call with untrusted DB data.
 */
export function getRoleLabel(role?: string | null): string {
  if (!role) return ROLE_LABELS.PatientAdvocate
  const normalized = normalizeRole(role)
  return ROLE_LABELS[normalized]
}

/**
 * Returns the badge colour classes for any role string.
 */
export function getRoleBadgeColor(role?: string | null): string {
  const normalized = normalizeRole(role)
  return ROLE_BADGE_COLORS[normalized] ?? 'bg-neutral-100 text-neutral-600'
}

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
  // Handle legacy values
  const lower = role.toLowerCase().trim()
  if (lower in LEGACY_ROLE_MAP) return LEGACY_ROLE_MAP[lower]
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
