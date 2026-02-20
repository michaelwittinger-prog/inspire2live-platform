import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_CONGRESS_EVENTS, DEMO_CONGRESS_ASSIGNMENTS } from '@/lib/demo-data'
import { rowToCongressAssignment } from '@/lib/congress-assignments'
import type { CongressEvent } from '@/lib/congress'
import type { CongressAssignmentRow } from '@/lib/congress-assignments'
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

  const { data: dbAssignments } = await supabase
    .from('congress_assignments')
    .select('*')
    .eq('congress_id', currentEvent.id)
    .eq('user_id', user.id)

  const assignmentRows: CongressAssignmentRow[] = (dbAssignments && dbAssignments.length > 0)
    ? (dbAssignments as unknown as CongressAssignmentRow[])
    : (DEMO_CONGRESS_ASSIGNMENTS as unknown as CongressAssignmentRow[])
      .filter(a => a.congress_id === currentEvent.id && a.user_id === user.id)

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

      <div className="mt-4">
        <WorkspaceNav active="overview" />
      </div>

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
