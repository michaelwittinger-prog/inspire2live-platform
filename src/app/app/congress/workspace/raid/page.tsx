import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { RaidCreateForm } from '@/components/congress/workspace/create-forms'
import { fetchLatestWorkspaceEvent } from '@/lib/congress-workspace/current-event'
import { WorkspaceDiagnostics } from '@/components/congress/workspace/workspace-diagnostics'
import { RaidStatusActions } from '@/components/congress/workspace/create-forms'

type RaidItem = {
  id: string
  title: string
  type: string
  status: string
  priority: string
  owner_role: string | null
  description: string | null
}

const TYPE_COLOR: Record<string, string> = {
  risk:       'bg-red-100 text-red-800 border-red-200',
  assumption: 'bg-blue-100 text-blue-800 border-blue-200',
  issue:      'bg-amber-100 text-amber-800 border-amber-200',
  decision:   'bg-purple-100 text-purple-800 border-purple-200',
}

const STATUS_COLOR: Record<string, string> = {
  open:       'bg-neutral-100 text-neutral-700 border-neutral-200',
  mitigating: 'bg-orange-100 text-orange-800 border-orange-200',
  resolved:   'bg-green-100 text-green-800 border-green-200',
}

export default async function CongressWorkspaceRaidPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  const platformRole: string = (profile as { role?: string } | null)?.role ?? 'PatientAdvocate'
  const canCreate = ['PlatformAdmin', 'HubCoordinator'].includes(platformRole)

  const { event, issues } = await fetchLatestWorkspaceEvent(supabase)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { data: rawRows, error: raidError } = event
    ? await sb.from('congress_raid_items')
        .select('id, title, type, status, priority, owner_role, description')
        .eq('congress_id', event.id)
        .order('type').order('priority')
    : { data: [] }
  const items = (rawRows ?? []) as RaidItem[]

  const allIssues = [...issues]
  if (raidError) allIssues.push({ scope: 'congress_raid_items.select', message: raidError.message, code: raidError.code, hint: (raidError as unknown as { hint?: string }).hint })

  const openItems = items.filter(i => i.status !== 'resolved')
  const resolvedItems = items.filter(i => i.status === 'resolved')

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <WorkspaceDiagnostics issues={allIssues} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">RAID Log</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {event?.title ?? 'Congress'} — {items.length} item{items.length !== 1 ? 's' : ''}
            {openItems.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {openItems.length} open
              </span>
            )}
          </p>
        </div>
        {canCreate && event && <RaidCreateForm congressId={event.id} />}
      </div>

      <WorkspaceNav active="raid" />

      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          {canCreate
            ? 'No RAID items yet. Use "+ Add RAID item" above to log the first risk, assumption, issue, or decision.'
            : 'No RAID items logged for this congress event.'}
        </div>
      )}

      {openItems.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Open Items</h2>
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                  {canCreate && event && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {openItems.map(i => (
                  <tr key={i.id} className="border-t border-neutral-200 hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-neutral-900">{i.title}</p>
                      {i.description && <p className="text-xs text-neutral-500 mt-0.5">{i.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${TYPE_COLOR[i.type] ?? TYPE_COLOR.risk}`}>
                        {i.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={i.priority as 'low' | 'medium' | 'high' | 'urgent'} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[i.status] ?? STATUS_COLOR.open}`}>
                        {i.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {i.owner_role ?? <span className="text-neutral-300">—</span>}
                    </td>
                    {canCreate && event && (
                      <td className="px-4 py-3 text-right">
                        <RaidStatusActions congressId={event.id} raidId={i.id} status={i.status} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {resolvedItems.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Resolved</h2>
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100 text-xs text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                </tr>
              </thead>
              <tbody>
                {resolvedItems.map(i => (
                  <tr key={i.id} className="border-t border-neutral-200">
                    <td className="px-4 py-3 text-neutral-500">
                      <p className="font-medium">{i.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${TYPE_COLOR[i.type] ?? TYPE_COLOR.risk}`}>
                        {i.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400">{i.owner_role ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
