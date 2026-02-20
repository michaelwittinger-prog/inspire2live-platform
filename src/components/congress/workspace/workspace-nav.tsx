import Link from 'next/link'

export type WorkspaceSection =
  | 'overview'
  | 'workstreams'
  | 'timeline'
  | 'tasks'
  | 'raid'
  | 'approvals'
  | 'live-ops'
  | 'follow-up'

const SECTIONS: { key: WorkspaceSection; label: string; href: string }[] = [
  { key: 'overview', label: 'Overview', href: '/app/congress/workspace/overview' },
  { key: 'workstreams', label: 'Workstreams', href: '/app/congress/workspace/workstreams' },
  { key: 'timeline', label: 'Timeline', href: '/app/congress/workspace/timeline' },
  { key: 'tasks', label: 'Tasks', href: '/app/congress/workspace/tasks' },
  { key: 'raid', label: 'RAID', href: '/app/congress/workspace/raid' },
  { key: 'approvals', label: 'Decisions/Approvals', href: '/app/congress/workspace/approvals' },
  { key: 'live-ops', label: 'Live Ops', href: '/app/congress/workspace/live-ops' },
  { key: 'follow-up', label: 'Follow-up', href: '/app/congress/workspace/follow-up' },
]

export function WorkspaceNav({ active }: { active: WorkspaceSection }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Congress workspace sections">
      {SECTIONS.map(s => {
        const isActive = s.key === active
        return (
          <Link
            key={s.key}
            href={s.href}
            className={[
              'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
              isActive
                ? 'border-orange-200 bg-orange-50 text-orange-800'
                : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50',
            ].join(' ')}
            aria-current={isActive ? 'page' : undefined}
          >
            {s.label}
          </Link>
        )
      })}
    </nav>
  )
}
