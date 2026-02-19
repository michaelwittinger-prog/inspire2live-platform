import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopNav } from '@/components/layouts/top-nav'
import { SideNav } from '@/components/layouts/side-nav'
import { canAccessAppPath } from '@/lib/role-access'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (profile && !profile.onboarding_completed) redirect('/onboarding')

  const { count: unread } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  const name = profile?.name || user.email || 'Unknown'
  const role = profile?.role || 'PatientAdvocate'
  const currentAllowed = canAccessAppPath(role, '/app/dashboard')

  if (!currentAllowed) {
    redirect('/app/profile')
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-50">
      <TopNav
        userName={name}
        userRole={role}
        userInitials={getInitials(name)}
        unreadCount={unread ?? 0}
      />
      <div className="flex min-h-0 flex-1">
        <SideNav role={role} />
        <main
          className="flex-1 overflow-y-auto px-3 py-4 md:p-6"
          role="main"
          aria-label="Page content"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
