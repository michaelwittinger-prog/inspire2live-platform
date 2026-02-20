import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_USERS } from '@/lib/demo-data'
import { EditRoleButton, InviteUserButton } from '@/components/ui/client-buttons'

const roleColor: Record<string, string> = {
  PlatformAdmin: 'bg-red-100 text-red-700',
  BoardMember: 'bg-purple-100 text-purple-700',
  HubCoordinator: 'bg-orange-100 text-orange-700',
  PatientAdvocate: 'bg-blue-100 text-blue-700',
  Researcher: 'bg-emerald-100 text-emerald-700',
  Clinician: 'bg-teal-100 text-teal-700',
  PolicyMaker: 'bg-amber-100 text-amber-700',
}

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'PlatformAdmin') {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-neutral-900">Access Denied</p>
          <p className="text-sm text-neutral-500">Only PlatformAdmin users can access this page.</p>
        </div>
      </div>
    )
  }

  const { data: dbUsers } = await supabase.from('profiles').select('id, name, email, role, country, onboarding_completed, updated_at').order('name')
  const users = (dbUsers ?? []).length > 0
    ? dbUsers!.map(u => ({ id: u.id, name: u.name ?? 'Unnamed', email: u.email ?? '', role: u.role, country: u.country ?? '', last_active: u.updated_at, status: 'active' as const, onboarding_completed: u.onboarding_completed }))
    : DEMO_USERS

  const totalActive = users.filter(u => u.status === 'active').length

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">User Management</h1>
          <p className="text-sm text-neutral-500">{users.length} users · {totalActive} active</p>
        </div>
        <InviteUserButton />
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Country</th>
              <th className="px-4 py-3 text-left">Onboarding</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-600">
                      {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{u.name}</p>
                      <p className="text-xs text-neutral-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColor[u.role] ?? 'bg-neutral-100 text-neutral-600'}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3 text-neutral-600">{u.country}</td>
                <td className="px-4 py-3">
                  {u.onboarding_completed
                    ? <span className="text-emerald-600">✓ Done</span>
                    : <span className="text-amber-600">Pending</span>
                  }
                </td>
                <td className="px-4 py-3 text-right">
                  <EditRoleButton userName={u.name} userId={u.id} currentRole={u.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
