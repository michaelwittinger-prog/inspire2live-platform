import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { StatusBadge } from '@/components/ui/status-badge'
import { DEMO_APPROVALS } from '@/lib/congress-workspace-demo'

export default function CongressWorkspaceApprovalsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Decisions / Approvals</h1>
        <p className="mt-1 text-sm text-neutral-600">Submit → review → approve/reject with an audit trail (mock v1).</p>
      </div>

      <WorkspaceNav active="approvals" />

      <div className="space-y-3">
        {DEMO_APPROVALS.map(a => (
          <div key={a.id} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{a.title}</p>
                <p className="mt-1 text-xs text-neutral-500">Requested by {a.requestedBy}</p>
              </div>
              <StatusBadge
                label={a.status}
                tone={a.status === 'approved' ? 'green' : a.status === 'rejected' ? 'red' : a.status === 'in_review' ? 'amber' : 'blue'}
              />
            </div>
            <div className="mt-3 space-y-2">
              {a.audit.map((e, idx) => (
                <p key={idx} className="text-xs text-neutral-600">
                  <span className="font-semibold">{e.actor}</span> · {new Date(e.at).toLocaleString('en-GB')} — {e.message}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
