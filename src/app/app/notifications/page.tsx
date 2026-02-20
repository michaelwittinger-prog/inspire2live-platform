import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_NOTIFICATIONS } from '@/lib/demo-data'
import { PlaceholderButton } from '@/components/ui/client-buttons'

const typeIcon: Record<string, string> = { task_assigned: '📋', milestone_completed: '✅', discussion_reply: '💬', member_joined: '👤', initiative_update: '📊' }

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbNotifs } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
  const notifications = (dbNotifs ?? []).length > 0
    ? dbNotifs!.map(n => ({ id: n.id, type: n.type, title: n.title ?? '', body: n.body ?? '', is_read: n.is_read, created_at: n.created_at }))
    : DEMO_NOTIFICATIONS

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
          <p className="text-sm text-neutral-500">{unread} unread</p>
        </div>
        <PlaceholderButton label="Mark all read" variant="secondary" message="Mark all read will be available in the next update." />
      </div>
      <div className="space-y-2">
        {notifications.map(n => (
          <div key={n.id} className={`flex items-start gap-3 rounded-xl border p-4 shadow-sm transition-colors ${n.is_read ? 'border-neutral-200 bg-white' : 'border-orange-200 bg-orange-50'}`}>
            <span className="mt-0.5 text-lg">{typeIcon[n.type] ?? '🔔'}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${n.is_read ? 'text-neutral-700' : 'font-semibold text-neutral-900'}`}>{n.title}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{n.body}</p>
              <p className="mt-1 text-xs text-neutral-400">{timeAgo(n.created_at)}</p>
            </div>
            {!n.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />}
          </div>
        ))}
      </div>
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
