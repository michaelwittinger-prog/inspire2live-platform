import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  enrichDecisions,
  computeDecisionStats,
  slaBadge,
  CONVERSION_STATUS_META,
  type CongressDecision,
} from '@/lib/congress'
import { DEMO_CONGRESS_DECISIONS } from '@/lib/demo-data'
import { PlaceholderButton } from '@/components/ui/client-buttons'

function ConvertIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  )
}

function DecisionRow({ d }: { d: CongressDecision }) {
  const sla = slaBadge(d)
  const statusMeta = CONVERSION_STATUS_META[d.conversion_status]
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${sla.urgent && d.conversion_status === 'pending' ? 'border-red-200' : 'border-neutral-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusMeta.badge}`}>
              {statusMeta.icon} {statusMeta.label}
            </span>
            {d.conversion_status === 'pending' && (
              <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sla.badge}`}>
                {sla.label}
              </span>
            )}
          </div>
          <h3 className="mt-2 text-sm font-semibold text-neutral-900">{d.title}</h3>
          {(d.description ?? d.body) && (
            <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{d.description ?? d.body}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
            {d.initiative_title && <span>Initiative: <span className="text-neutral-600">{d.initiative_title}</span></span>}
            {d.owner_name && <span>Owner: <span className="text-neutral-600">{d.owner_name}</span></span>}
            {d.deadline && <span>Deadline: <span className="text-neutral-600">{new Date(d.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>}
          </div>
        </div>
        {d.conversion_status === 'pending' && (
          <PlaceholderButton
            label="Convert"
            icon={<ConvertIcon />}
            message={`To convert "${d.title}" to a task, assign it an owner and initiative in the full decision workspace (coming in Phase 2).`}
          />
        )}
        {d.conversion_status === 'converted' && d.converted_task_id && (
          <Link
            href={`/app/tasks`}
            className="shrink-0 flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
          >
            View task →
          </Link>
        )}
      </div>
    </div>
  )
}

export default async function CongressDecisionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbDecisions } = await supabase
    .from('congress_decisions')
    .select('*')
    .order('captured_at', { ascending: false })

  const raw: CongressDecision[] = (dbDecisions && dbDecisions.length > 0)
    ? dbDecisions as unknown as CongressDecision[]
    : DEMO_CONGRESS_DECISIONS

  const decisions = enrichDecisions(raw)
  const stats = computeDecisionStats(decisions)

  const pending    = decisions.filter(d => d.conversion_status === 'pending')
  const overdue    = pending.filter(d => (d.sla_hours_remaining ?? 0) < 0)
  const urgent     = pending.filter(d => (d.sla_hours_remaining ?? 99) >= 0 && (d.sla_hours_remaining ?? 99) < 12)
  const safe       = pending.filter(d => (d.sla_hours_remaining ?? 99) >= 12)
  const needsClar  = decisions.filter(d => d.conversion_status === 'needs_clarification')
  const converted  = decisions.filter(d => d.conversion_status === 'converted')
  const declined   = decisions.filter(d => d.conversion_status === 'declined')

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Decision Pipeline</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Every congress decision must be converted to a task within 48 hours.
          This is the single source of truth for that commitment.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total',      value: stats.total,                   color: 'text-neutral-900' },
          { label: 'Converted',  value: stats.converted,               color: 'text-green-700' },
          { label: 'Pending',    value: stats.pending,                 color: 'text-orange-700' },
          { label: 'Overdue',    value: stats.overdue,                 color: stats.overdue > 0 ? 'text-red-700' : 'text-neutral-400' },
          { label: 'Rate',       value: `${stats.conversion_rate_pct}%`, color: 'text-neutral-900' },
        ].map(k => (
          <div key={k.label} className="rounded-lg border border-neutral-200 bg-white p-3 text-center">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex justify-between text-xs text-neutral-500 mb-2">
          <span>Conversion progress</span>
          <span>{stats.converted}/{stats.total} converted</span>
        </div>
        <div className="h-3 w-full rounded-full bg-neutral-100 overflow-hidden">
          <div className="h-full rounded-full bg-green-500" style={{ width: `${stats.conversion_rate_pct}%` }} />
        </div>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-red-800 mb-3 flex items-center gap-2">
            <span>⚠️ Overdue ({overdue.length})</span>
            <span className="text-xs font-normal text-red-600">48h SLA exceeded</span>
          </h2>
          <div className="space-y-2">{overdue.map(d => <DecisionRow key={d.id} d={d} />)}</div>
        </section>
      )}

      {/* Urgent */}
      {urgent.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-orange-800 mb-3">🔥 Urgent — under 12h remaining ({urgent.length})</h2>
          <div className="space-y-2">{urgent.map(d => <DecisionRow key={d.id} d={d} />)}</div>
        </section>
      )}

      {/* Safe pending */}
      {safe.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-neutral-900 mb-3">⏳ Pending ({safe.length})</h2>
          <div className="space-y-2">{safe.map(d => <DecisionRow key={d.id} d={d} />)}</div>
        </section>
      )}

      {/* Needs clarification */}
      {needsClar.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-neutral-900 mb-3">❓ Needs Clarification ({needsClar.length})</h2>
          <div className="space-y-2">{needsClar.map(d => <DecisionRow key={d.id} d={d} />)}</div>
        </section>
      )}

      {/* Converted */}
      {converted.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-neutral-900 mb-3">✅ Converted to Tasks ({converted.length})</h2>
          <div className="space-y-2">{converted.map(d => <DecisionRow key={d.id} d={d} />)}</div>
        </section>
      )}

      {/* Declined */}
      {declined.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-neutral-500 mb-3">Declined ({declined.length})</h2>
          <div className="space-y-2">{declined.map(d => <DecisionRow key={d.id} d={d} />)}</div>
        </section>
      )}

      {decisions.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center">
          <p className="text-sm text-neutral-500">No decisions captured yet. Decisions are recorded during congress sessions.</p>
        </div>
      )}
    </div>
  )
}
