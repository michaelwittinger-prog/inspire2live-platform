import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopNav } from '@/components/layouts/top-nav'
import { SideNav } from '@/components/layouts/side-nav'
import { canAccessAppPath } from '@/lib/role-access'
import { getViewAsRole } from '@/lib/view-as'
import { switchPerspective } from './admin/view-as-action'

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
  let actualRole = profile?.role || 'PatientAdvocate'

  // Auto-promote bootstrap admin emails to PlatformAdmin
  const ADMIN_EMAILS = ['michael.wittinger@gmail.com']
  if (user.email && ADMIN_EMAILS.includes(user.email) && actualRole !== 'PlatformAdmin') {
    await supabase
      .from('profiles')
      .update({ role: 'PlatformAdmin' })
      .eq('id', user.id)
    actualRole = 'PlatformAdmin'
  }

  const isAdmin = actualRole === 'PlatformAdmin'

  // Admin perspective switching: read cookie
  const viewAsRole = isAdmin ? await getViewAsRole() : null
  const effectiveRole = viewAsRole ?? actualRole

  const currentAllowed = canAccessAppPath(actualRole, '/app/dashboard')
  if (!currentAllowed) {
    redirect('/app/profile')
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-50">
      {/* Admin preview banner */}
      {isAdmin && viewAsRole && viewAsRole !== 'PlatformAdmin' && (
        <div className="flex items-center justify-center gap-3 bg-amber-100 px-4 py-1.5 text-xs font-medium text-amber-800 border-b border-amber-200">
          <span>👁 Admin preview — viewing as <strong>{viewAsRole}</strong></span>
          <form action={switchPerspective}>
            <input type="hidden" name="role" value="PlatformAdmin" />
            <button
              type="submit"
              className="rounded bg-amber-700 px-2 py-0.5 text-xs font-medium text-white hover:bg-amber-800"
            >
              Exit preview
            </button>
          </form>
        </div>
      )}

      <TopNav
        userName={name}
        userRole={effectiveRole}
        userInitials={getInitials(name)}
        unreadCount={unread ?? 0}
        isAdmin={isAdmin}
        viewAsRole={viewAsRole}
      />
      <div className="flex min-h-0 flex-1">
        <SideNav role={effectiveRole} actualRole={actualRole} />
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
