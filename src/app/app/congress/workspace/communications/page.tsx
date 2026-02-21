/**
 * Congress Workspace — Communications
 *
 * Operational communications hub for the current congress event.
 * Data source: congress_messages (DB), congress_assignments (DB).
 * No hard-coded demo data.
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_CONGRESS_EVENTS } from '@/lib/demo-data'
import { rowToCongressAssignment } from '@/lib/congress-assignments'
import type { CongressAssignmentRow } from '@/lib/congress-assignments'
import type { CongressEvent } from '@/lib/congress'
import { SetCongressRoles } from '@/components/roles/set-congress-roles'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'

// ─── Types ───────────────────────────────────────────────────────────────────

type CongressMessage = {
  id: string
  thread_type: string
  subject: string
  body: string
  author_name: string | null
  labels: string[]
  created_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PLATFORM_ROLE_LABEL: Record<string, string> = {
  PatientAdvocate: 'Patient Advocate',
  Clinician:       'Clinician',
  Researcher:      'Researcher',
  HubCoordinator:  'Hub Coordinator',
  IndustryPartner: 'Industry Partner',
  BoardMember:     'Board Member',
  PlatformAdmin:   'Platform Admin',
}

const THREAD_TYPE_META: Record<string, { color: string; label: string }> = {
  update:          { color: 'bg-blue-100 text-blue-700',       label: 'Update' },
  action_required: { color: 'bg-red-100 text-red-700',         label: 'Action Required' },
  decision:        { color: 'bg-amber-100 text-amber-700',     label: 'Decision' },
  fyi:             { color: 'bg-neutral-100 text-neutral-600', label: 'FYI' },
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
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CongressWorkspaceCommunicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const platformRole: string = profile?.role ?? 'PatientAdvocate'

  // ── Current event ──
  const { data: dbEvents } = await supabase
    .from('congress_events')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)

  const currentEvent: CongressEvent = dbEvents?.[0]
    ? (dbEvents[0] as unknown as CongressEvent)
    : DEMO_CONGRESS_EVENTS[0]

  // ── Viewer's congress roles ──
  const { data: dbAssignments } = await supabase
    .from('congress_assignments')
    .select('*')
    .eq('congress_id', currentEvent.id)
    .eq('user_id', user.id)

  const assignmentRows: CongressAssignmentRow[] = (dbAssignments ?? []) as unknown as CongressAssignmentRow[]
  const assignments = assignmentRows.map(r => rowToCongressAssignment(r))
  const congressRoles = assignments.map(a => a.projectRole)

  // ── Messages from DB ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawMessages } = await (supabase as any)
    .from('congress_messages')
    .select('id, thread_type, subject, body, author_name, labels, created_at')
    .eq('congress_id', currentEvent.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const messages: CongressMessage[] = (rawMessages ?? []) as CongressMessage[]

  return (
    <div className="mx-auto max-w-6xl">
      <SetCongressRoles roles={congressRoles} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Communications</h1>
          <p className="text-xs text-neutral-500">
            Operational communications for {currentEvent.title ?? 'this congress'}
          </p>
        </div>
        <a href="/app/notifications"
           className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50">
          🔔 All notifications →
        </a>
      </div>

      {/* ── ROLE CONTEXT STRIP ────────────────────────────────────────────── */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
        <span>
          <span className="font-semibold text-neutral-900">Platform role:</span>{' '}
          {PLATFORM_ROLE_LABEL[platformRole] ?? platformRole}
        </span>
        <span className="text-neutral-300">·</span>
        <span>
          <span className="font-semibold text-neutral-900">Congress role(s):</span>{' '}
          {congressRoles.length > 0 ? congressRoles.join(', ') : <span className="text-neutral-400">None assigned</span>}
        </span>
      </div>

      {/* ── WORKSPACE NAV ─────────────────────────────────────────────────── */}
      <div className="mt-4">
        <WorkspaceNav active="communications" />
      </div>

      {/* ── MAIN AREA ─────────────────────────────────────────────────────── */}
      <div className="mt-5 grid gap-6 lg:grid-cols-2">

        {/* ── Message Feed (from congress_messages) ── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-900">Congress Updates</h2>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
              {messages.length} messages
            </span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          {messages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-xs text-neutral-400">
              No messages yet for this congress event.
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map(msg => {
                const typeMeta = THREAD_TYPE_META[msg.thread_type] ?? THREAD_TYPE_META.fyi
                const authorName = msg.author_name ?? 'Unknown'
                return (
                  <div key={msg.id}
                       className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-900">{msg.subject}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${typeMeta.color}`}>
                          {typeMeta.label}
                        </span>
                        <span className="text-xs text-neutral-400">{timeAgo(msg.created_at)}</span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${avatarColor(authorName)}`}>
                        {initials(authorName)}
                      </div>
                      <span className="text-xs font-medium text-neutral-600">{authorName}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-neutral-600 line-clamp-2">{msg.body}</p>
                    {msg.labels && msg.labels.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {msg.labels.map(l => (
                          <span key={l} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">
                            {l}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Right column: Chat (future) + Activity ── */}
        <div className="space-y-6">
          {/* Team Chat — not yet backed by a DB table */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-neutral-900">Team Chat</h2>
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                Coming soon
              </span>
            </div>
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-xs text-neutral-400">
              Real-time team chat will be available in a future release.
            </div>
          </section>

          {/* Activity — no activity log table yet */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-neutral-900">Recent activity</h2>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-xs text-neutral-400">
              Activity log will be available in a future release.
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
