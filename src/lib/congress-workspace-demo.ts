import type { CongressProjectRole } from '@/lib/congress-assignments'

export type Workstream = {
  id: string
  title: string
  ownerRole: CongressProjectRole | null
  health: 'on_track' | 'at_risk' | 'blocked'
  progressPct: number
  nextMilestone: string
}

export type WorkspaceTask = {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'blocked' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  lane: 'now' | 'next' | 'later'
  dueDate: string | null
  owner: string | null
  workstreamId: string | null
  dependencies: string[]
}

export type DependencyAlert = {
  id: string
  fromTaskId: string
  toTaskId: string
  message: string
  severity: 'info' | 'warning' | 'critical'
}

export type RaidItem = {
  id: string
  type: 'risk' | 'assumption' | 'issue' | 'decision'
  title: string
  status: 'open' | 'mitigating' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  ownerRole: CongressProjectRole | null
  linkedTaskIds: string[]
}

export type Approval = {
  id: string
  title: string
  status: 'submitted' | 'in_review' | 'approved' | 'rejected'
  requestedBy: string
  updatedAt: string
  audit: { at: string; actor: string; message: string }[]
}

export type Incident = {
  id: string
  title: string
  status: 'open' | 'monitoring' | 'resolved'
  severity: 'sev3' | 'sev2' | 'sev1'
  updatedAt: string
}

export type KPI = {
  id: string
  label: string
  value: string
  status: 'good' | 'warn' | 'bad'
}

export type ActivityItem = {
  id: string
  at: string
  actor: string
  message: string
}

export const DEMO_WORKSTREAMS: Workstream[] = [
  {
    id: 'ws-programme',
    title: 'Programme & Agenda',
    ownerRole: 'Congress Lead',
    health: 'on_track',
    progressPct: 62,
    nextMilestone: 'Agenda draft published',
  },
  {
    id: 'ws-ops',
    title: 'Operations & Logistics',
    ownerRole: 'Ops Lead',
    health: 'at_risk',
    progressPct: 48,
    nextMilestone: 'Venue runbook signed off',
  },
  {
    id: 'ws-comms',
    title: 'Comms & Community',
    ownerRole: 'Comms Lead',
    health: 'on_track',
    progressPct: 55,
    nextMilestone: 'Launch topic call campaign',
  },
  {
    id: 'ws-compliance',
    title: 'Compliance & Neutrality',
    ownerRole: 'Compliance Reviewer',
    health: 'blocked',
    progressPct: 20,
    nextMilestone: 'Sponsor neutrality review',
  },
]

export const DEMO_TASKS_WORKSPACE: WorkspaceTask[] = [
  {
    id: 'ct-1',
    title: 'Confirm venue contract addendum',
    status: 'in_progress',
    priority: 'urgent',
    lane: 'now',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    owner: 'Sophie van der Berg',
    workstreamId: 'ws-ops',
    dependencies: [],
  },
  {
    id: 'ct-2',
    title: 'Draft agenda v0.3 (session order + leads)',
    status: 'todo',
    priority: 'high',
    lane: 'now',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    owner: 'Peter de Groot',
    workstreamId: 'ws-programme',
    dependencies: ['ct-5'],
  },
  {
    id: 'ct-3',
    title: 'Publish “Call for topics” landing update',
    status: 'todo',
    priority: 'medium',
    lane: 'next',
    dueDate: new Date(Date.now() + 8 * 86400000).toISOString(),
    owner: 'Maria Santos',
    workstreamId: 'ws-comms',
    dependencies: [],
  },
  {
    id: 'ct-4',
    title: 'Neutrality review for Sponsor pack (draft)',
    status: 'blocked',
    priority: 'urgent',
    lane: 'now',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    owner: 'Nadia Al-Rashid',
    workstreamId: 'ws-compliance',
    dependencies: ['ct-6'],
  },
  {
    id: 'ct-5',
    title: 'Collect session proposals shortlist',
    status: 'in_progress',
    priority: 'high',
    lane: 'now',
    dueDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    owner: null,
    workstreamId: 'ws-programme',
    dependencies: [],
  },
  {
    id: 'ct-6',
    title: 'Sponsor deck V1 from partners team',
    status: 'todo',
    priority: 'high',
    lane: 'next',
    dueDate: new Date(Date.now() + 6 * 86400000).toISOString(),
    owner: null,
    workstreamId: 'ws-compliance',
    dependencies: [],
  },
]

export const DEMO_DEP_ALERTS: DependencyAlert[] = [
  {
    id: 'dep-1',
    fromTaskId: 'ct-5',
    toTaskId: 'ct-2',
    message: 'Agenda draft depends on the session shortlist being complete.',
    severity: 'warning',
  },
  {
    id: 'dep-2',
    fromTaskId: 'ct-6',
    toTaskId: 'ct-4',
    message: 'Compliance review is blocked until sponsor deck V1 is delivered.',
    severity: 'critical',
  },
]

export const DEMO_RAID: RaidItem[] = [
  {
    id: 'raid-1',
    type: 'risk',
    title: 'Venue AV provider availability for day 2',
    status: 'mitigating',
    priority: 'high',
    ownerRole: 'Ops Lead',
    linkedTaskIds: ['ct-1'],
  },
  {
    id: 'raid-2',
    type: 'issue',
    title: 'Sponsor neutrality review pending (legal)',
    status: 'open',
    priority: 'high',
    ownerRole: 'Compliance Reviewer',
    linkedTaskIds: ['ct-4'],
  },
  {
    id: 'raid-3',
    type: 'assumption',
    title: 'Keynote speaker will confirm by end of month',
    status: 'open',
    priority: 'medium',
    ownerRole: 'Congress Lead',
    linkedTaskIds: [],
  },
]

export const DEMO_APPROVALS: Approval[] = [
  {
    id: 'appr-1',
    title: 'Approve agenda v0.3 for public preview',
    status: 'in_review',
    requestedBy: 'Peter de Groot',
    updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    audit: [
      { at: new Date(Date.now() - 6 * 3600000).toISOString(), actor: 'Peter de Groot', message: 'Submitted agenda v0.3' },
      { at: new Date(Date.now() - 2 * 3600000).toISOString(), actor: 'Admin', message: 'Marked as in review' },
    ],
  },
]

export const DEMO_INCIDENTS: Incident[] = [
  {
    id: 'inc-1',
    title: 'Registration form intermittent 500s',
    status: 'monitoring',
    severity: 'sev2',
    updatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
]

export const DEMO_KPIS: KPI[] = [
  { id: 'k1', label: 'Schedule', value: 'At risk', status: 'warn' },
  { id: 'k2', label: 'Budget', value: 'On track', status: 'good' },
  { id: 'k3', label: 'Risk', value: '2 high', status: 'warn' },
  { id: 'k4', label: 'Capacity', value: 'Tight', status: 'warn' },
]

export const DEMO_ACTIVITY: ActivityItem[] = [
  { id: 'a1', at: new Date(Date.now() - 3 * 3600000).toISOString(), actor: 'Sophie', message: 'Updated venue runbook draft' },
  { id: 'a2', at: new Date(Date.now() - 8 * 3600000).toISOString(), actor: 'Nadia', message: 'Flagged compliance dependency on sponsor deck' },
  { id: 'a3', at: new Date(Date.now() - 2 * 86400000).toISOString(), actor: 'Maria', message: 'Prepared comms campaign outline for topic call' },
]
