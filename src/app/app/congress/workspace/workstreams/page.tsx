import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { StatusBadge } from '@/components/ui/status-badge'
import type { StatusTone } from '@/components/ui/status-badge'

type Workstream = {
  id: string
  title: string
  description: string | null
  owner_role: string | null
  health: string
  progress_pct: number
  next_milestone: string | null
}

export default async function CongressWorkspaceWorkstreamsPage() {
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
        .from('congress_workstreams')
        .select('id, title, description, owner_role, health, progress_pct, next_milestone')
        .eq('congress_id', event.id)
        .order('sort_order')
    : { data: [] }

  const workstreams: Workstream[] = (rows ?? []) as unknown as Workstream[]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Workstreams</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {event?.title ?? 'Congress'} — {workstreams.length} workstream{workstreams.length !== 1 ? 's' : ''}
        </p>
      </div>

      <WorkspaceNav active="workstreams" />

      {workstreams.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          No workstreams yet. An admin can create them for this congress event.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {workstreams.map(ws => {
          const tone: StatusTone = ws.health === 'on_track' ? 'green' : ws.health === 'blocked' ? 'red' : 'amber'
          const healthLabel = ws.health === 'on_track' ? 'On track' : ws.health === 'blocked' ? 'Blocked' : 'At risk'
          return (
            <div key={ws.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">{ws.title}</p>
                  {ws.description && (
                    <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{ws.description}</p>
                  )}
                  <p className="mt-1 text-xs text-neutral-500">
                    <span className="font-medium">Congress role owner:</span>{' '}
                    {ws.owner_role ?? <span className="italic text-neutral-400">unassigned</span>}
                  </p>
                </div>
                <StatusBadge label={healthLabel} tone={tone} />
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Progress</span>
                  <span>{ws.progress_pct}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                  <div className="h-full bg-orange-500 transition-all" style={{ width: `${ws.progress_pct}%` }} />
                </div>
              </div>

              {ws.next_milestone && (
                <p className="mt-3 text-sm text-neutral-700">
                  <span className="font-semibold">Next milestone:</span> {ws.next_milestone}
                </p>
              )}

              <div className="mt-3 flex gap-2">
                <Link href="/app/congress/workspace/tasks" className="text-xs font-semibold text-orange-700 hover:underline">
                  View tasks →
                </Link>
                <Link href="/app/congress/workspace/timeline" className="text-xs font-semibold text-blue-600 hover:underline">
                  Timeline →
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
