import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'

type Milestone = {
  id: string
  title: string
  description: string | null
  milestone_date: string
  status: string
  workstream_title: string | null
}

const STATUS_META: Record<string, { color: string; dot: string; label: string }> = {
  completed:   { color: 'border-emerald-200 bg-emerald-50', dot: 'bg-emerald-500', label: 'Completed' },
  in_progress: { color: 'border-blue-200 bg-blue-50',       dot: 'bg-blue-500',    label: 'In progress' },
  upcoming:    { color: 'border-neutral-200 bg-white',       dot: 'bg-neutral-300', label: 'Upcoming' },
  cancelled:   { color: 'border-neutral-200 bg-neutral-50',  dot: 'bg-neutral-200', label: 'Cancelled' },
}

export default async function CongressWorkspaceTimelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: events } = await supabase
    .from('congress_events')
    .select('id, title, start_date, end_date')
    .order('year', { ascending: false })
    .limit(1)
  const event = events?.[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: rawWsRows } = event
    ? await sb.from('congress_workstreams').select('id, title').eq('congress_id', event.id)
    : { data: [] }
  const wsRows = (rawWsRows ?? []) as Array<{id:string;title:string}>
  const wsMap: Record<string, string> = {}
  for (const ws of wsRows) wsMap[ws.id] = ws.title

  const { data: rawMlRows } = event
    ? await sb.from('congress_milestones')
        .select('id, title, description, milestone_date, status, workstream_id')
        .eq('congress_id', event.id)
        .order('milestone_date')
    : { data: [] }
  const mlRows = (rawMlRows ?? []) as Array<{id:string;title:string;description:string|null;milestone_date:string;status:string;workstream_id:string|null}>

  const milestones: Milestone[] = mlRows.map(m => ({
    ...m,
    workstream_title: m.workstream_id ? (wsMap[m.workstream_id] ?? null) : null,
  }))

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Timeline</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {event?.title ?? 'Congress'} milestones
          {event?.start_date && event?.end_date && (
            <> · {new Date(event.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' – '}{new Date(event.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
          )}
        </p>
      </div>

      <WorkspaceNav active="timeline" />

      {milestones.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          No milestones yet for this congress event.
        </div>
      )}

      {milestones.length > 0 && (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-200" />

          <div className="space-y-4 pl-12">
            {milestones.map(m => {
              const meta = STATUS_META[m.status] ?? STATUS_META.upcoming
              const isPast = m.milestone_date < today
              return (
                <div key={m.id} className="relative">
                  {/* Timeline dot */}
                  <span className={`absolute -left-8 mt-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow ${meta.dot}`} />

                  <div className={`rounded-xl border p-4 shadow-sm ${meta.color}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{m.title}</p>
                        {m.workstream_title && (
                          <p className="mt-0.5 text-xs text-neutral-500">{m.workstream_title}</p>
                        )}
                        {m.description && (
                          <p className="mt-1 text-xs text-neutral-600 line-clamp-2">{m.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs font-semibold text-neutral-600">
                          {new Date(m.milestone_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          m.status === 'completed'   ? 'bg-emerald-100 text-emerald-700' :
                          m.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          m.status === 'cancelled'   ? 'bg-neutral-100 text-neutral-500' :
                          isPast ? 'bg-red-100 text-red-600' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {isPast && m.status === 'upcoming' ? 'Overdue' : meta.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
