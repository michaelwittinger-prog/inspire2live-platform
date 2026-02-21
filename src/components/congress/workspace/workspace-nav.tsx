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
  | 'team'
  | 'communications'

type SectionGroup = {
  label: string
  items: { key: WorkspaceSection; label: string; href: string }[]
}

const SECTION_GROUPS: SectionGroup[] = [
  {
    label: 'Execution',
    items: [
      { key: 'overview',     label: 'Overview',           href: '/app/congress/workspace/overview' },
      { key: 'workstreams',  label: 'Workstreams',        href: '/app/congress/workspace/workstreams' },
      { key: 'timeline',     label: 'Timeline',           href: '/app/congress/workspace/timeline' },
      { key: 'tasks',        label: 'Tasks',              href: '/app/congress/workspace/tasks' },
    ],
  },
  {
    label: 'Governance',
    items: [
      { key: 'raid',         label: 'RAID',               href: '/app/congress/workspace/raid' },
      { key: 'approvals',    label: 'Decisions/Approvals',href: '/app/congress/workspace/approvals' },
      { key: 'live-ops',     label: 'Live Ops',           href: '/app/congress/workspace/live-ops' },
      { key: 'follow-up',    label: 'Follow-up',          href: '/app/congress/workspace/follow-up' },
    ],
  },
  {
    label: 'People',
    items: [
      { key: 'team',         label: 'Team',               href: '/app/congress/workspace/team' },
      { key: 'communications', label: 'Communications',   href: '/app/congress/workspace/communications' },
    ],
  },
]

export function WorkspaceNav({ active }: { active: WorkspaceSection }) {
  return (
    <nav aria-label="Congress workspace sections" className="space-y-2">
      {SECTION_GROUPS.map(group => (
        <div key={group.label} className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 w-20 shrink-0">
            {group.label}
          </span>
          {group.items.map(s => {
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
        </div>
      ))}
    </nav>
  )
}
