import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_CONGRESS_EVENTS } from '@/lib/demo-data'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { StatusBadge } from '@/components/ui/status-badge'
import type { StatusTone } from '@/components/ui/status-badge'
import { TaskCreateForm } from '@/components/congress/workspace/create-forms'

type Task = {
  id: string
  title: string
  status: string
  priority: string
  lane: string
  due_date: string | null
  owner_name: string | null
  workstream_id: string | null
  workstream_title?: string | null
  dep_count: number
}

export default async function CongressWorkspaceTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  const platformRole: string = (profile as { role?: string } | null)?.role ?? 'PatientAdvocate'
  const canCreate = ['PlatformAdmin', 'HubCoordinator'].includes(platformRole)

  const { data: events } = await supabase
    .from('congress_events')
    .select('id, title')
    .order('year', { ascending: false })
    .limit(1)
  const event = events?.[0] ?? DEMO_CONGRESS_EVENTS[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: rawTaskRows } = event
    ? await sb.from('congress_tasks')
        .select('id, title, status, priority, lane, due_date, owner_name, workstream_id')
        .eq('congress_id', event.id)
        .order('lane').order('priority')
    : { data: [] }
  const taskRows = (rawTaskRows ?? []) as Array<{id:string;title:string;status:string;priority:string;lane:string;due_date:string|null;owner_name:string|null;workstream_id:string|null}>

  const { data: rawWsRows } = event
    ? await sb.from('congress_workstreams').select('id, title').eq('congress_id', event.id)
    : { data: [] }
  const wsRows = (rawWsRows ?? []) as Array<{id:string;title:string}>

  const wsMap: Record<string, string> = {}
  for (const ws of wsRows) wsMap[ws.id] = ws.title

  const taskIds = taskRows.map(t => t.id)
  const { data: rawDepRows } = taskIds.length > 0
    ? await sb.from('congress_task_dependencies').select('task_id').in('task_id', taskIds)
    : { data: [] }
  const depRows = (rawDepRows ?? []) as Array<{task_id:string}>
  const depCount: Record<string, number> = {}
  for (const d of depRows) depCount[d.task_id] = (depCount[d.task_id] ?? 0) + 1

  const tasks: Task[] = taskRows.map(t => ({
    ...t,
    workstream_title: t.workstream_id ? (wsMap[t.workstream_id] ?? null) : null,
    dep_count: depCount[t.id] ?? 0,
  }))
  const blocked = tasks.filter(t => t.status === 'blocked')

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tasks</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {event?.title ?? 'Congress'} — {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            {blocked.length > 0 && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                {blocked.length} blocked
              </span>
            )}
          </p>
        </div>
        {canCreate && (
          <TaskCreateForm congressId={event.id} workstreams={wsRows} />
        )}
      </div>

      <WorkspaceNav active="tasks" />

      {tasks.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          {canCreate
            ? 'No tasks yet. Use "+ New task" above to add the first one.'
            : 'No tasks yet for this congress event.'}
        </div>
      )}

      {tasks.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Task</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Due</th>
                <th className="px-4 py-3 font-semibold">Deps</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => {
                const statusTone: StatusTone =
                  t.status === 'done'        ? 'green'   :
                  t.status === 'blocked'     ? 'red'     :
                  t.status === 'in_progress' ? 'blue'    : 'neutral'
                const priority = t.priority as 'low' | 'medium' | 'high' | 'urgent'
                return (
                  <tr key={t.id} className="border-t border-neutral-200 hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-neutral-900">{t.title}</p>
                      <p className="text-xs text-neutral-500">
                        {t.workstream_title ?? 'No workstream'} · {t.lane}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={t.status.replace('_', ' ')} tone={statusTone} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={priority} />
                    </td>
                    <td className="px-4 py-3 text-neutral-700 text-xs">
                      {t.owner_name ?? <span className="text-neutral-400">Unowned</span>}
                    </td>
                    <td className="px-4 py-3 text-neutral-700 text-xs">
                      {t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {t.dep_count > 0
                        ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{t.dep_count}</span>
                        : <span className="text-neutral-400 text-xs">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
