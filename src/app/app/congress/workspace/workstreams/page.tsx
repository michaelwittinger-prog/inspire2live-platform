import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { WorkstreamCreateForm } from '@/components/congress/workspace/create-forms'

const HEALTH_BADGE: Record<string, string> = {
  on_track: 'bg-green-100 text-green-800 border-green-200',
  at_risk:  'bg-amber-100 text-amber-800 border-amber-200',
  blocked:  'bg-red-100 text-red-800 border-red-200',
}
function HealthBadge({ health }: { health: string }) {
  return (
    <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${HEALTH_BADGE[health] ?? HEALTH_BADGE.on_track}`}>
      {health.replace('_', ' ')}
    </span>
  )
}

type Workstream = {
  id: string
  title: string
  description: string | null
  owner_role: string | null
  health: string
  progress_pct: number
  next_milestone: string | null
  sort_order: number | null
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct))
  const color = clamped >= 80 ? 'bg-green-500' : clamped >= 40 ? 'bg-orange-400' : 'bg-red-400'
  return (
    <div className="h-1.5 w-full rounded-full bg-neutral-200">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}

export default async function CongressWorkspaceWorkstreamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  const platformRole: string = (profile as { role?: string } | null)?.role ?? 'PatientAdvocate'
  const canCreate = ['PlatformAdmin', 'HubCoordinator'].includes(platformRole)

  const { data: events } = await supabase
    .from('congress_events').select('id, title').order('year', { ascending: false }).limit(1)
  const event = events?.[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { data: rawRows } = event
    ? await sb.from('congress_workstreams')
        .select('id, title, description, owner_role, health, progress_pct, next_milestone, sort_order')
        .eq('congress_id', event.id)
        .order('sort_order', { ascending: true })
    : { data: [] }
  const workstreams = (rawRows ?? []) as Workstream[]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Workstreams</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {event?.title ?? 'Congress'} — {workstreams.length} workstream{workstreams.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && event && <WorkstreamCreateForm congressId={event.id} />}
      </div>

      <WorkspaceNav active="workstreams" />

      {workstreams.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          {canCreate
            ? 'No workstreams yet. Use "+ Add workstream" above to create the first one.'
            : 'No workstreams configured for this congress event yet.'}
        </div>
      )}

      {workstreams.length > 0 && (
        <div className="space-y-3">
          {workstreams.map(ws => (
            <div key={ws.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-neutral-900">{ws.title}</h3>
                    <HealthBadge health={ws.health} />
                  </div>
                  {ws.description && (
                    <p className="text-xs text-neutral-500 mb-2">{ws.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs text-neutral-600">
                    {ws.owner_role && (
                      <span className="rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5">
                        {ws.owner_role}
                      </span>
                    )}
                    {ws.next_milestone && (
                      <span className="text-neutral-500">
                        Next: <span className="font-medium text-neutral-700">{ws.next_milestone}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 min-w-[80px]">
                  <span className="text-xs font-semibold text-neutral-700">{ws.progress_pct ?? 0}%</span>
                  <div className="w-24">
                    <ProgressBar pct={ws.progress_pct ?? 0} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
