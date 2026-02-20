import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { StatusBadge } from '@/components/ui/status-badge'
import type { StatusTone } from '@/components/ui/status-badge'
import { DEMO_TASKS_WORKSPACE } from '@/lib/congress-workspace-demo'

export default function CongressWorkspaceTasksPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Tasks</h1>
        <p className="mt-1 text-sm text-neutral-600">Create/update tasks with owner, priority, due date, and dependencies (mock v1).</p>
      </div>

      <WorkspaceNav active="tasks" />

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
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
            {DEMO_TASKS_WORKSPACE.map(t => {
              const statusTone: StatusTone =
                t.status === 'done'
                  ? 'green'
                  : t.status === 'blocked'
                    ? 'red'
                    : t.status === 'in_progress'
                      ? 'blue'
                      : 'neutral'
              return (
                <tr key={t.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-neutral-900">{t.title}</p>
                    <p className="text-xs text-neutral-500">Lane: {t.lane}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge label={t.status} tone={statusTone} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3 text-neutral-700">{t.owner ?? 'Unowned'}</td>
                  <td className="px-4 py-3 text-neutral-700">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB') : '—'}</td>
                  <td className="px-4 py-3 text-neutral-700">{t.dependencies.length}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
