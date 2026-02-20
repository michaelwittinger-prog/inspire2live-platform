import Link from 'next/link'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { StatusBadge } from '@/components/ui/status-badge'
import { DEMO_WORKSTREAMS } from '@/lib/congress-workspace-demo'

export default function CongressWorkspaceWorkstreamsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Workstreams</h1>
        <p className="mt-1 text-sm text-neutral-600">Responsibility-focused views across all workstreams.</p>
      </div>

      <WorkspaceNav active="workstreams" />

      <div className="grid gap-3 md:grid-cols-2">
        {DEMO_WORKSTREAMS.map(ws => {
          const tone = ws.health === 'on_track' ? 'green' : ws.health === 'blocked' ? 'red' : 'amber'
          const healthLabel = ws.health === 'on_track' ? 'On track' : ws.health === 'blocked' ? 'Blocked' : 'At risk'
          return (
            <div key={ws.id} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{ws.title}</p>
                  <p className="mt-1 text-xs text-neutral-500">Owner role: {ws.ownerRole ?? '—'}</p>
                </div>
                <StatusBadge label={healthLabel} tone={tone} />
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Progress</span>
                  <span>{ws.progressPct}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: `${ws.progressPct}%` }} />
                </div>
              </div>

              <p className="mt-3 text-sm text-neutral-700">
                <span className="font-semibold">Next milestone:</span> {ws.nextMilestone}
              </p>

              <div className="mt-3 flex gap-2">
                <Link href="/app/congress/workspace/tasks" className="text-xs font-semibold text-orange-700 hover:underline">
                  View tasks →
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
