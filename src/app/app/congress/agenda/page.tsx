import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SESSION_TYPE_META, type CongressSession } from '@/lib/congress'
import { DEMO_CONGRESS_SESSIONS } from '@/lib/demo-data'

function formatTime(ts: string | null): string {
  if (!ts) return 'TBC'
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })
}

function formatDay(ts: string | null): string {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' })
}

function SessionCard({ s }: { s: CongressSession }) {
  const meta = SESSION_TYPE_META[s.session_type]
  return (
    <div className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      {/* Time column */}
      <div className="shrink-0 w-16 text-center">
        <p className="text-sm font-bold text-neutral-900">{formatTime(s.start_time)}</p>
        {s.end_time && <p className="text-xs text-neutral-400">{formatTime(s.end_time)}</p>}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
            {meta.icon} {meta.label}
          </span>
          {s.room && (
            <span className="text-xs text-neutral-400">📍 {s.room}</span>
          )}
          {(s.decision_count ?? 0) > 0 && (
            <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              {s.decision_count} decision{(s.decision_count ?? 0) > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-neutral-900">{s.title}</h3>
        {s.description && (
          <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{s.description}</p>
        )}
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-400">
          {s.session_lead_name && <span>Lead: <span className="text-neutral-600">{s.session_lead_name}</span></span>}
        </div>
      </div>
    </div>
  )
}

export default async function CongressAgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbSessions } = await supabase
    .from('congress_sessions')
    .select('*')
    .order('agenda_order', { ascending: true })

  const sessions: CongressSession[] = (dbSessions && dbSessions.length > 0)
    ? dbSessions as unknown as CongressSession[]
    : DEMO_CONGRESS_SESSIONS

  // Group by day
  const byDay = sessions.reduce<Record<string, CongressSession[]>>((acc, s) => {
    const day = s.start_time ? formatDay(s.start_time) : 'Unscheduled'
    if (!acc[day]) acc[day] = []
    acc[day].push(s)
    return acc
  }, {})

  const days = Object.keys(byDay)

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Congress Agenda</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Congress 2026 · 13–14 November · Amsterdam — all times CET (Europe/Amsterdam)
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(SESSION_TYPE_META).map(([key, m]) => (
          <span key={key} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${m.color}`}>
            {m.icon} {m.label}
          </span>
        ))}
      </div>

      {/* Sessions by day */}
      {days.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center">
          <p className="text-sm text-neutral-500">Agenda is being finalised. Check back once topics are approved.</p>
        </div>
      ) : (
        days.map(day => (
          <section key={day}>
            <h2 className="text-base font-semibold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">{day}</h2>
            <div className="space-y-3">
              {byDay[day].map(s => <SessionCard key={s.id} s={s} />)}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
