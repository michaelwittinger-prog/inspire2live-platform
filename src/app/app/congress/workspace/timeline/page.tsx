import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { EmptyState } from '@/components/ui/empty-state'

export default function CongressWorkspaceTimelinePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Timeline</h1>
        <p className="mt-1 text-sm text-neutral-600">Milestones and schedule blocks for the congress lifecycle.</p>
      </div>

      <WorkspaceNav active="timeline" />

      <EmptyState
        icon="🗓️"
        title="Timeline v1 (mock)"
        description="This section will show milestones, sessions, and schedule blocks. For now, it’s scaffolded for navigation and UX." 
      />
    </div>
  )
}
