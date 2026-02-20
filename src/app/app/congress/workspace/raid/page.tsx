import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { StatusBadge } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { DEMO_RAID } from '@/lib/congress-workspace-demo'

export default function CongressWorkspaceRaidPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">RAID</h1>
        <p className="mt-1 text-sm text-neutral-600">Risks, Assumptions, Issues, Decisions — linked and traceable.</p>
      </div>

      <WorkspaceNav active="raid" />

      <div className="grid gap-3 md:grid-cols-2">
        {DEMO_RAID.map(item => {
          const tone = item.status === 'resolved' ? 'green' : item.status === 'open' ? 'red' : 'amber'
          return (
            <div key={item.id} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{item.type}</p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">{item.title}</p>
                  <p className="mt-1 text-xs text-neutral-500">Owner role: {item.ownerRole ?? '—'}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge label={item.status} tone={tone} />
                  <PriorityBadge priority={item.priority === 'high' ? 'high' : item.priority === 'medium' ? 'medium' : 'low'} />
                </div>
              </div>
              <p className="mt-3 text-xs text-neutral-500">Linked tasks: {item.linkedTaskIds.length}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
