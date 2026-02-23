import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EVENT_STATUS_META, formatEventDates, normalizeEventStatus, type CongressEvent } from '@/lib/congress'

export default async function CongressArchivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbEvents } = await supabase
    .from('congress_events')
    .select('*')
    .order('year', { ascending: false })

  const events: CongressEvent[] = (dbEvents ?? []) as unknown as CongressEvent[]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Congress Archive</h1>
        <p className="mt-1 text-sm text-neutral-500">
          All Inspire2Live congresses — decisions, outcomes, and cross-year continuity.
        </p>
      </div>

      <div className="space-y-3">
        {events.map((ev, i) => {
          const meta = EVENT_STATUS_META[normalizeEventStatus(ev.status)]
          const isActive = normalizeEventStatus(ev.status) !== 'archived'
          return (
            <div
              key={ev.id}
              className={`rounded-xl border p-5 ${isActive ? 'border-orange-200 bg-linear-to-br from-orange-50 to-amber-50' : 'border-neutral-200 bg-white'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">{ev.year}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.badge}`}>
                      {meta.label}
                    </span>
                    {i > 0 && (
                      <span className="text-xs text-violet-600 flex items-center gap-0.5">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        linked to {ev.year - 1}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-neutral-900">{ev.title}</h2>
                  {ev.theme_headline && (
                    <p className="text-xs font-medium text-orange-700 mt-0.5">&ldquo;{ev.theme_headline}&rdquo;</p>
                  )}
                  <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed line-clamp-2">{ev.description}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-neutral-500">
                    <span>📅 {formatEventDates(ev.start_date, ev.end_date)}</span>
                    {ev.location && <span>📍 {ev.location}</span>}
                    {ev.decision_count != null && (
                      <span>
                        ⚡ {ev.decision_count} decisions
                        {ev.converted_count != null && (
                          <span className="ml-1 text-green-700 font-medium">
                            ({ev.converted_count} converted · {Math.round((ev.converted_count / ev.decision_count) * 100)}%)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                {isActive && (
                  <Link
                    href="/app/congress"
                    className="shrink-0 rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50 transition-colors"
                  >
                    Open →
                  </Link>
                )}
              </div>
            </div>
          )
        })}

        {events.length === 0 && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center">
            <p className="text-sm text-neutral-500">No visible congress archive entries for your invited congresses.</p>
          </div>
        )}
      </div>

      {/* Cross-year continuity note */}
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
        <h3 className="text-sm font-semibold text-violet-900 mb-1">📎 Cross-Year Continuity</h3>
        <p className="text-xs text-violet-700 leading-relaxed">
          Each congress builds on the previous year. Unresolved topics and decisions can be carried forward
          into the next congress cycle. Shared themes like <strong>Patient-Led Evidence</strong> and{' '}
          <strong>Equitable Access</strong> are tracked across years so you can see how priorities evolve
          and whether commitments are being met.
        </p>
      </div>
    </div>
  )
}
