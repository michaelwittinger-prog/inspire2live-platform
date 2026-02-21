/**
 * Congress Workspace — Communications
 *
 * Operational communications hub for the current congress event.
 * Mirrors the mental model of Initiatives "Discussions" but scoped to congress.
 *
 * Uses existing DEMO_EMAIL_THREADS + DEMO_TEAM_CHAT + DEMO_ACTIVITY patterns.
 * No new DB tables required.
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_CONGRESS_EVENTS, DEMO_CONGRESS_ASSIGNMENTS } from '@/lib/demo-data'
import { rowToCongressAssignment } from '@/lib/congress-assignments'
import type { CongressAssignmentRow } from '@/lib/congress-assignments'
import type { CongressEvent } from '@/lib/congress'
import { SetCongressRoles } from '@/components/roles/set-congress-roles'
import { WorkspaceNav } from '@/components/congress/workspace/workspace-nav'
import { DEMO_ACTIVITY } from '@/lib/congress-workspace-demo'
import { DEMO_EMAIL_THREADS, DEMO_TEAM_CHAT } from '@/lib/demo-data'

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
  update:          { color: 'bg-blue-100 text-blue-700',      label: 'Update' },
  action_required: { color: 'bg-red-100 text-red-700',        label: 'Action Required' },
  decision:        { color: 'bg-amber-100 text-amber-700',    label: 'Decision' },
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

  const assignmentRows: CongressAssignmentRow[] = (dbAssignments && dbAssignments.length > 0)
    ? (dbAssignments as unknown as CongressAssignmentRow[])
    : (DEMO_CONGRESS_ASSIGNMENTS as unknown as CongressAssignmentRow[])
        .filter(a => a.congress_id === currentEvent.id && a.user_id === user.id)

  const assignments = assignmentRows.map(r => rowToCongressAssignment(r))
  const congressRoles = assignments.map(a => a.projectRole)

  const emails = DEMO_EMAIL_THREADS
  const chat = DEMO_TEAM_CHAT
  const activity = DEMO_ACTIVITY
  const unreadCount = emails.filter(e => e.unread).length

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
        <span className="text-neutral-300">·</span>
        <span className="text-neutral-500">Share updates and track key messages for this congress.</span>
      </div>

      {/* ── WORKSPACE NAV ─────────────────────────────────────────────────── */}
      <div className="mt-4">
        <WorkspaceNav active="communications" />
      </div>

      {/* ── MAIN AREA ─────────────────────────────────────────────────────── */}
      <div className="mt-5 grid gap-6 lg:grid-cols-2">

        {/* ── Email Feed ── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-900">Email Feed</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                {unreadCount} unread
              </span>
            )}
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <div className="space-y-2">
            {emails.map(em => {
              const typeMeta = THREAD_TYPE_META[em.thread_type] ?? THREAD_TYPE_META.fyi
              return (
                <div key={em.id} className={[
                  'rounded-xl border p-4 shadow-sm',
                  em.unread ? 'border-blue-200 bg-blue-50' : 'border-neutral-200 bg-white',
                ].join(' ')}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${em.unread ? 'text-blue-900' : 'text-neutral-900'}`}>
                      {em.unread && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-blue-500" />}
                      {em.subject}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${typeMeta.color}`}>
                        {typeMeta.label}
                      </span>
                      <span className="text-xs text-neutral-400">{timeAgo(em.date)}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    <span className="font-medium">{em.from.name}</span>
                    {em.to.length > 0 && <> → {em.to.map(t => t.name).join(', ')}</>}
                    {em.reply_count > 0 && <span className="ml-2 text-neutral-400">{em.reply_count} replies</span>}
                  </p>
                  <p className="mt-1.5 text-xs text-neutral-600 line-clamp-2">{em.preview}</p>
                  {em.labels && em.labels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {em.labels.map(l => (
                        <span key={l} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">{l}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Compose placeholder */}
          <div className="mt-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3">
            <p className="text-xs font-medium text-neutral-500">✉️ Compose update</p>
            <div className="mt-2 h-8 rounded-lg border border-neutral-200 bg-white px-3 flex items-center">
              <span className="text-xs text-neutral-300">To: congress team…</span>
            </div>
            <div className="mt-1.5 h-14 rounded-lg border border-neutral-200 bg-white px-3 py-2">
              <span className="text-xs text-neutral-300">Message…</span>
            </div>
            <div className="mt-2 flex justify-end">
              <div className="rounded-lg bg-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-500 cursor-not-allowed">
                Send (coming soon)
              </div>
            </div>
          </div>
        </section>

        {/* ── Right column: Chat + Activity ── */}
        <div className="space-y-6">
          {/* Team Chat */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-neutral-900">Team Chat</h2>
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                Preview
              </span>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="space-y-4 p-4 max-h-64 overflow-y-auto">
                {chat.map(msg => (
                  <div key={msg.id} className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(msg.author)}`}>
                      {initials(msg.author)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-neutral-800">{msg.author}</span>
                        <span className="text-[10px] text-neutral-400">{timeAgo(msg.timestamp)}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-neutral-700 leading-relaxed">{msg.message}</p>
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {msg.reactions.map((r, i) => (
                            <span key={i} className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs">
                              {r.emoji} {r.count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-neutral-200 bg-neutral-50 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-300">
                    Type a message… (coming soon)
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Recent activity */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-neutral-900">Recent activity</h2>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>
            <div className="space-y-2">
              {activity.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-start gap-2 text-xs text-neutral-600">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${avatarColor(a.actor)}`}>
                    {initials(a.actor)}
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">{a.actor}</span>{' '}
                    {a.message}
                    <span className="ml-1 text-neutral-400">{timeAgo(a.at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
