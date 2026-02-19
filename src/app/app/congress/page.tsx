import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

// ─── Decision conversion helpers ──────────────────────────────────────────────
function conversionBadge(status: string) {
  switch (status) {
    case 'converted':          return { cls: 'bg-emerald-100 text-emerald-700', label: 'Converted to Task' }
    case 'needs_clarification': return { cls: 'bg-amber-100 text-amber-700',    label: 'Needs Clarification' }
    case 'declined':           return { cls: 'bg-red-100 text-red-700',         label: 'Declined' }
    default:                   return { cls: 'bg-neutral-100 text-neutral-600',  label: 'Pending Conversion' }
  }
}

function topicStatusBadge(status: string) {
  switch (status) {
    case 'approved':   return 'bg-emerald-100 text-emerald-700'
    case 'rejected':   return 'bg-red-100 text-red-700'
    case 'discussing': return 'bg-blue-100 text-blue-700'
    default:           return 'bg-neutral-100 text-neutral-600'
  }
}

type DecisionRow = {
  id: string
  title: string
  body: string
  conversion_status: string
  captured_at: string
  initiative_id: string | null
  initiative_title?: string
}

type TopicRow = {
  id: string
  title: string
  description: string
  status: string
  vote_count: number
  submitted_by_name: string
  created_at: string
}

export default async function CongressPage() {
  const supabase = await createClient()

  // Hoist time constants
  const now = new Date()
  const nowMs = now.getTime()
  const cutoff48h = new Date(nowMs - 48 * 3600 * 1000).toISOString()

  // ── Fetch congress decisions ──────────────────────────────────────────────
  const { data: rawDecisions } = await supabase
    .from('congress_decisions')
    .select(
      'id, title, body, conversion_status, captured_at, initiative_id, initiative:initiatives!congress_decisions_initiative_id_fkey(title)',
    )
    .order('captured_at', { ascending: false })

  type RawDecision = {
    id: string; title: string; body: string
    conversion_status: string; captured_at: string; initiative_id: string | null
    initiative: { title: string } | null
  }

  const decisions: DecisionRow[] = ((rawDecisions ?? []) as unknown as RawDecision[]).map((d) => ({
    id: d.id,
    title: d.title,
    body: d.body,
    conversion_status: d.conversion_status ?? 'pending',
    captured_at: d.captured_at,
    initiative_id: d.initiative_id,
    initiative_title: d.initiative?.title,
  }))

  // ── Fetch congress topics ─────────────────────────────────────────────────
  const { data: rawTopics } = await supabase
    .from('congress_topics')
    .select(
      'id, title, description, status, vote_count, created_at, submitted_by:profiles!congress_topics_submitted_by_fkey(name)',
    )
    .order('vote_count', { ascending: false })

  type RawTopic = {
    id: string; title: string; description: string
    status: string; vote_count: number; created_at: string
    submitted_by: { name: string } | null
  }

  const topics: TopicRow[] = ((rawTopics ?? []) as unknown as RawTopic[]).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status ?? 'submitted',
    vote_count: t.vote_count ?? 0,
    submitted_by_name: t.submitted_by?.name ?? 'Unknown',
    created_at: t.created_at,
  }))

  // ── Computed stats ────────────────────────────────────────────────────────
  const pending    = decisions.filter((d) => !d.conversion_status || d.conversion_status === 'pending')
  const overdue48h = pending.filter((d) => d.captured_at < cutoff48h)
  const converted  = decisions.filter((d) => d.conversion_status === 'converted')
  const conversionRate = decisions.length > 0
    ? Math.round((converted.length / decisions.length) * 100)
    : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Congress</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Decision pipeline · topic submissions · voting</p>
        </div>
        <Link
          href="/app/congress/submit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition-colors"
        >
          + Submit Topic
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Decisions', value: decisions.length,  color: 'text-neutral-900' },
          { label: 'Converted',       value: converted.length,  color: 'text-emerald-700' },
          { label: '⚠️ Overdue 48h',  value: overdue48h.length, color: overdue48h.length > 0 ? 'text-red-600' : 'text-neutral-900' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, color: 'text-blue-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="mt-1 text-xs font-medium text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Decision Pipeline */}
      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Decision Pipeline</h2>
          <span className="text-xs text-neutral-400">{decisions.length} decisions</span>
        </div>
        {decisions.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-neutral-400">No congress decisions recorded yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {decisions.map((d) => {
              const badge = conversionBadge(d.conversion_status)
              const capturedDate = new Date(d.captured_at)
              const hoursAgo = Math.floor((nowMs - capturedDate.getTime()) / 3_600_000)
              const isOverdue = d.conversion_status === 'pending' && d.captured_at < cutoff48h
              return (
                <li key={d.id} className={`px-5 py-4 ${isOverdue ? 'bg-red-50' : 'hover:bg-neutral-50'} transition-colors`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-neutral-900">{d.title}</p>
                        {isOverdue && (
                          <span className="rounded px-1.5 py-0.5 text-xs font-bold bg-red-100 text-red-700">⏰ Overdue 48h</span>
                        )}
                      </div>
                      {d.body && (
                        <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{d.body}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                        {d.initiative_title && (
                          <Link
                            href={`/app/initiatives/${d.initiative_id}`}
                            className="text-xs text-orange-700 hover:underline"
                          >
                            {d.initiative_title}
                          </Link>
                        )}
                        <span className="text-xs text-neutral-400">
                          Captured {hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                      {/* 48h progress bar for pending decisions */}
                      {d.conversion_status === 'pending' && (
                        <div className="mt-2">
                          <div className="h-1.5 w-28 rounded-full bg-neutral-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isOverdue ? 'bg-red-500' : 'bg-orange-400'}`}
                              style={{ width: `${Math.min(100, Math.round((hoursAgo / 48) * 100))}%` }}
                            />
                          </div>
                          <p className="mt-0.5 text-xs text-neutral-400 text-right">
                            {isOverdue ? 'Past 48h' : `${Math.max(0, 48 - hoursAgo)}h left`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Topic Submissions + Voting */}
      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Topic Submissions</h2>
          <span className="text-xs text-neutral-400">{topics.length} topics</span>
        </div>
        {topics.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-neutral-400">No topics submitted yet.</p>
            <p className="mt-2 text-xs text-neutral-400">
              Be the first —{' '}
              <Link href="/app/congress/submit" className="text-orange-700 hover:underline">
                submit a topic
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {topics.map((t, idx) => (
              <li key={t.id} className="flex items-start gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors">
                {/* Rank */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold text-neutral-600">
                  {idx + 1}
                </div>
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-neutral-900">{t.title}</p>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${topicStatusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                  {t.description && (
                    <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{t.description}</p>
                  )}
                  <p className="mt-1 text-xs text-neutral-400">
                    by <span className="font-medium text-neutral-600">{t.submitted_by_name}</span>
                    {' · '}
                    {new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {/* Vote count */}
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-sm hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
                    title="Vote for this topic"
                    aria-label={`Vote for ${t.title}`}
                  >
                    ▲
                  </button>
                  <span className="text-sm font-bold text-neutral-900">{t.vote_count}</span>
                  <span className="text-xs text-neutral-400">votes</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Topic Submission Form */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-900">Submit a New Topic</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Propose a topic for the next Congress session. All submitted topics are reviewed by the Bureau before being added to the agenda.
        </p>
        <form className="mt-4 space-y-3" action="#" method="POST">
          <div>
            <label htmlFor="topic-title" className="block text-xs font-semibold text-neutral-700 mb-1">
              Topic Title <span className="text-red-500">*</span>
            </label>
            <input
              id="topic-title"
              name="title"
              type="text"
              placeholder="e.g. Revised translation policy for patient-facing materials"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              required
            />
          </div>
          <div>
            <label htmlFor="topic-desc" className="block text-xs font-semibold text-neutral-700 mb-1">
              Description
            </label>
            <textarea
              id="topic-desc"
              name="description"
              rows={3}
              placeholder="Provide context, background, and what outcome you are seeking…"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label htmlFor="topic-initiative" className="block text-xs font-semibold text-neutral-700 mb-1">
              Related Initiative (optional)
            </label>
            <input
              id="topic-initiative"
              name="initiative"
              type="text"
              placeholder="Initiative name or leave blank"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
            >
              Submit Topic
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
