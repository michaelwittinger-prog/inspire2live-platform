import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { EmptyState } from '@/components/ui/empty-state'

export default function CongressWorkspaceFollowUpPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Follow-up</h1>
        <p className="mt-1 text-sm text-neutral-600">Post-congress closure: KPIs, action closure, lessons learned backlog.</p>
      </div>

      <WorkspaceNav active="follow-up" />

      <EmptyState
        icon="✅"
        title="Follow-up v1 (mock)"
        description="This will track KPI outcome capture, action closure, and lessons learned. Scaffolded for now." 
      />
    </div>
  )
}
