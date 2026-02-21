import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  EVENT_STATUS_META,
  formatEventDates,
  daysUntil,
  computeDecisionStats,
  enrichDecisions,
  normalizeEventStatus,
  type CongressEvent,
  type CongressDecision,
} from '@/lib/congress'
import { DEMO_CONGRESS_EVENTS, DEMO_CONGRESS_DECISIONS, DEMO_CONGRESS_THEMES } from '@/lib/demo-data'

// ── helpers ───────────────────────────────────────────────────────────────────

function CyclePhaseBar({ status }: { status: CongressEvent['status'] }) {
  const phases = [
    { key: 'planning',        label: 'Planning' },
    { key: 'open_for_topics', label: 'Topics Open' },
    { key: 'agenda_set',      label: 'Agenda Set' },
    { key: 'live',            label: 'Live' },
    { key: 'post_congress',   label: 'Post-Congress' },
    { key: 'archived',        label: 'Archived' },
  ] as const

  const activeIdx = phases.findIndex(p => p.key === normalizeEventStatus(status))

  return (
    <div className="flex items-center gap-0">
      {phases.map((phase, i) => {
        const past    = i < activeIdx
        const current = i === activeIdx
        return (
          <div key={phase.key} className="flex items-center">
            <div className={[
              'flex flex-col items-center gap-0.5',
              current ? '' : '',
            ].join(' ')}>
              <div className={[
                'h-2.5 w-2.5 rounded-full border-2',
                past    ? 'bg-orange-500 border-orange-500' : '',
                current ? 'bg-white border-orange-500 ring-2 ring-orange-300' : '',
                !past && !current ? 'bg-neutral-200 border-neutral-300' : '',
              ].join(' ')} />
              <span className={[
                'text-[10px] hidden sm:block',
                current ? 'font-bold text-orange-700' : 'text-neutral-400',
              ].join(' ')}>
                {phase.label}
              </span>
            </div>
            {i < phases.length - 1 && (
              <div className={[
                'h-0.5 w-6 sm:w-10 mx-0.5 -mt-3.5',
                i < activeIdx ? 'bg-orange-400' : 'bg-neutral-200',
              ].join(' ')} />
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

// ── page ──────────────────────────────────────────────────────────────────────

export default async function CongressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Try live DB; fall back to demo data
  const { data: dbEvents } = await supabase
    .from('congress_events')
    .select('*')
    .order('year', { ascending: false })
    .limit(10)

  const events: CongressEvent[] = (dbEvents && dbEvents.length > 0)
    ? dbEvents as unknown as CongressEvent[]
    : DEMO_CONGRESS_EVENTS

  const currentEvent = events.find(e => normalizeEventStatus(e.status) !== 'archived') ?? events[0]
  const pastEvents   = events.filter(e => normalizeEventStatus(e.status) === 'archived')

  // Decisions for current event (SLA dashboard strip)
  const { data: dbDecisions } = await supabase
    .from('congress_decisions')
    .select('*')
    .order('captured_at', { ascending: false })

  const decisions = enrichDecisions(
    (dbDecisions && dbDecisions.length > 0
      ? dbDecisions as unknown as CongressDecision[]
      : DEMO_CONGRESS_DECISIONS
    ).filter(d => !currentEvent || d.congress_year === currentEvent.year || d.event_id === currentEvent.id)
  )

  const stats = computeDecisionStats(decisions)
  const overdueDecisions = decisions.filter(d => d.conversion_status === 'pending' && (d.sla_hours_remaining ?? 0) < 0)
  const daysToEvent = currentEvent?.start_date ? daysUntil(currentEvent.start_date) : null
  const themes = DEMO_CONGRESS_THEMES

  return (
    <div className="mx-auto max-w-4xl space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Congress</h1>
          <p className="mt-1 text-sm text-neutral-500">
            The Inspire2Live annual congress — organized and facilitated end-to-end through this platform.
          </p>
        </div>
        <Link
          href="/app/congress/archive"
          className="shrink-0 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          All years →
        </Link>
      </div>

      {/* ── Current event hero ── */}
      {currentEvent && (
        <div className="rounded-xl border border-orange-200 bg-linear-to-br from-orange-50 to-amber-50 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <EventStatusBadge status={currentEvent.status} />
                {daysToEvent !== null && daysToEvent > 0 && (
                  <span className="text-xs text-neutral-500">{daysToEvent} days away</span>
                )}
                {daysToEvent !== null && daysToEvent <= 0 && currentEvent.status !== 'archived' && (
                  <span className="text-xs font-semibold text-green-700">Now</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-neutral-900">{currentEvent.title}</h2>
              {currentEvent.theme_headline && (
                <p className="mt-0.5 text-sm font-medium text-orange-700">&ldquo;{currentEvent.theme_headline}&rdquo;</p>
              )}
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed max-w-2xl">
                {currentEvent.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-700">
                {currentEvent.start_date && (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                    {formatEventDates(currentEvent.start_date, currentEvent.end_date)}
                  </span>
                )}
                {currentEvent.location && (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                    {currentEvent.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cycle phase bar */}
          <div className="mt-5 pt-4 border-t border-orange-200">
            <p className="text-xs text-neutral-500 mb-2 font-medium uppercase tracking-wide">Program phase</p>
            <CyclePhaseBar status={currentEvent.status} />
          </div>
        </div>
      )}

      {/* ── Decision SLA strip (only when there are decisions) ── */}
      {stats.total > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-neutral-900">Decision Pipeline</h2>
            <Link
              href="/app/congress/decisions"
              className="text-xs text-orange-600 hover:underline underline-offset-2"
            >
              View all →
            </Link>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            {[
              { label: 'Total',        value: stats.total,               color: 'text-neutral-900' },
              { label: 'Converted',    value: stats.converted,           color: 'text-green-700' },
              { label: 'Pending',      value: stats.pending,             color: 'text-orange-700' },
              { label: 'Overdue',      value: stats.overdue,             color: stats.overdue > 0 ? 'text-red-700' : 'text-neutral-400' },
              { label: 'Rate',         value: `${stats.conversion_rate_pct}%`, color: 'text-neutral-900' },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-lg border border-neutral-200 bg-white p-3 text-center">
                <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Conversion progress bar */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 mb-4">
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
              <span>Conversion progress</span>
              <span>{stats.converted}/{stats.total} decisions converted</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${stats.conversion_rate_pct}%` }}
              />
            </div>
          </div>

          {/* Overdue alerts */}
          {overdueDecisions.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">
                ⚠️ {overdueDecisions.length} decision{overdueDecisions.length > 1 ? 's' : ''} overdue for conversion
              </p>
              <div className="space-y-1">
                {overdueDecisions.slice(0, 3).map(d => (
                  <p key={d.id} className="text-xs text-red-700">
                    · {d.title}
                    {d.sla_hours_remaining !== undefined && (
                      <span className="ml-1 font-medium">
                        ({Math.abs(Math.round(d.sla_hours_remaining))}h overdue)
                      </span>
                    )}
                  </p>
                ))}
              </div>
              <Link
                href="/app/congress/decisions"
                className="mt-2 inline-block text-xs font-medium text-red-700 underline underline-offset-2"
              >
                Convert now →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ── Quick navigation ── */}
      {currentEvent && (
        <section>
          <h2 className="text-base font-semibold text-neutral-900 mb-3">Congress Workspace</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                href: '/app/congress/workspace',
                icon: '🧭',
                label: 'Workspace',
                sub: 'Execution view',
                color: 'border-orange-200 hover:bg-orange-50',
              },
              {
                href: '/app/congress/topics',
                icon: '💡',
                label: 'Topics',
                sub: 'Propose & vote',
                color: 'border-blue-200 hover:bg-blue-50',
              },
              {
                href: '/app/congress/agenda',
                icon: '📅',
                label: 'Agenda',
                sub: 'Sessions & schedule',
                color: 'border-violet-200 hover:bg-violet-50',
              },
              {
                href: '/app/congress/decisions',
                icon: '⚡',
                label: 'Decisions',
                sub: 'Track & convert',
                color: 'border-orange-200 hover:bg-orange-50',
              },
              {
                href: '/app/congress/archive',
                icon: '🗂️',
                label: 'Archive',
                sub: 'Past congresses',
                color: 'border-neutral-200 hover:bg-neutral-50',
              },
            ].map(nav => (
              <Link
                key={nav.href}
                href={nav.href}
                className={`flex flex-col gap-1 rounded-xl border bg-white p-4 transition-colors ${nav.color}`}
              >
                <span className="text-2xl">{nav.icon}</span>
                <span className="text-sm font-semibold text-neutral-900">{nav.label}</span>
                <span className="text-xs text-neutral-500">{nav.sub}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Recurring themes ── */}
      <section>
        <h2 className="text-base font-semibold text-neutral-900 mb-1">Recurring Themes</h2>
        <p className="text-xs text-neutral-500 mb-3">Strategic priorities tracked across congress years</p>
        <div className="flex flex-wrap gap-2">
          {themes.map(t => (
            <div
              key={t.id}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2"
            >
              <p className="text-xs font-semibold text-neutral-800">{t.title}</p>
              <p className="text-xs text-neutral-500 mt-0.5">Since {t.first_year}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Past congresses strip ── */}
      {pastEvents.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-neutral-900 mb-3">Past Congresses</h2>
          <div className="space-y-2">
            {pastEvents.slice(0, 3).map(ev => (
              <Link
                key={ev.id}
                href={`/app/congress/archive?year=${ev.year}`}
                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{ev.title}</p>
                  <p className="text-xs text-neutral-500">{formatEventDates(ev.start_date, ev.end_date)} · {ev.location}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <EventStatusBadge status={ev.status} />
                  <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
