import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

// ─── Notification type helpers ─────────────────────────────────────────────────
function notifIcon(type: string): string {
  switch (type) {
    case 'task_assigned':    return '✅'
    case 'task_overdue':     return '⏰'
    case 'milestone_due':    return '🏁'
    case 'discussion_reply': return '💬'
    case 'member_joined':    return '👋'
    case 'decision_pending': return '⚖️'
    case 'inactivity_alert': return '🔔'
    default:                 return '📌'
  }
}

function notifTypeBadge(type: string): string {
  switch (type) {
    case 'task_assigned':    return 'bg-blue-100 text-blue-700'
    case 'task_overdue':     return 'bg-red-100 text-red-700'
    case 'milestone_due':    return 'bg-amber-100 text-amber-700'
    case 'discussion_reply': return 'bg-violet-100 text-violet-700'
    case 'member_joined':    return 'bg-emerald-100 text-emerald-700'
    case 'decision_pending': return 'bg-orange-100 text-orange-700'
    default:                 return 'bg-neutral-100 text-neutral-600'
  }
}

function formatNotifType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

type NotifRow = {
  id: string
  type: string
  title: string
  body: string | null
  read: boolean
  created_at: string
  initiative_id: string | null
  initiative_title: string | null
}

type GroupedNotifs = {
  initiative_id: string | null
  initiative_title: string
  items: NotifRow[]
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
        <p className="text-sm text-neutral-500">Sign in to see your notifications.</p>
      </div>
    )
  }

  // Fetch notifications for the current user
  const { data: rawNotifs } = await supabase
    .from('notifications')
    .select(
      'id, type, title, body, is_read, created_at, initiative_id, initiative:initiatives!notifications_initiative_id_fkey(title)',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  type RawNotif = {
    id: string; type: string; title: string; body: string | null
    is_read: boolean; created_at: string; initiative_id: string | null
    initiative: { title: string } | null
  }

  const notifs: NotifRow[] = ((rawNotifs ?? []) as unknown as RawNotif[]).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.is_read,
    created_at: n.created_at,
    initiative_id: n.initiative_id,
    initiative_title: n.initiative?.title ?? null,
  }))

  const unreadCount = notifs.filter((n) => !n.read).length

  // Group by initiative (null initiative = platform-wide)
  const groupMap = new Map<string, GroupedNotifs>()

  for (const n of notifs) {
    const key = n.initiative_id ?? '__platform__'
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        initiative_id: n.initiative_id,
        initiative_title: n.initiative_title ?? 'Platform-wide',
        items: [],
      })
    }
    groupMap.get(key)!.items.push(n)
  }

  const groups = Array.from(groupMap.values())

  // Time formatting
  const now = new Date()
  const nowMs = now.getTime()

  function relativeTime(isoStr: string): string {
    const ms = nowMs - new Date(isoStr).getTime()
    const mins  = Math.floor(ms / 60_000)
    const hours = Math.floor(ms / 3_600_000)
    const days  = Math.floor(ms / 86_400_000)
    if (mins < 60)  return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Notifications</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action="/app/notifications/mark-all-read" method="POST">
            <button
              type="submit"
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              Mark all read
            </button>
          </form>
        )}
      </div>

      {/* Empty state */}
      {notifs.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
          <p className="text-3xl">🔔</p>
          <p className="mt-3 text-sm font-semibold text-neutral-700">No notifications yet</p>
          <p className="mt-1 text-xs text-neutral-400">
            You&apos;ll be notified here when tasks are assigned, milestones approach, or discussions have new replies.
          </p>
        </div>
      )}

      {/* Grouped notification list */}
      {groups.map((group) => (
        <section key={group.initiative_id ?? '__platform__'} className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          {/* Group header */}
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3 bg-neutral-50">
            <div className="flex items-center gap-2">
              {group.initiative_id ? (
                <Link
                  href={`/app/initiatives/${group.initiative_id}`}
                  className="text-sm font-semibold text-orange-700 hover:underline"
                >
                  {group.initiative_title}
                </Link>
              ) : (
                <span className="text-sm font-semibold text-neutral-700">{group.initiative_title}</span>
              )}
            </div>
            <span className="text-xs text-neutral-400">
              {group.items.filter((n) => !n.read).length > 0 && (
                <span className="mr-1.5 rounded-full bg-orange-600 px-1.5 py-0.5 text-xs font-bold text-white">
                  {group.items.filter((n) => !n.read).length}
                </span>
              )}
              {group.items.length} notification{group.items.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Items */}
          <ul className="divide-y divide-neutral-100">
            {group.items.map((n) => (
              <li
                key={n.id}
                className={[
                  'flex items-start gap-3 px-5 py-3.5 transition-colors',
                  !n.read ? 'bg-orange-50/40' : 'hover:bg-neutral-50',
                ].join(' ')}
              >
                {/* Unread dot + icon */}
                <div className="relative shrink-0 pt-0.5">
                  <span className="text-lg leading-none">{notifIcon(n.type)}</span>
                  {!n.read && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-500" />
                  )}
                </div>
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!n.read ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700'}`}>
                      {n.title}
                    </p>
                    <span className="shrink-0 text-xs text-neutral-400">{relativeTime(n.created_at)}</span>
                  </div>
                  {n.body && (
                    <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">{n.body}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${notifTypeBadge(n.type)}`}>
                      {formatNotifType(n.type)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
