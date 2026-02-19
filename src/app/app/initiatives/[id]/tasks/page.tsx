import { createClient } from '@/lib/supabase/server'
import {
  groupTasksByStatus,
  priorityTone,
  TASK_STATUS_ORDER,
  TASK_STATUS_LABELS,
  taskStatusStyle,
} from '@/lib/initiative-workspace'
import Link from 'next/link'

type TaskRow = {
  id: string
  title: string
  status: string
  priority: string
  assignee_id: string
  due_date: string | null
  assignee: { name: string } | null
}

export default async function InitiativeTasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string; priority?: string; view?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()

  const { data } = await supabase
    .from('tasks')
    .select('id, title, status, priority, assignee_id, due_date, assignee:profiles!tasks_assignee_id_fkey(name)')
    .eq('initiative_id', id)
    .order('created_at', { ascending: false })

  const statusFilter = sp.status ?? 'all'
  const priorityFilter = sp.priority ?? 'all'
  const view = sp.view ?? 'kanban'

  const rows = ((data ?? []) as unknown as TaskRow[]).filter((task) => {
    const statusOk = statusFilter === 'all' || task.status === statusFilter
    const priorityOk = priorityFilter === 'all' || task.priority === priorityFilter
    return statusOk && priorityOk
  })

  const grouped = groupTasksByStatus(rows) as Record<(typeof TASK_STATUS_ORDER)[number], TaskRow[]>

  const baseUrl = `/app/initiatives/${id}/tasks`
  const filterLink = (key: string, val: string) => {
    const s = key === 'status' ? val : statusFilter
    const p = key === 'priority' ? val : priorityFilter
    const v = key === 'view' ? val : view
    return `${baseUrl}?status=${s}&priority=${p}&view=${v}`
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date(new Date().toDateString())
  }

  return (
    <div className="space-y-4">
      {/* Filter + View Toggle Bar */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Status filters */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs font-semibold text-neutral-500 mr-1">Status:</span>
            {['all', ...TASK_STATUS_ORDER].map((s) => (
              <Link
                key={s}
                href={filterLink('status', s)}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {s === 'all' ? 'All' : TASK_STATUS_LABELS[s]}
              </Link>
            ))}
          </div>
          {/* Priority filters */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs font-semibold text-neutral-500 mr-1">Priority:</span>
            {['all', 'urgent', 'high', 'medium', 'low'].map((p) => (
              <Link
                key={p}
                href={filterLink('priority', p)}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  priorityFilter === p
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
              </Link>
            ))}
          </div>
          {/* View toggle */}
          <div className="ml-auto flex items-center gap-1">
            <Link
              href={filterLink('view', 'kanban')}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                view === 'kanban'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Kanban
            </Link>
            <Link
              href={filterLink('view', 'list')}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                view === 'list'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              List
            </Link>
          </div>
        </div>
        <p className="mt-2 text-xs text-neutral-400">{rows.length} task{rows.length !== 1 ? 's' : ''} shown</p>
      </section>

      {rows.length === 0 ? (
        <section className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm font-medium text-neutral-600">No tasks match this filter.</p>
          <p className="mt-1 text-sm text-neutral-400">Try changing the status or priority filter above.</p>
        </section>
      ) : view === 'list' ? (
        /* ── List View ── */
        <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <ul className="divide-y divide-neutral-100">
            {rows.map((task) => (
              <li key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 truncate">{task.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {task.assignee?.name ?? 'Unassigned'}
                    {task.due_date && (
                      <>
                        {' · '}
                        <span className={isOverdue(task.due_date) ? 'text-red-600 font-medium' : ''}>
                          Due {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {isOverdue(task.due_date) && ' (overdue)'}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityTone(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${taskStatusStyle(task.status)}`}>
                    {TASK_STATUS_LABELS[task.status] ?? task.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        /* ── Kanban View ── */
        <section className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
            {TASK_STATUS_ORDER.map((status) => {
              const colTasks = grouped[status]
              const cfg = taskStatusStyle(status)
              return (
                <div key={status} className="w-60 shrink-0 rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm">
                  {/* Column header */}
                  <div className="flex items-center justify-between px-3 py-3 border-b border-neutral-200">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${cfg}`}>
                      {TASK_STATUS_LABELS[status]}
                    </span>
                    <span className="text-xs font-semibold text-neutral-400">{colTasks.length}</span>
                  </div>
                  {/* Cards */}
                  <div className="space-y-2 p-2">
                    {colTasks.length === 0 ? (
                      <p className="px-1 py-4 text-center text-xs text-neutral-400">Empty</p>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm"
                        >
                          <p className="text-sm font-medium text-neutral-900 leading-snug line-clamp-2">
                            {task.title}
                          </p>
                          <div className="mt-2 flex items-center justify-between gap-1">
                            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${priorityTone(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.due_date && (
                              <span
                                className={`text-xs ${
                                  isOverdue(task.due_date) ? 'text-red-600 font-medium' : 'text-neutral-400'
                                }`}
                              >
                                {new Date(task.due_date).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                            )}
                          </div>
                          {task.assignee?.name && (
                            <p className="mt-1.5 text-xs text-neutral-500 truncate">
                              {task.assignee.name}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
