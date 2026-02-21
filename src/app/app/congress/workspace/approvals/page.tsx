import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { StatusBadge } from '@/components/ui/status-badge'
import type { StatusTone } from '@/components/ui/status-badge'
import { fetchLatestWorkspaceEvent } from '@/lib/congress-workspace/current-event'
import { WorkspaceDiagnostics } from '@/components/congress/workspace/workspace-diagnostics'
import { ApprovalCreateForm, ApprovalStatusActions } from '@/components/congress/workspace/create-forms'
import { StageGuide } from '@/components/congress/workspace/stage-guide'

type ApprovalRequest = {
  id: string
  title: string
  description: string | null
  status: string
  requested_by_name: string | null
  created_at: string
  updated_at: string
}

export default async function CongressWorkspaceApprovalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  const platformRole: string = (profile as { role?: string } | null)?.role ?? 'PatientAdvocate'
  const canCreate = ['PlatformAdmin', 'HubCoordinator'].includes(platformRole)

  const { event, issues } = await fetchLatestWorkspaceEvent(supabase)

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { data: rows, error: approvalsError } = event
    ? await (supabase as any)
        .from('congress_approval_requests')
        .select('id, title, description, status, requested_by_name, created_at, updated_at')
        .eq('congress_id', event.id)
        .order('created_at', { ascending: false })
    : { data: [] }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const items: ApprovalRequest[] = (rows ?? []) as unknown as ApprovalRequest[]
  const pending = items.filter(i => i.status === 'submitted' || i.status === 'in_review')

  const allIssues = [...issues]
  if (approvalsError) allIssues.push({ scope: 'congress_approval_requests.select', message: approvalsError.message, code: approvalsError.code, hint: (approvalsError as unknown as { hint?: string }).hint })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <WorkspaceDiagnostics issues={allIssues} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Approvals</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {event?.title ?? 'Congress'} — {items.length} request{items.length !== 1 ? 's' : ''}
            {pending.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {pending.length} pending
              </span>
            )}
          </p>
        </div>
        {canCreate && event && <ApprovalCreateForm congressId={event.id} />}
      </div>

      <WorkspaceNav active="approvals" status={event?.status} />

      <StageGuide status={event?.status} section="approvals" />

      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          No approval requests for this congress event.
        </div>
      )}

      <div className="space-y-3">
        {items.map(item => {
          const tone: StatusTone =
            item.status === 'approved'  ? 'green'  :
            item.status === 'rejected'  ? 'red'    :
            item.status === 'in_review' ? 'amber'  : 'neutral'
          const statusLabel = item.status.replace('_', ' ')
          return (
            <div key={item.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                  {item.description && (
                    <p className="mt-1 text-xs text-neutral-600 line-clamp-2">{item.description}</p>
                  )}
                  <p className="mt-2 text-xs text-neutral-500">
                    <span className="font-medium">Requested by:</span>{' '}
                    {item.requested_by_name ?? <span className="italic text-neutral-400">unknown</span>}
                    <span className="mx-1.5">·</span>
                    {new Date(item.updated_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge label={statusLabel} tone={tone} />
                  {canCreate && event && (
                    <ApprovalStatusActions congressId={event.id} approvalId={item.id} status={item.status} />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
