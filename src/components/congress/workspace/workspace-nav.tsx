import Link from 'next/link'
import { normalizeEventStatus, type CongressEventStatus } from '@/lib/congress'

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

const ALL_SECTIONS: WorkspaceSection[] = SECTION_GROUPS.flatMap(g => g.items.map(i => i.key))

/**
 * Stage-gated visibility for the congress workspace.
 *
 * Note: This is intentionally permissive (we hide obviously-irrelevant tabs,
 * but we don't hard-block deep links yet). Pages can still be visited directly.
 */
const STAGE_SECTIONS: Record<CongressEventStatus, WorkspaceSection[]> = {
  planning: [
    'overview',
    'workstreams',
    'timeline',
    'team',
    'communications',
  ],
  open_for_topics: [
    'overview',
    'workstreams',
    'timeline',
    'team',
    'communications',
  ],
  agenda_set: [
    'overview',
    'workstreams',
    'timeline',
    'tasks',
    'raid',
    'team',
    'communications',
  ],
  live: [
    'live-ops',
    'overview',
    'tasks',
    'raid',
    'workstreams',
    'timeline',
    'team',
    'communications',
    'approvals',
  ],
  post_congress: [
    'approvals',
    'follow-up',
    'tasks',
    'raid',
    'overview',
    'team',
    'communications',
  ],
  archived: [
    'overview',
    'approvals',
    'raid',
    'tasks',
    'workstreams',
    'timeline',
    'team',
    'communications',
  ],
}

function visibleSections(status: unknown | null | undefined): Set<WorkspaceSection> {
  if (!status) return new Set(ALL_SECTIONS)
  return new Set(STAGE_SECTIONS[normalizeEventStatus(status)])
}

export function WorkspaceNav({
  active,
  status,
}: {
  active: WorkspaceSection
  /** CongressEventStatus (or unknown DB value); used to stage-gate which tabs show */
  status?: unknown | null
}) {
  const visible = visibleSections(status)

  return (
    <nav aria-label="Congress workspace sections" className="space-y-2">
      {SECTION_GROUPS.map(group => (
        <div key={group.label} className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 w-20 shrink-0">
            {group.label}
          </span>
          {group.items.map(s => {
            const isActive = s.key === active
            const enabled = visible.has(s.key)

            return (
              <Link
                key={s.key}
                href={s.href}
                className={[
                  'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  isActive
                    ? 'border-orange-200 bg-orange-50 text-orange-800'
                    : enabled
                      ? 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-400 hover:bg-neutral-50 opacity-70',
                ].join(' ')}
                aria-current={isActive ? 'page' : undefined}
                title={!enabled ? 'This section is outside the current congress stage (still accessible)' : undefined}
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
