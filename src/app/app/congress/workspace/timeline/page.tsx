import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_CONGRESS_EVENTS } from '@/lib/demo-data'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { MilestoneCreateForm } from '@/components/congress/workspace/create-forms'

type Milestone = {
  id: string
  title: string
  milestone_date: string
  status: string
  workstream_id: string | null
  workstream_title?: string | null
}

const STATUS_COLOR: Record<string, string> = {
  upcoming:    'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-orange-100 text-orange-800 border-orange-200',
  completed:   'bg-green-100 text-green-800 border-green-200',
  cancelled:   'bg-neutral-100 text-neutral-500 border-neutral-200',
}

export default async function CongressWorkspaceTimelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  const platformRole: string = (profile as { role?: string } | null)?.role ?? 'PatientAdvocate'
  const canCreate = ['PlatformAdmin', 'HubCoordinator'].includes(platformRole)

  const { data: events } = await supabase
    .from('congress_events').select('id, title').order('year', { ascending: false }).limit(1)
  const event = events?.[0] ?? DEMO_CONGRESS_EVENTS[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const [milestonesResult, workstreamsResult] = await Promise.all([
    event
      ? sb.from('congress_milestones')
          .select('id, title, milestone_date, status, workstream_id')
          .eq('congress_id', event.id)
          .order('milestone_date', { ascending: true })
      : { data: [] },
    event
      ? sb.from('congress_workstreams').select('id, title').eq('congress_id', event.id)
      : { data: [] },
  ])

  const wsMap: Record<string, string> = {}
  for (const ws of (workstreamsResult.data ?? []) as Array<{id:string;title:string}>) {
    wsMap[ws.id] = ws.title
  }

  const milestones: Milestone[] = ((milestonesResult.data ?? []) as Array<{
    id: string; title: string; milestone_date: string; status: string; workstream_id: string | null
  }>).map(m => ({
    ...m,
    workstream_title: m.workstream_id ? (wsMap[m.workstream_id] ?? null) : null,
  }))

  const wsRows = (workstreamsResult.data ?? []) as Array<{id:string;title:string}>

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = milestones.filter(m => m.milestone_date >= today && m.status !== 'completed' && m.status !== 'cancelled')
  const past     = milestones.filter(m => m.milestone_date < today || m.status === 'completed' || m.status === 'cancelled')

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Timeline</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {event?.title ?? 'Congress'} — {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && (
          <MilestoneCreateForm congressId={event.id} workstreams={wsRows} />
        )}
      </div>

      <WorkspaceNav active="timeline" />

      {milestones.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          {canCreate
            ? 'No milestones yet. Use "+ Add milestone" above to create the first one.'
            : 'No milestones set for this congress event.'}
        </div>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Upcoming</h2>
          <ol className="relative border-l border-orange-200 pl-6 space-y-4">
            {upcoming.map(m => (
              <li key={m.id} className="relative">
                <span className="absolute -left-[28px] flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 border border-orange-300 ring-4 ring-white">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                </span>
                <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{m.title}</p>
                      {m.workstream_title && (
                        <p className="text-xs text-neutral-500">{m.workstream_title}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[m.status] ?? STATUS_COLOR.upcoming}`}>
                        {m.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {new Date(m.milestone_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Past / Completed</h2>
          <ol className="relative border-l border-neutral-200 pl-6 space-y-4">
            {past.map(m => (
              <li key={m.id} className="relative">
                <span className="absolute -left-[28px] flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100 border border-neutral-300 ring-4 ring-white">
                  <span className="h-2 w-2 rounded-full bg-neutral-400" />
                </span>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">{m.title}</p>
                      {m.workstream_title && (
                        <p className="text-xs text-neutral-400">{m.workstream_title}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[m.status] ?? STATUS_COLOR.upcoming}`}>
                        {m.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {new Date(m.milestone_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
