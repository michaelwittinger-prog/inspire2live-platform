import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_TASKS, DEMO_INITIATIVE_IDS } from '@/lib/demo-data'
import { CreateTaskButton } from '@/components/ui/client-buttons'
import { TasksView } from '@/components/initiatives/tasks-view'
import type { TaskRow } from '@/components/initiatives/tasks-view'

export default async function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Capture server time once
  const nowMs = new Date().getTime()
  const weekMs = 7 * 24 * 60 * 60 * 1000

  const { data: dbTasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority, due_date, assignee_id, profiles(name)')
    .eq('initiative_id', id)
    .order('due_date', { ascending: true, nullsFirst: false })

  const usingDemo = !dbTasks || dbTasks.length === 0

  let tasks: TaskRow[]

  if (usingDemo) {
    const isRealDemoId = Object.values(DEMO_INITIATIVE_IDS).includes(id)
    const raw = isRealDemoId
      ? DEMO_TASKS.filter((t) => t.initiative_id === id)
      : DEMO_TASKS
    tasks = raw.map((t) => {
      const dueDateMs = t.due_date ? new Date(t.due_date).getTime() : null
      return {
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        assignee: t.assignee ?? 'Unassigned',
        isOverdue: dueDateMs !== null && dueDateMs < nowMs && t.status !== 'done',
        isDueThisWeek:
          dueDateMs !== null &&
          dueDateMs >= nowMs &&
          dueDateMs <= nowMs + weekMs,
      }
    })
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tasks = (dbTasks as any[]).map((t) => {
      const dueDateMs = t.due_date ? new Date(t.due_date).getTime() : null
      return {
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        assignee_id: t.assignee_id,
        assignee: t.profiles?.name ?? 'Unassigned',
        isOverdue: dueDateMs !== null && dueDateMs < nowMs && t.status !== 'done',
        isDueThisWeek:
          dueDateMs !== null &&
          dueDateMs >= nowMs &&
          dueDateMs <= nowMs + weekMs,
      }
    })
  }

  // Summary counts for header
  const openCount = tasks.filter((t) => t.status !== 'done').length
  const overdueCount = tasks.filter((t) => t.isOverdue).length
  const blockedCount = tasks.filter((t) => t.status === 'blocked').length

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Tasks</h2>
          <p className="text-sm text-neutral-500">
            {openCount} open · {tasks.length} total
            {overdueCount > 0 && (
              <span className="ml-2 font-medium text-red-600">· ⚠ {overdueCount} overdue</span>
            )}
            {blockedCount > 0 && (
              <span className="ml-2 font-medium text-red-600">· ⛔ {blockedCount} blocked</span>
            )}
          </p>
        </div>
        <CreateTaskButton initiativeId={id} />
      </div>

      {usingDemo && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
          📋 Showing demo task data
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 py-12 text-center">
          <p className="text-sm font-medium text-neutral-600">No tasks yet</p>
          <p className="mt-1 text-xs text-neutral-400">
            Create the first task to start tracking work for this initiative.
          </p>
        </div>
      ) : (
        <TasksView tasks={tasks} initiativeId={id} />
      )}
    </div>
  )
}
