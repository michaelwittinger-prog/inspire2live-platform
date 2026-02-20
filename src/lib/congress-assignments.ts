import type { Tables } from '@/types/database'

export type CongressAssignmentRow = Tables<'congress_assignments'>

export type CongressProjectRole =
  | 'Congress Lead'
  | 'Scientific Lead'
  | 'Ops Lead'
  | 'Sponsor Lead'
  | 'Comms Lead'
  | 'Finance'
  | 'Compliance Reviewer'
  | 'Contributor'
  | 'Observer'

export type AssignmentScope =
  | { kind: 'all' }
  | { kind: 'workstreams'; workstreamIds: string[] }

export type CongressAssignment = {
  id: string
  userId: string
  congressId: string
  projectRole: CongressProjectRole
  scope: AssignmentScope
  effectiveFrom: string
  effectiveTo: string | null
}

export function rowToCongressAssignment(row: CongressAssignmentRow): CongressAssignment {
  return {
    id: row.id,
    userId: row.user_id,
    congressId: row.congress_id,
    projectRole: row.project_role as CongressProjectRole,
    scope: row.scope_all
      ? { kind: 'all' }
      : { kind: 'workstreams', workstreamIds: (row.workstream_ids ?? []) as unknown as string[] },
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
  }
}

export function isAssignmentEffectiveOn(
  assignment: CongressAssignment,
  onDateISO: string
): boolean {
  const from = new Date(assignment.effectiveFrom).getTime()
  const on = new Date(onDateISO).getTime()
  const to = assignment.effectiveTo ? new Date(assignment.effectiveTo).getTime() : null
  if (on < from) return false
  if (to !== null && on > to) return false
  return true
}
