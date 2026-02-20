import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_TASKS, DEMO_INITIATIVE_IDS } from '@/lib/demo-data'

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
}

export default async function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbTasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority, due_date, assignee_id, profiles(name)')
    .eq('initiative_id', id)
    .order('due_date', { ascending: true })

  const tasks = (dbTasks ?? []).length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? dbTasks!.map((t: any) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, due_date: t.due_date, assignee: t.profiles?.name ?? 'Unassigned' }))
    : DEMO_TASKS.filter(t => t.initiative_id === id || Object.values(DEMO_INITIATIVE_IDS).includes(id))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Tasks</h2>
          <p className="text-sm text-neutral-500">{tasks.length} tasks</p>
        </div>
        <button onClick={() => alert('Add task feature coming in next release!')} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Task
        </button>
      </div>

      <div className="space-y-2">
        {tasks.map((t) => {
          const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
              <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${priorityStyle[t.priority] ?? priorityStyle.medium}`}>{t.priority}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 truncate">{t.title}</p>
                <p className="text-xs text-neutral-500">{t.assignee}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyle[t.status] ?? statusStyle.todo}`}>{t.status.replace('_', ' ')}</span>
              {t.due_date && (
                <span className={`shrink-0 text-xs ${isOverdue ? 'font-semibold text-red-600' : 'text-neutral-500'}`}>
                  {isOverdue ? '⚠ ' : ''}{new Date(t.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          )
        })}
        {tasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 py-8 text-center text-sm text-neutral-500">No tasks yet. Create one to get started!</div>
        )}
      </div>
    </div>
  )
}
