/**
 * Congress Workspace — Team
 *
 * Shows the congress event team roster with HARD separation of:
 *   - Platform role  (global: PatientAdvocate, Clinician, Researcher…)
 *   - Congress role  (event-specific: Congress Lead, Ops Lead, Comms Lead…)
 *
 * Data: congress_assignments + profiles (joined by user_id)
 * Fallback: demo data when DB has no assignments.
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { rowToCongressAssignment } from '@/lib/congress-assignments'
import type { CongressAssignmentRow, CongressProjectRole } from '@/lib/congress-assignments'
import { SetCongressRoles } from '@/components/roles/set-congress-roles'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { fetchLatestWorkspaceEvent } from '@/lib/congress-workspace/current-event'
import { WorkspaceDiagnostics } from '@/components/congress/workspace/workspace-diagnostics'
import { StageGuide } from '@/components/congress/workspace/stage-guide'

// ─── Metadata ────────────────────────────────────────────────────────────────

const CONGRESS_ROLE_META: Record<CongressProjectRole, { label: string; color: string; responsibilities: string[] }> = {
  'Congress Lead':       { label: 'Congress Lead',        color: 'bg-orange-100 text-orange-800 border-orange-200', responsibilities: ['Overall programme oversight', 'Stakeholder alignment', 'Final approvals'] },
  'Scientific Lead':     { label: 'Scientific Lead',      color: 'bg-purple-100 text-purple-800 border-purple-200', responsibilities: ['Scientific content quality', 'Topic review', 'Academic programme ownership'] },
  'Ops Lead':            { label: 'Ops Lead',             color: 'bg-blue-100 text-blue-800 border-blue-200',       responsibilities: ['Venue & logistics', 'Workstream coordination', 'Day-of execution'] },
  'Sponsor Lead':        { label: 'Sponsor Lead',         color: 'bg-green-100 text-green-800 border-green-200',    responsibilities: ['Sponsor relationships', 'Partnership deliverables', 'Sponsorship approvals'] },
  'Comms Lead':          { label: 'Comms Lead',           color: 'bg-sky-100 text-sky-800 border-sky-200',          responsibilities: ['Communications & messaging', 'Platform announcements', 'External outreach'] },
  'Finance':             { label: 'Finance',              color: 'bg-amber-100 text-amber-800 border-amber-200',    responsibilities: ['Budget tracking', 'Expense approvals', 'Financial reporting'] },
  'Compliance Reviewer': { label: 'Compliance Reviewer', color: 'bg-red-100 text-red-800 border-red-200',          responsibilities: ['Regulatory compliance', 'Document review', 'Risk sign-off'] },
  'Contributor':         { label: 'Contributor',          color: 'bg-neutral-100 text-neutral-700 border-neutral-200', responsibilities: ['Assigned workstream tasks', 'Content or logistics support'] },
  'Observer':            { label: 'Observer',             color: 'bg-neutral-100 text-neutral-500 border-neutral-200', responsibilities: ['View-only access', 'No action responsibilities'] },
}

const PLATFORM_ROLE_LABEL: Record<string, string> = {
  PatientAdvocate: 'Patient Advocate',
  Clinician:       'Clinician',
  Researcher:      'Researcher',
  HubCoordinator:  'Hub Coordinator',
  IndustryPartner: 'Industry Partner',
  BoardMember:     'Board Member',
  PlatformAdmin:   'Platform Admin',
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CongressWorkspaceTeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const platformRole: string = profile?.role ?? 'PatientAdvocate'
  const isAdmin = platformRole === 'PlatformAdmin'

  // ── Current event ──
  const { event: currentEvent, issues } = await fetchLatestWorkspaceEvent(supabase)

  // ── All assignments for event ──
  const { data: dbAssignments, error: assignmentsError } = await supabase
    .from('congress_assignments')
    .select('*')
    .eq('congress_id', currentEvent?.id ?? '__none__')

  const assignmentRows: CongressAssignmentRow[] = (dbAssignments ?? []) as unknown as CongressAssignmentRow[]
  const usingDemo = false

  // ── Viewer's own congress roles ──
  const myAssignments = assignmentRows.filter(r => r.user_id === user.id)
  const myCongressRoles = myAssignments.map(r => rowToCongressAssignment(r).projectRole)

  // ── Fetch real profiles for all user_ids ──
  const allUserIds = [...new Set(assignmentRows.map(r => r.user_id))]
  const { data: profileRows, error: profilesError } = await supabase
    .from('profiles')
    .select('id, role')
    .in('id', allUserIds.length > 0 ? allUserIds : ['__none__'])

  const allIssues = [...issues]
  if (assignmentsError) allIssues.push({ scope: 'congress_assignments.select_all', message: assignmentsError.message, code: assignmentsError.code, hint: (assignmentsError as unknown as { hint?: string }).hint })
  if (profilesError) allIssues.push({ scope: 'profiles.select_for_assignments', message: profilesError.message, code: profilesError.code, hint: (profilesError as unknown as { hint?: string }).hint })

  // Build lookup: userId → { platformRole }
  // profiles table does not store display names; show truncated userId as fallback
  const profileMap: Record<string, { platformRole: string }> = {}
  for (const p of profileRows ?? []) {
    profileMap[p.id] = { platformRole: (p.role as string) ?? 'PatientAdvocate' }
  }

  // ── Group assignments by user ──
  type MemberRecord = {
    userId: string
    name: string
    platformRole: string
    organization?: string
    congressRoles: CongressProjectRole[]
  }
  const memberMap: Record<string, MemberRecord> = {}
  for (const row of assignmentRows) {
    const a = rowToCongressAssignment(row)
    if (!memberMap[a.userId]) {
      // Real profile first, then demo fallback
      const real = profileMap[a.userId]
      const displayName = (row as unknown as { display_name?: string | null }).display_name
      memberMap[a.userId] = {
        userId: a.userId,
        name: (displayName && displayName.trim()) ? displayName.trim() : (a.userId.slice(0, 8) + '…'),
        platformRole: real?.platformRole ?? 'PatientAdvocate',
        organization: undefined,
        congressRoles: [],
      }
    }
    memberMap[a.userId].congressRoles.push(a.projectRole)
  }
  const members = Object.values(memberMap)

  // Sort: Congress Lead first, then by congress role alphabet
  const roleOrder = ['Congress Lead', 'Scientific Lead', 'Ops Lead', 'Sponsor Lead', 'Comms Lead', 'Finance', 'Compliance Reviewer', 'Contributor', 'Observer']
  members.sort((a, b) => {
    const ai = Math.min(...a.congressRoles.map(r => roleOrder.indexOf(r)).filter(i => i >= 0))
    const bi = Math.min(...b.congressRoles.map(r => roleOrder.indexOf(r)).filter(i => i >= 0))
    return ai - bi
  })

  return (
    <div className="mx-auto max-w-6xl">
      <WorkspaceDiagnostics issues={allIssues} />

      <SetCongressRoles roles={myCongressRoles} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Congress Team</h1>
          <p className="text-xs text-neutral-500">
            {members.length} contributor{members.length !== 1 ? 's' : ''} assigned to {currentEvent?.title ?? 'this congress'}
          </p>
        </div>
        {isAdmin && (
          <a href="/app/admin/users"
             className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100">
            ⚙ Manage assignments
          </a>
        )}
      </div>

      {/* ── ROLE LEGEND (disambiguation) ──────────────────────────────────── */}
      <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-xs font-semibold text-neutral-700 mb-2">Role types explained</p>
        <div className="grid gap-2 sm:grid-cols-2 text-xs text-neutral-600">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 inline-block h-2.5 w-2.5 rounded-full bg-neutral-400 shrink-0" />
            <span>
              <strong>Platform role</strong> — your global user type on this platform (e.g. Patient Advocate, Clinician, Researcher). Set at account creation. Does <em>not</em> change per congress.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 inline-block h-2.5 w-2.5 rounded-full bg-orange-400 shrink-0" />
            <span>
              <strong>Congress role</strong> — your responsibility assignment for <em>this specific congress event</em> (e.g. Ops Lead, Comms Lead). Assigned per event by an admin.
            </span>
          </div>
        </div>
      </div>

      {/* ── DEMO WARNING (admin only) ──────────────────────────────────────── */}
      {isAdmin && usingDemo && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs">
          <p className="font-semibold text-amber-900">Admin: showing demo team data</p>
          <p className="mt-0.5 text-amber-800">
            No <code className="rounded bg-white/60 px-1">congress_assignments</code> found for this event.{' '}
            <a href="/app/admin/users" className="underline">Assign contributors in User Management.</a>
          </p>
        </div>
      )}

      {/* ── EMPTY STATE ───────────────────────────────────────────────────── */}
      {members.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
          <p className="text-sm font-semibold text-neutral-900">No team members assigned yet</p>
          <p className="mt-1 text-xs text-neutral-500">
            {isAdmin
              ? <>Assign contributors in <a href="/app/admin/users" className="text-orange-600 underline">User Management</a>.</>
              : 'Ask an admin to assign congress team members for this event.'}
          </p>
        </div>
      )}

      {/* ── WORKSPACE NAV ─────────────────────────────────────────────────── */}
      <div className="mt-4">
        <WorkspaceNav active="team" status={currentEvent?.status} />
      </div>

      <div className="mt-4">
        <StageGuide status={currentEvent?.status} section="team" />
      </div>

      {/* ── TEAM ROSTER ───────────────────────────────────────────────────── */}
      {members.length > 0 && (
        <div className="mt-6 space-y-3">
          {members.map(m => (
            <div key={m.userId} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start gap-4">
                {/* Avatar */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                  {initials(m.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Name row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900">{m.name}</h3>
                    {m.organization && (
                      <span className="text-xs text-neutral-400">· {m.organization}</span>
                    )}
                  </div>

                  {/* Role layer 1: Platform role */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 w-24 shrink-0">
                      Platform role
                    </span>
                    <span className="rounded border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                      {PLATFORM_ROLE_LABEL[m.platformRole] ?? m.platformRole}
                    </span>
                  </div>

                  {/* Role layer 2: Congress role(s) */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 w-24 shrink-0">
                      Congress role
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {m.congressRoles.map(cr => {
                        const meta = CONGRESS_ROLE_META[cr] ?? CONGRESS_ROLE_META.Contributor
                        return (
                          <span key={cr} className={`rounded border px-2 py-0.5 text-xs font-semibold ${meta.color}`}>
                            {meta.label}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  {/* Responsibilities */}
                  {m.congressRoles.length > 0 && (
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                        Responsibilities
                      </span>
                      <ul className="mt-1 space-y-0.5">
                        {m.congressRoles.flatMap(cr =>
                          (CONGRESS_ROLE_META[cr] ?? CONGRESS_ROLE_META.Contributor).responsibilities.map((r, i) => (
                            <li key={`${cr}-${i}`} className="flex items-start gap-2 text-xs text-neutral-600">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                              {r}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
