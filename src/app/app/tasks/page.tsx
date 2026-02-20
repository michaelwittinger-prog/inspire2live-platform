import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_TASKS, DEMO_INITIATIVES } from '@/lib/demo-data'

const priorityStyle: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-neutral-100 text-neutral-600',
}
const statusStyle: Record<string, string> = {
  todo: 'border-neutral-300 text-neutral-600',
  in_progress: 'border-blue-300 text-blue-700 bg-blue-50',
  review: 'border-purple-300 text-purple-700 bg-purple-50',
  done: 'border-emerald-300 text-emerald-700 bg-emerald-50',
  blocked: 'border-red-300 text-red-700 bg-red-50',
}

export default async function MyTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbTasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority, due_date, initiative_id, initiatives(title)')
    .eq('assignee_id', user.id)
    .order('due_date', { ascending: true })

  const tasks = (dbTasks ?? []).length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? dbTasks!.map((t: any) => ({
        id: t.id, title: t.title, status: t.status,
        priority: t.priority, due_date: t.due_date,
        initiative_id: t.initiative_id,
        initiative_title: t.initiatives?.title ?? 'Unknown',
      }))
    : DEMO_TASKS.map(t => ({
        ...t, initiative_title:
          DEMO_INITIATIVES.find(i => i.id === t.initiative_id)?.title ?? 'Unknown',
      }))

  const usingDemo = (dbTasks ?? []).length === 0
  const open = tasks.filter(t => t.status !== 'done')
  const overdue = open.filter(t => t.due_date && new Date(t.due_date) < new Date())

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">My Tasks</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {open.length} open · {overdue.length} overdue
        </p>
      </div>

      {usingDemo && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
          📋 Showing demo tasks. Create real tasks inside an initiative workspace.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">{tasks.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Open</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{open.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Overdue</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{overdue.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Done</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{tasks.filter(t => t.status === 'done').length}</p>
        </div>
      </div>

      <div className="space-y-2">
        {tasks.map((t) => {
          const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
          return (
            <Link
              key={t.id}
              href={`/app/initiatives/${t.initiative_id}/tasks`}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm hover:border-orange-300 transition-colors"
            >
              <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${priorityStyle[t.priority] ?? priorityStyle.medium}`}>
                {t.priority}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 truncate">{t.title}</p>
                <p className="text-xs text-neutral-500">{t.initiative_title}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyle[t.status] ?? statusStyle.todo}`}>
                {t.status.replace('_', ' ')}
              </span>
              {t.due_date && (
                <span className={`shrink-0 text-xs ${isOverdue ? 'font-semibold text-red-600' : 'text-neutral-500'}`}>
                  {isOverdue ? '⚠ ' : ''}
                  {new Date(t.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </Link>
          )
        })}
        {tasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-neutral-900">No tasks assigned to you</p>
            <p className="mt-1 text-sm text-neutral-500">
              Tasks are created within initiatives.{' '}
              <Link href="/app/initiatives" className="text-orange-600 hover:underline">Browse initiatives →</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
