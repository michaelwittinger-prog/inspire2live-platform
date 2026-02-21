import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { StatusBadge } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import type { StatusTone } from '@/components/ui/status-badge'
import { fetchLatestWorkspaceEvent } from '@/lib/congress-workspace/current-event'
import { WorkspaceDiagnostics } from '@/components/congress/workspace/workspace-diagnostics'
import { FollowUpCreateForm } from '@/components/congress/workspace/create-forms'

type FollowUpAction = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  owner_name: string | null
  due_date: string | null
}

export default async function CongressWorkspaceFollowUpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  const platformRole: string = (profile as { role?: string } | null)?.role ?? 'PatientAdvocate'
  const canCreate = ['PlatformAdmin', 'HubCoordinator'].includes(platformRole)

  const { event, issues } = await fetchLatestWorkspaceEvent(supabase)

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { data: rows, error: followUpError } = event
    ? await (supabase as any)
        .from('congress_follow_up_actions')
        .select('id, title, description, status, priority, owner_name, due_date')
        .eq('congress_id', event.id)
        .order('priority', { ascending: false })
        .order('due_date')
    : { data: [] }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const items: FollowUpAction[] = (rows ?? []) as unknown as FollowUpAction[]
  const openCount = items.filter(i => i.status !== 'done' && i.status !== 'cancelled').length
  const today = new Date().toISOString().slice(0, 10)

  const allIssues = [...issues]
  if (followUpError) allIssues.push({ scope: 'congress_follow_up_actions.select', message: followUpError.message, code: followUpError.code, hint: (followUpError as unknown as { hint?: string }).hint })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <WorkspaceDiagnostics issues={allIssues} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Follow-up</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Post-congress actions and commitments — {items.length} item{items.length !== 1 ? 's' : ''}
            {openCount > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {openCount} open
              </span>
            )}
          </p>
        </div>
        {canCreate && event && <FollowUpCreateForm congressId={event.id} />}
      </div>

      <WorkspaceNav active="follow-up" status={event?.status} />

      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          No follow-up actions recorded for this congress event.
        </div>
      )}

      <div className="space-y-3">
        {items.map(item => {
          const statusTone: StatusTone =
            item.status === 'done'        ? 'green'   :
            item.status === 'in_progress' ? 'blue'    :
            item.status === 'cancelled'   ? 'neutral' : 'amber'
          const priority = item.priority as 'low' | 'medium' | 'high' | 'urgent'
          const isOverdue = item.due_date && item.due_date < today && item.status !== 'done' && item.status !== 'cancelled'
          return (
            <div key={item.id} className={`rounded-xl border bg-white p-4 shadow-sm ${isOverdue ? 'border-red-200' : 'border-neutral-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                  {item.description && (
                    <p className="mt-1 text-xs text-neutral-600 line-clamp-2">{item.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                    <span>
                      <span className="font-medium">Owner:</span>{' '}
                      {item.owner_name ?? <span className="italic text-neutral-400">unassigned</span>}
                    </span>
                    {item.due_date && (
                      <span className={isOverdue ? 'font-semibold text-red-600' : ''}>
                        Due {new Date(item.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {isOverdue && ' · Overdue'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge label={item.status.replace('_', ' ')} tone={statusTone} />
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
