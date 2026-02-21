import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { WorkstreamCreateForm } from '@/components/congress/workspace/create-forms'
import { fetchLatestWorkspaceEvent } from '@/lib/congress-workspace/current-event'
import { WorkspaceDiagnostics } from '@/components/congress/workspace/workspace-diagnostics'
import { StageGuide } from '@/components/congress/workspace/stage-guide'
import { StatusBadge } from '@/components/ui/status-badge'
import type { StatusTone } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'

const HEALTH_BADGE: Record<string, string> = {
  on_track: 'bg-green-100 text-green-800 border-green-200',
  at_risk:  'bg-amber-100 text-amber-800 border-amber-200',
  blocked:  'bg-red-100 text-red-800 border-red-200',
}
function HealthBadge({ health }: { health: string }) {
  return (
    <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${HEALTH_BADGE[health] ?? HEALTH_BADGE.on_track}`}>
      {health.replace('_', ' ')}
    </span>
  )
}

type Workstream = {
  id: string
  title: string
  description: string | null
  owner_role: string | null
  health: string
  progress_pct: number
  next_milestone: string | null
  sort_order: number | null
}

type Task = {
  id: string
  title: string
  status: string
  priority: string
  lane: string
  due_date: string | null
  owner_name: string | null
  workstream_id: string | null
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct))
  const color = clamped >= 80 ? 'bg-green-500' : clamped >= 40 ? 'bg-orange-400' : 'bg-red-400'
  return (
    <div className="h-1.5 w-full rounded-full bg-neutral-200">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}

export default async function CongressWorkspaceWorkstreamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  const platformRole: string = (profile as { role?: string } | null)?.role ?? 'PatientAdvocate'
  const canCreate = ['PlatformAdmin', 'HubCoordinator'].includes(platformRole)

  const { event, issues } = await fetchLatestWorkspaceEvent(supabase)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { data: rawRows, error: wsError } = event
    ? await sb.from('congress_workstreams')
        .select('id, title, description, owner_role, health, progress_pct, next_milestone, sort_order')
        .eq('congress_id', event.id)
        .order('sort_order', { ascending: true })
    : { data: [] }
  const workstreams = (rawRows ?? []) as Workstream[]

  const { data: rawTaskRows, error: taskError } = event
    ? await sb.from('congress_tasks')
        .select('id, title, status, priority, lane, due_date, owner_name, workstream_id')
        .eq('congress_id', event.id)
        .order('lane')
        .order('priority')
    : { data: [] }
  const tasks = (rawTaskRows ?? []) as Task[]

  const allIssues = [...issues]
  if (wsError) {
    allIssues.push({ scope: 'congress_workstreams.select', message: wsError.message, code: wsError.code, hint: (wsError as unknown as { hint?: string }).hint })
  }
  if (taskError) {
    allIssues.push({ scope: 'congress_tasks.select_for_workstreams', message: taskError.message, code: taskError.code, hint: (taskError as unknown as { hint?: string }).hint })
  }

  const tasksByWorkstreamId: Record<string, Task[]> = {}
  const unassignedTasks: Task[] = []
  for (const t of tasks) {
    if (!t.workstream_id) {
      unassignedTasks.push(t)
      continue
    }
    tasksByWorkstreamId[t.workstream_id] ??= []
    tasksByWorkstreamId[t.workstream_id].push(t)
  }

  function dueLabel(due: string | null) {
    if (!due) return '—'
    return new Date(due).toLocaleDateString('en-GB')
  }

  function statusToneFor(s: string): StatusTone {
    return s === 'done'        ? 'green'
      : s === 'blocked'       ? 'red'
      : s === 'in_progress'   ? 'blue'
      : 'neutral'
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <WorkspaceDiagnostics issues={allIssues} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Workstreams</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {event?.title ?? 'Congress'} — {workstreams.length} workstream{workstreams.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && event && <WorkstreamCreateForm congressId={event.id} />}
      </div>

      <WorkspaceNav active="workstreams" status={event?.status} />

      <StageGuide status={event?.status} section="workstreams" />

      {workstreams.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          {canCreate
            ? 'No workstreams yet. Use "+ Add workstream" above to create the first one.'
            : 'No workstreams configured for this congress event yet.'}
        </div>
      )}

      {workstreams.length > 0 && (
        <div className="space-y-4">
          {workstreams.map(ws => {
            const wsTasks = tasksByWorkstreamId[ws.id] ?? []
            const openCount = wsTasks.filter(t => t.status !== 'done').length
            const blockedCount = wsTasks.filter(t => t.status === 'blocked').length
            return (
              <div key={ws.id} className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-neutral-900">{ws.title}</h3>
                        <HealthBadge health={ws.health} />
                        {wsTasks.length > 0 && (
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
                            {openCount} open
                          </span>
                        )}
                        {blockedCount > 0 && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                            {blockedCount} blocked
                          </span>
                        )}
                      </div>
                      {ws.description && (
                        <p className="text-xs text-neutral-500">{ws.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-600">
                        {ws.owner_role && (
                          <span className="rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5">
                            {ws.owner_role}
                          </span>
                        )}
                        {ws.next_milestone && (
                          <span className="text-neutral-500">
                            Next: <span className="font-medium text-neutral-700">{ws.next_milestone}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 min-w-[92px]">
                      <span className="text-xs font-semibold text-neutral-700">{ws.progress_pct ?? 0}%</span>
                      <div className="w-28">
                        <ProgressBar pct={ws.progress_pct ?? 0} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                <div className="border-t border-neutral-200 bg-neutral-50/60">
                  <div className="px-4 py-2 flex items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                      Tasks
                    </p>
                    <div className="h-px flex-1 bg-neutral-200" />
                  </div>

                  {wsTasks.length === 0 && (
                    <div className="px-4 pb-4">
                      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-4 text-xs text-neutral-500">
                        No tasks linked to this workstream yet.
                      </div>
                    </div>
                  )}

                  {wsTasks.length > 0 && (
                    <div className="px-4 pb-4 space-y-2">
                      {wsTasks.map(t => (
                        <div key={t.id} className="rounded-xl border border-neutral-200 bg-white p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-neutral-900">{t.title}</p>
                              <p className="mt-0.5 text-xs text-neutral-500">
                                {t.lane} · Owner: {t.owner_name ?? '—'} · Due: {dueLabel(t.due_date)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge label={t.status.replace('_', ' ')} tone={statusToneFor(t.status)} />
                              <PriorityBadge priority={t.priority as 'low' | 'medium' | 'high' | 'urgent'} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {unassignedTasks.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="p-4">
                <h3 className="text-sm font-bold text-neutral-900">Unassigned tasks</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  These tasks are not linked to a workstream yet.
                </p>
              </div>
              <div className="border-t border-neutral-200 bg-neutral-50/60 px-4 pb-4 pt-3 space-y-2">
                {unassignedTasks.map(t => (
                  <div key={t.id} className="rounded-xl border border-neutral-200 bg-white p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900">{t.title}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {t.lane} · Owner: {t.owner_name ?? '—'} · Due: {dueLabel(t.due_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge label={t.status.replace('_', ' ')} tone={statusToneFor(t.status)} />
                        <PriorityBadge priority={t.priority as 'low' | 'medium' | 'high' | 'urgent'} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
