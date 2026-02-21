import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { StatusBadge } from '@/components/ui/status-badge'
import type { StatusTone } from '@/components/ui/status-badge'

type LiveOpsUpdate = {
  id: string
  title: string
  description: string | null
  status: string
  severity: string
  created_at: string
  updated_at: string
}

const SEV_META: Record<string, { label: string; color: string }> = {
  sev1: { label: 'SEV1 · Critical', color: 'bg-red-100 text-red-800 border border-red-200' },
  sev2: { label: 'SEV2 · High',     color: 'bg-orange-100 text-orange-800 border border-orange-200' },
  sev3: { label: 'SEV3 · Low',      color: 'bg-neutral-100 text-neutral-600 border border-neutral-200' },
}

export default async function CongressWorkspaceLiveOpsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: events } = await supabase
    .from('congress_events')
    .select('id, title')
    .order('year', { ascending: false })
    .limit(1)
  const event = events?.[0]

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { data: rows } = event
    ? await (supabase as any)
        .from('congress_live_ops_updates')
        .select('id, title, description, status, severity, created_at, updated_at')
        .eq('congress_id', event.id)
        .order('severity')
        .order('updated_at', { ascending: false })
    : { data: [] }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const items: LiveOpsUpdate[] = (rows ?? []) as unknown as LiveOpsUpdate[]
  const openCount = items.filter(i => i.status !== 'resolved').length

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Live Ops</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Incident log and live status updates — {items.length} item{items.length !== 1 ? 's' : ''}
          {openCount > 0 && (
            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              {openCount} open
            </span>
          )}
        </p>
      </div>

      <WorkspaceNav active="live-ops" />

      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          No live-ops updates for this congress event.
        </div>
      )}

      <div className="space-y-3">
        {items.map(item => {
          const statusTone: StatusTone =
            item.status === 'resolved'   ? 'green' :
            item.status === 'monitoring' ? 'amber' : 'red'
          const sevMeta = SEV_META[item.severity] ?? SEV_META.sev3
          return (
            <div key={item.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${sevMeta.color}`}>
                      {sevMeta.label}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-1 text-xs text-neutral-600 line-clamp-3">{item.description}</p>
                  )}
                  <p className="mt-2 text-xs text-neutral-500">
                    Last update: {new Date(item.updated_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <StatusBadge label={item.status} tone={statusTone} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
