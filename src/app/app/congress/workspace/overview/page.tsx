import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_CONGRESS_EVENTS, DEMO_CONGRESS_ASSIGNMENTS } from '@/lib/demo-data'
import { rowToCongressAssignment } from '@/lib/congress-assignments'
import type { CongressEvent } from '@/lib/congress'
import type { CongressAssignmentRow } from '@/lib/congress-assignments'
import { EVENT_STATUS_META, normalizeEventStatus } from '@/lib/congress'
import { SetCongressRoles } from '@/components/roles/set-congress-roles'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { ContextPanel } from '@/components/congress/workspace/context-panel'
import { HealthChip } from '@/components/ui/health-chip'
import { ActivityItem } from '@/components/ui/activity-item'
import { EscalationBanner } from '@/components/ui/escalation-banner'
import { responsibilitySummary } from '@/lib/congress-policy'
import {
  DEMO_ACTIVITY,
  DEMO_DEP_ALERTS,
  DEMO_KPIS,
  DEMO_RAID,
  DEMO_TASKS_WORKSPACE,
  DEMO_WORKSTREAMS,
} from '@/lib/congress-workspace-demo'

// ── UI helpers (kept local to avoid broad refactors) ─────────────────────────

function CyclePhaseBar({ status }: { status: CongressEvent['status'] }) {
  const phases = [
    { key: 'planning',        label: 'Planning' },
    { key: 'open_for_topics', label: 'Topics Open' },
    { key: 'agenda_set',      label: 'Agenda Set' },
    { key: 'live',            label: 'Live' },
    { key: 'post_congress',   label: 'Post-Congress' },
    { key: 'archived',        label: 'Archived' },
  ] as const

  const activeIdx = phases.findIndex((p) => p.key === normalizeEventStatus(status))

  return (
    <div className="flex items-center gap-0">
      {phases.map((phase, i) => {
        const past = i < activeIdx
        const current = i === activeIdx
        return (
          <div key={phase.key} className="flex items-center">
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={[
                  'h-2.5 w-2.5 rounded-full border-2',
                  past ? 'bg-orange-500 border-orange-500' : '',
                  current ? 'bg-white border-orange-500 ring-2 ring-orange-300' : '',
                  !past && !current ? 'bg-neutral-200 border-neutral-300' : '',
                ].join(' ')}
              />
              <span
                className={[
                  'text-[10px] hidden sm:block',
                  current ? 'font-bold text-orange-700' : 'text-neutral-400',
                ].join(' ')}
              >
                {phase.label}
              </span>
            </div>
            {i < phases.length - 1 && (
              <div
                className={[
                  'h-0.5 w-6 sm:w-10 mx-0.5 -mt-3.5',
                  i < activeIdx ? 'bg-orange-400' : 'bg-neutral-200',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function EventStatusBadge({ status }: { status: CongressEvent['status'] }) {
  const m = EVENT_STATUS_META[normalizeEventStatus(status)]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${m.badge}`}>
      {m.label}
    </span>
  )
}

export default async function CongressWorkspaceOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const platformRole = profile?.role ?? 'PatientAdvocate'

  const { data: dbEvents } = await supabase
    .from('congress_events')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)

  const currentEvent: CongressEvent = (dbEvents?.[0]
    ? (dbEvents[0] as unknown as CongressEvent)
    : DEMO_CONGRESS_EVENTS[0]
  )

  const usingDemoEvent = !dbEvents?.[0]

  const { data: dbAssignments } = await supabase
    .from('congress_assignments')
    .select('*')
    .eq('congress_id', currentEvent.id)
    .eq('user_id', user.id)

  const assignmentRows: CongressAssignmentRow[] = (dbAssignments && dbAssignments.length > 0)
    ? (dbAssignments as unknown as CongressAssignmentRow[])
    : (DEMO_CONGRESS_ASSIGNMENTS as unknown as CongressAssignmentRow[])
      .filter(a => a.congress_id === currentEvent.id && a.user_id === user.id)

  const usingDemoAssignments = !(dbAssignments && dbAssignments.length > 0)

  const assignments = assignmentRows.map(r => rowToCongressAssignment(r))
  const congressRoles = assignments.map(a => a.projectRole)

  const resp = responsibilitySummary(platformRole, congressRoles)

  const top3 = [...DEMO_TASKS_WORKSPACE]
    .filter(t => t.lane === 'now')
    .sort((a, b) => (a.priority === 'urgent' ? -1 : 0) - (b.priority === 'urgent' ? -1 : 0))
    .slice(0, 3)

  const changedSince = DEMO_ACTIVITY.slice(0, 3)
  const depAlerts = DEMO_DEP_ALERTS

  return (
    <div className="mx-auto max-w-6xl">
      <SetCongressRoles roles={congressRoles} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Congress Workspace</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Priority-first execution view for {currentEvent.title ?? 'the current congress'}.
          </p>
        </div>
      </div>

      {/* Program phase */}
      {currentEvent?.status && (
        <div className="mt-4 rounded-xl border border-orange-200 bg-linear-to-br from-orange-50 to-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <EventStatusBadge status={currentEvent.status} />
            <span className="text-xs text-neutral-500 font-medium uppercase tracking-wide">Program phase</span>
          </div>
          <CyclePhaseBar status={currentEvent.status} />
        </div>
      )}

      <div className="mt-4">
        <WorkspaceNav active="overview" />
      </div>

      {(usingDemoEvent || usingDemoAssignments) && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Setup needed in production</p>
          <p className="mt-1 text-sm text-amber-800">
            This page is currently using fallback demo data because the database returned no rows for
            {usingDemoEvent ? ' congress events' : ''}
            {usingDemoEvent && usingDemoAssignments ? ' and' : ''}
            {usingDemoAssignments ? ' your congress assignments' : ''}.
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-amber-800 space-y-1">
            {usingDemoEvent && (
              <li>
                Ensure <code className="rounded bg-white/60 px-1">congress_events</code> has at least one row (current event).
              </li>
            )}
            {usingDemoAssignments && (
              <li>
                Ensure <code className="rounded bg-white/60 px-1">congress_assignments</code> has rows for your user for the current event.
              </li>
            )}
          </ul>
        </div>
      )}

      {assignments.length === 0 && (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm font-semibold text-neutral-900">No congress responsibilities assigned</p>
          <p className="mt-1 text-sm text-neutral-600">
            You can view the workspace, but your role-based responsibilities are empty. Ask an admin to add a
            congress assignment for you.
          </p>
        </div>
      )}

      <div className="mt-6 flex gap-6">
        <div className="min-w-0 flex-1 space-y-6">
          <EscalationBanner
            tone={resp.tone}
            title="Why you can / can’t edit"
            message={resp.message}
          />

          {/* Priority Stack */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-900">Priority Stack (Top 3 now)</h2>
              <span className="text-xs text-neutral-500">Target: find today’s priorities in &lt;30s</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {top3.map(t => (
                <div key={t.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-semibold text-orange-700">{t.priority.toUpperCase()}</p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">{t.title}</p>
                  <p className="mt-1 text-xs text-neutral-500">Owner: {t.owner ?? 'Unowned'}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Now / Next / Later */}
          <section>
            <h2 className="text-base font-semibold text-neutral-900">Now / Next / Later</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {(['now', 'next', 'later'] as const).map(lane => (
                <div key={lane} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{lane}</p>
                  <div className="mt-3 space-y-2">
                    {DEMO_TASKS_WORKSPACE.filter(t => t.lane === lane).map(t => (
                      <div key={t.id} className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                        <p className="text-sm font-medium text-neutral-900">{t.title}</p>
                        <p className="text-xs text-neutral-500">{t.status} · {t.owner ?? 'Unowned'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Dependency alerts */}
          <section>
            <h2 className="text-base font-semibold text-neutral-900">Cross-workstream dependency alerts</h2>
            <div className="mt-3 space-y-2">
              {depAlerts.map(a => (
                <div key={a.id} className={[
                  'rounded-xl border p-4',
                  a.severity === 'critical' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50',
                ].join(' ')}>
                  <p className="text-sm font-semibold text-neutral-900">{a.severity.toUpperCase()}</p>
                  <p className="mt-1 text-sm text-neutral-700">{a.message}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Changed feed */}
          <section>
            <h2 className="text-base font-semibold text-neutral-900">Changed since last update</h2>
            <div className="mt-3 space-y-2">
              {changedSince.map(i => (
                <ActivityItem key={i.id} at={i.at} actor={i.actor} message={i.message} />
              ))}
            </div>
          </section>
        </div>

        {/* Sticky context panel */}
        <ContextPanel
          title="Objectives & health"
          subtitle="Always visible context while drilling into detail"
        >
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Next milestone</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">{DEMO_WORKSTREAMS[0].nextMilestone}</p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Top risk</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">{DEMO_RAID[0].title}</p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Unresolved decisions</p>
            <p className="mt-1 text-sm text-neutral-700">1 approval in review</p>
          </div>

          <div className="space-y-2">
            {DEMO_KPIS.map(k => (
              <HealthChip key={k.id} label={k.label} value={k.value} status={k.status} />
            ))}
          </div>
        </ContextPanel>
      </div>
    </div>
  )
}
