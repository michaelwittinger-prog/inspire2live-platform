/**
 * Congress Workspace – Overview (Clean v2)
 *
 * UX redesign goals:
 *  1. Role authority visible in <5s — no passive explanation banners.
 *  2. Primary job: triage today's work. "Now" items front and centre.
 *  3. Governance / risk / activity below the fold or in sidebar.
 *  4. Demo/setup warnings only visible to PlatformAdmin.
 */
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
import { responsibilitySummary } from '@/lib/congress-policy'
import {
  DEMO_ACTIVITY,
  DEMO_DEP_ALERTS,
  DEMO_KPIS,
  DEMO_RAID,
  DEMO_TASKS_WORKSPACE,
  DEMO_WORKSTREAMS,
} from '@/lib/congress-workspace-demo'

// ─── Local UI helpers ────────────────────────────────────────────────────────

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
              <div className={['h-2.5 w-2.5 rounded-full border-2',
                past    ? 'bg-orange-500 border-orange-500' : '',
                current ? 'bg-white border-orange-500 ring-2 ring-orange-300' : '',
                !past && !current ? 'bg-neutral-200 border-neutral-300' : '',
              ].join(' ')} />
              <span className={['text-[10px] hidden sm:block',
                current ? 'font-bold text-orange-700' : 'text-neutral-400',
              ].join(' ')}>{phase.label}</span>
            </div>
            {i < phases.length - 1 && (
              <div className={['h-0.5 w-6 sm:w-10 mx-0.5 -mt-3.5',
                i < activeIdx ? 'bg-orange-400' : 'bg-neutral-200',
              ].join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function PhaseBadge({ status }: { status: CongressEvent['status'] }) {
  const m = EVENT_STATUS_META[normalizeEventStatus(status)]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${m.badge}`}>
      {m.label}
    </span>
  )
}

/** Replaces EscalationBanner — answers "what can I do?" not "why can't I?". */
function AuthorityStrip({
  platformRole,
  congressRoles,
  tone,
  message,
}: {
  platformRole: string
  congressRoles: string[]
  tone: string
  message: string
}) {
  const hasCongressRole = congressRoles.length > 0
  const isAdmin = platformRole === 'PlatformAdmin'

  // Derive a terse action statement from the responsibility summary
  const canEdit = tone === 'success' || isAdmin

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
      {/* Platform role */}
      <span>
        <span className="font-semibold text-neutral-900">Platform:</span> {platformRole}
      </span>
      <span className="text-neutral-300">·</span>
      {/* Congress role */}
      {hasCongressRole ? (
        <span>
          <span className="font-semibold text-neutral-900">Congress role:</span>{' '}
          {congressRoles.join(', ')}
        </span>
      ) : (
        <span className="text-neutral-500">
          <span className="font-semibold text-neutral-700">Congress role:</span>{' '}
          None assigned
          {!isAdmin && (
            <span className="ml-1 text-neutral-400">— ask an admin to add a congress assignment for you</span>
          )}
          {isAdmin && (
            <span className="ml-1 text-neutral-400">— use User Management to assign congress responsibilities</span>
          )}
        </span>
      )}
      <span className="text-neutral-300">·</span>
      {/* Permission summary */}
      <span className={canEdit ? 'text-green-700' : 'text-amber-700'}>
        {canEdit ? '✓ Can edit' : '⚠ View only'}
      </span>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CongressWorkspaceOverviewPage() {
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

  // ── Event ──
  const { data: dbEvents } = await supabase
    .from('congress_events')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)

  const currentEvent: CongressEvent = dbEvents?.[0]
    ? (dbEvents[0] as unknown as CongressEvent)
    : DEMO_CONGRESS_EVENTS[0]
  const usingDemoEvent = !dbEvents?.[0]

  // ── Assignments ──
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

  // ── Derived data ──
  const nowTasks   = DEMO_TASKS_WORKSPACE.filter(t => t.lane === 'now')
  const nextTasks  = DEMO_TASKS_WORKSPACE.filter(t => t.lane === 'next')
  const laterTasks = DEMO_TASKS_WORKSPACE.filter(t => t.lane === 'later')
  const urgentNow  = nowTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').slice(0, 3)
  const changedSince = DEMO_ACTIVITY.slice(0, 3)
  const depAlerts  = DEMO_DEP_ALERTS

  return (
    <div className="mx-auto max-w-6xl">
      <SetCongressRoles roles={congressRoles} />

      {/* ── HEADER ROW ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">
            {currentEvent.title ?? 'Congress'} — Workspace
          </h1>
          <p className="text-xs text-neutral-500">Execution view · triage your work for today</p>
        </div>
        {currentEvent?.status && (
          <div className="flex items-center gap-2">
            <PhaseBadge status={currentEvent.status} />
            <span className="hidden text-xs text-neutral-400 sm:block">
              {EVENT_STATUS_META[normalizeEventStatus(currentEvent.status)].label} phase
            </span>
          </div>
        )}
      </div>

      {/* ── PHASE BAR ──────────────────────────────────────────────────────── */}
      {currentEvent?.status && (
        <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3">
          <CyclePhaseBar status={currentEvent.status} />
        </div>
      )}

      {/* ── ROLE AUTHORITY STRIP ────────────────────────────────────────────
           Replaces the passive EscalationBanner.
           Answers: "What am I? What can I do?"  in one compact line.         */}
      <div className="mt-3">
        <AuthorityStrip
          platformRole={platformRole}
          congressRoles={congressRoles}
          tone={resp.tone}
          message={resp.message}
        />
      </div>

      {/* ── WORKSPACE NAV ──────────────────────────────────────────────────── */}
      <div className="mt-4">
        <WorkspaceNav active="overview" />
      </div>

      {/* ── ADMIN ONLY: setup warning ───────────────────────────────────────
           Regular users don't need to know about demo data — it distracts.   */}
      {isAdmin && (usingDemoEvent || usingDemoAssignments) && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs">
          <p className="font-semibold text-amber-900">Admin: production data missing</p>
          <ul className="mt-1 list-disc pl-4 text-amber-800 space-y-0.5">
            {usingDemoEvent && <li>No rows in <code className="rounded bg-white/60 px-1">congress_events</code> — add at least one current event.</li>}
            {usingDemoAssignments && <li>No rows in <code className="rounded bg-white/60 px-1">congress_assignments</code> for your user — assign yourself via User Management.</li>}
          </ul>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────────────── */}
      <div className="mt-5 flex gap-6">
        <div className="min-w-0 flex-1 space-y-6">

          {/* PRIMARY ACTION ZONE: urgent "Now" items ─────────────────────
               Kept at top-of-fold so the user knows what to do in <5s.      */}
          {urgentNow.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-700">
                  Action required now
                </h2>
                <a href="/app/congress/workspace/tasks"
                   className="text-xs text-orange-600 hover:underline">
                  All tasks →
                </a>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {urgentNow.map(t => (
                  <div key={t.id}
                       className="flex flex-col gap-1 rounded-xl border border-orange-200 bg-orange-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-orange-600">
                      {t.priority}
                    </p>
                    <p className="text-sm font-semibold text-neutral-900 leading-tight">{t.title}</p>
                    <p className="text-xs text-neutral-500">{t.owner ?? 'Unowned'}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TRIAGE VIEW: Now / Next / Later ─────────────────────────────
               Primary work management view. Now shown prominently.          */}
          <section>
            <h2 className="text-sm font-semibold text-neutral-700">This week</h2>
            <div className="mt-2 grid gap-3 md:grid-cols-3">
              {(
                [
                  { label: 'NOW',  tasks: nowTasks,   accent: 'border-orange-300 bg-orange-50/40' },
                  { label: 'NEXT', tasks: nextTasks,  accent: 'border-neutral-200 bg-white' },
                  { label: 'LATER',tasks: laterTasks, accent: 'border-neutral-200 bg-neutral-50' },
                ] as const
              ).map(({ label, tasks, accent }) => (
                <div key={label} className={`rounded-xl border p-3 ${accent}`}>
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</p>
                  <div className="mt-2 space-y-1.5">
                    {tasks.length === 0 && (
                      <p className="text-xs text-neutral-400 italic">Nothing here</p>
                    )}
                    {tasks.map(t => (
                      <div key={t.id}
                           className="rounded-lg border border-neutral-200 bg-white/70 px-2.5 py-1.5">
                        <p className="text-xs font-medium text-neutral-900 leading-snug">{t.title}</p>
                        <p className="text-[10px] text-neutral-400">{t.status} · {t.owner ?? 'Unowned'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* WATCH SECTION: risks + dependency alerts ─────────────────────
               Kept below triage — important, but not the primary driver.    */}
          {depAlerts.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-neutral-700">Blockers & risks</h2>
                <a href="/app/congress/workspace/raid"
                   className="text-xs text-neutral-500 hover:underline">
                  Full RAID log →
                </a>
              </div>
              <div className="mt-2 space-y-2">
                {depAlerts.map(a => (
                  <div key={a.id}
                       className={['flex items-start gap-3 rounded-lg border px-3 py-2 text-xs',
                         a.severity === 'critical'
                           ? 'border-red-200 bg-red-50 text-red-800'
                           : 'border-amber-200 bg-amber-50 text-amber-800',
                       ].join(' ')}>
                    <span className="font-semibold uppercase mt-0.5">{a.severity}</span>
                    <span>{a.message}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ACTIVITY FEED ───────────────────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-semibold text-neutral-700">Recent changes</h2>
            <div className="mt-2 space-y-1.5">
              {changedSince.map(i => (
                <ActivityItem key={i.id} at={i.at} actor={i.actor} message={i.message} />
              ))}
            </div>
          </section>
        </div>

        {/* ── CONTEXT SIDEBAR ─────────────────────────────────────────────── */}
        <ContextPanel
          title="Event health"
          subtitle="Key metrics for the current congress"
        >
          <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
              Next milestone
            </p>
            <p className="mt-1 text-sm font-semibold text-neutral-900 leading-tight">
              {DEMO_WORKSTREAMS[0].nextMilestone}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
              Top risk
            </p>
            <p className="mt-1 text-sm font-semibold text-neutral-900 leading-tight">
              {DEMO_RAID[0].title}
            </p>
            <a href="/app/congress/workspace/raid"
               className="mt-1 text-[10px] text-orange-600 hover:underline block">
              View RAID →
            </a>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
              Pending approvals
            </p>
            <p className="mt-1 text-sm text-neutral-700">1 in review</p>
            <a href="/app/congress/workspace/approvals"
               className="mt-1 text-[10px] text-orange-600 hover:underline block">
              Review →
            </a>
          </div>

          <div className="space-y-1.5">
            {DEMO_KPIS.map(k => (
              <HealthChip key={k.id} label={k.label} value={k.value} status={k.status} />
            ))}
          </div>
        </ContextPanel>
      </div>
    </div>
  )
}
