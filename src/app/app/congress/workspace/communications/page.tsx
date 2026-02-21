import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { MessageCreateForm } from '@/components/congress/workspace/create-forms'
import { fetchLatestWorkspaceEvent } from '@/lib/congress-workspace/current-event'
import { WorkspaceDiagnostics } from '@/components/congress/workspace/workspace-diagnostics'
import { StageGuide } from '@/components/congress/workspace/stage-guide'

type Message = {
  id: string
  subject: string
  body: string
  thread_type: string
  author_name: string | null
  labels: string[] | null
  created_at: string
}

const THREAD_TYPE_META: Record<string, { color: string; label: string }> = {
  update:          { color: 'bg-blue-100 text-blue-700',      label: 'Update' },
  action_required: { color: 'bg-red-100 text-red-700',        label: 'Action Required' },
  decision:        { color: 'bg-amber-100 text-amber-700',    label: 'Decision' },
  fyi:             { color: 'bg-neutral-100 text-neutral-600',label: 'FYI' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-orange-200 text-orange-800',
  'bg-blue-200 text-blue-800',
  'bg-emerald-200 text-emerald-800',
  'bg-purple-200 text-purple-800',
  'bg-amber-200 text-amber-800',
]
function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
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
  const feed = messages.filter(m => m.thread_type !== 'chat')
  const chat = messages.filter(m => m.thread_type === 'chat')

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

      <WorkspaceNav active="communications" status={event?.status} />

      <StageGuide status={event?.status} section="communications" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Email Feed / Updates ── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-900">Email Feed</h2>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          {feed.length === 0 && (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
              {canCreate
                ? 'No updates posted yet. Use "+ Post update" above to send the first congress communication.'
                : 'No congress communications posted yet.'}
            </div>
          )}

          <div className="space-y-2">
            {feed.map(m => {
              const typeMeta = THREAD_TYPE_META[m.thread_type] ?? THREAD_TYPE_META.fyi
              return (
                <div
                  key={m.id}
                  className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900">{m.subject}</p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${typeMeta.color}`}>
                        {typeMeta.label}
                      </span>
                      <span className="text-xs text-neutral-400">{timeAgo(m.created_at)}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {m.author_name ? <><span className="font-medium">{m.author_name}</span> · </> : null}
                    {new Date(m.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="mt-2 text-xs text-neutral-700 whitespace-pre-wrap">{m.body}</p>
                  {m.labels && m.labels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.labels.map(l => (
                        <span key={l} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600">
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Team Chat (read-only for now) ── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-900">Team Chat</h2>
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              Preview — read-only
            </span>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="space-y-4 p-4 max-h-120 overflow-y-auto">
              {chat.length === 0 && (
                <p className="text-xs text-neutral-400 italic">No chat messages yet.</p>
              )}
              {chat.map(msg => (
                <div key={msg.id} className="flex items-start gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(msg.author_name ?? 'U')}`}>
                    {initials(msg.author_name ?? 'U')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-neutral-800">{msg.author_name ?? 'Unknown'}</span>
                      <span className="text-[10px] text-neutral-400">{timeAgo(msg.created_at)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-neutral-700 leading-relaxed">{msg.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-200 bg-neutral-50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-300">
                  Type a message... (coming soon)
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-400 cursor-not-allowed">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </div>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-neutral-400">
                Real-time team chat integration planned
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
