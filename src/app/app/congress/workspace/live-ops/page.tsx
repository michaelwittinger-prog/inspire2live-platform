import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { StatusBadge } from '@/components/ui/status-badge'
import { DEMO_INCIDENTS } from '@/lib/congress-workspace-demo'

export default function CongressWorkspaceLiveOpsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Live Ops</h1>
        <p className="mt-1 text-sm text-neutral-600">Incident logging and live status updates (mock v1).</p>
      </div>

      <WorkspaceNav active="live-ops" />

      <div className="space-y-3">
        {DEMO_INCIDENTS.map(i => (
          <div key={i.id} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{i.title}</p>
                <p className="mt-1 text-xs text-neutral-500">Last update: {new Date(i.updatedAt).toLocaleString('en-GB')}</p>
              </div>
              <StatusBadge label={`${i.severity} · ${i.status}`} tone={i.severity === 'sev1' ? 'red' : i.severity === 'sev2' ? 'amber' : 'neutral'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
