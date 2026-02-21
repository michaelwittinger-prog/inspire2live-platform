import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { MessageCreateForm } from '@/components/congress/workspace/create-forms'
import { fetchLatestWorkspaceEvent } from '@/lib/congress-workspace/current-event'
import { WorkspaceDiagnostics } from '@/components/congress/workspace/workspace-diagnostics'

type Message = {
  id: string
  subject: string
  body: string
  thread_type: string
  author_name: string | null
  labels: string[] | null
  created_at: string
}

const TYPE_BADGE: Record<string, string> = {
  update:          'bg-blue-100 text-blue-800 border-blue-200',
  action_required: 'bg-red-100 text-red-800 border-red-200',
  decision:        'bg-purple-100 text-purple-800 border-purple-200',
  fyi:             'bg-neutral-100 text-neutral-600 border-neutral-200',
}

export default async function CongressWorkspaceCommunicationsPage() {
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
  const { data: rawRows, error: msgError } = event
    ? await sb.from('congress_messages')
        .select('id, subject, body, thread_type, author_name, labels, created_at')
        .eq('congress_id', event.id)
        .order('created_at', { ascending: false })
    : { data: [] }
  const messages = (rawRows ?? []) as Message[]

  const allIssues = [...issues]
  if (msgError) allIssues.push({ scope: 'congress_messages.select', message: msgError.message, code: msgError.code, hint: (msgError as unknown as { hint?: string }).hint })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <WorkspaceDiagnostics issues={allIssues} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Communications</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {event?.title ?? 'Congress'} — {messages.length} update{messages.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && event && <MessageCreateForm congressId={event.id} />}
      </div>

      <WorkspaceNav active="communications" />

      {messages.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          {canCreate
            ? 'No updates posted yet. Use "+ Post update" above to send the first congress communication.'
            : 'No congress communications posted yet.'}
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-3">
          {messages.map(m => (
            <div key={m.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_BADGE[m.thread_type] ?? TYPE_BADGE.fyi}`}>
                    {m.thread_type.replace('_', ' ')}
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900">{m.subject}</h3>
                </div>
                <span className="text-xs text-neutral-400">
                  {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{m.body}</p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {m.author_name && (
                  <span className="text-xs text-neutral-500">by {m.author_name}</span>
                )}
                {m.labels && m.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {m.labels.map(l => (
                      <span key={l} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600">
                        {l}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
