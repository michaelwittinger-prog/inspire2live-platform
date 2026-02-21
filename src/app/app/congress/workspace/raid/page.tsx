import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { StatusBadge } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import type { StatusTone } from '@/components/ui/status-badge'

type RaidItem = {
  id: string
  type: string
  title: string
  description: string | null
  status: string
  priority: string
  owner_role: string | null
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  risk:       { label: 'Risk',       color: 'bg-red-100 text-red-700' },
  issue:      { label: 'Issue',      color: 'bg-orange-100 text-orange-700' },
  assumption: { label: 'Assumption', color: 'bg-blue-100 text-blue-700' },
  decision:   { label: 'Decision',   color: 'bg-purple-100 text-purple-700' },
}

export default async function CongressWorkspaceRaidPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: events } = await supabase
    .from('congress_events')
    .select('id, title')
    .order('year', { ascending: false })
    .limit(1)
  const event = events?.[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = event
    ? await (supabase as any)
        .from('congress_raid_items')
        .select('id, type, title, description, status, priority, owner_role')
        .eq('congress_id', event.id)
        .order('priority', { ascending: false })
        .order('status')
    : { data: [] }

  const items: RaidItem[] = (rows ?? []) as unknown as RaidItem[]
  const openCount = items.filter(i => i.status !== 'resolved').length

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">RAID</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Risks, Assumptions, Issues, Decisions — {items.length} item{items.length !== 1 ? 's' : ''}
          {openCount > 0 && (
            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              {openCount} open
            </span>
          )}
        </p>
      </div>

      <WorkspaceNav active="raid" />

      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          No RAID items recorded for this congress event.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {items.map(item => {
          const tone: StatusTone = item.status === 'resolved' ? 'green' : item.status === 'open' ? 'red' : 'amber'
          const typeMeta = TYPE_META[item.type] ?? { label: item.type, color: 'bg-neutral-100 text-neutral-600' }
          const priority = item.priority as 'low' | 'medium' | 'high'
          return (
            <div key={item.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${typeMeta.color}`}>
                    {typeMeta.label}
                  </span>
                  <p className="mt-1.5 text-sm font-semibold text-neutral-900">{item.title}</p>
                  {item.description && (
                    <p className="mt-1 text-xs text-neutral-600 line-clamp-3">{item.description}</p>
                  )}
                  <p className="mt-2 text-xs text-neutral-500">
                    <span className="font-medium">Congress role owner:</span>{' '}
                    {item.owner_role ?? <span className="italic text-neutral-400">unassigned</span>}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge label={item.status.replace('_', ' ')} tone={tone} />
                  <PriorityBadge priority={priority} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
