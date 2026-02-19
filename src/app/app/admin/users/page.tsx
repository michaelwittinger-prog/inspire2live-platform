import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PlatformRole } from '@/lib/role-access'

const ALL_ROLES: PlatformRole[] = [
  'PatientAdvocate',
  'Clinician',
  'Researcher',
  'HubCoordinator',
  'IndustryPartner',
  'BoardMember',
  'PlatformAdmin',
]

const ROLE_LABELS: Record<string, string> = {
  PatientAdvocate: 'Patient Advocate',
  Clinician: 'Clinician',
  Researcher: 'Researcher',
  HubCoordinator: 'Hub Coordinator',
  IndustryPartner: 'Industry Partner',
  BoardMember: 'Board Member',
  PlatformAdmin: 'Platform Admin',
}

async function updateUserRole(formData: FormData) {
  'use server'
  const userId = formData.get('userId') as string
  const newRole = formData.get('newRole') as string
  if (!userId || !newRole || !ALL_ROLES.includes(newRole as PlatformRole)) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Verify caller is PlatformAdmin
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerProfile?.role !== 'PlatformAdmin') return

  await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  revalidatePath('/app/admin/users')
}

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify admin
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (myProfile?.role !== 'PlatformAdmin') redirect('/app/dashboard')

  // Fetch all profiles (admin RLS policy allows this)
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, role, onboarding_completed, created_at')
    .order('created_at', { ascending: true })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">User Management</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage platform users, assign roles, and promote administrators.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-3">
          <p className="text-2xl font-bold text-neutral-900">{users?.length ?? 0}</p>
          <p className="text-xs text-neutral-500">Total users</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-3">
          <p className="text-2xl font-bold text-orange-600">
            {users?.filter((u) => u.role === 'PlatformAdmin').length ?? 0}
          </p>
          <p className="text-xs text-neutral-500">Admins</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-3">
          <p className="text-2xl font-bold text-green-600">
            {users?.filter((u) => u.onboarding_completed).length ?? 0}
          </p>
          <p className="text-xs text-neutral-500">Active</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-3">
          <p className="text-2xl font-bold text-amber-600">
            {users?.filter((u) => !u.onboarding_completed).length ?? 0}
          </p>
          <p className="text-xs text-neutral-500">Pending onboarding</p>
        </div>
      </div>

      {/* User table */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users?.map((u) => {
                const isCurrentUser = u.id === user.id
                const initials = u.name
                  ? u.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                  : '??'

                return (
                  <tr key={u.id} className="hover:bg-neutral-50">
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                          {initials}
                        </span>
                        <div>
                          <p className="font-medium text-neutral-900">
                            {u.name || 'Unnamed user'}
                            {isCurrentUser && (
                              <span className="ml-1.5 text-xs font-normal text-neutral-400">(you)</span>
                            )}
                          </p>
                          <p className="text-xs text-neutral-400">ID: {u.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {u.onboarding_completed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Onboarding incomplete
                        </span>
                      )}
                    </td>

                    {/* Role selector */}
                    <td className="px-4 py-3">
                      <form action={updateUserRole}>
                        <input type="hidden" name="userId" value={u.id} />
                        <div className="flex items-center gap-2">
                          <select
                            name="newRole"
                            defaultValue={u.role}
                            className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs outline-none ring-orange-300 focus:ring"
                          >
                            {ALL_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="rounded-md bg-orange-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    </td>

                    {/* Quick actions */}
                    <td className="px-4 py-3 text-right">
                      {u.role !== 'PlatformAdmin' ? (
                        <form action={updateUserRole} className="inline">
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="newRole" value="PlatformAdmin" />
                          <button
                            type="submit"
                            className="rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100"
                          >
                            ↑ Make Admin
                          </button>
                        </form>
                      ) : isCurrentUser ? (
                        <span className="text-xs text-neutral-400">Current admin</span>
                      ) : (
                        <form action={updateUserRole} className="inline">
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="newRole" value="PatientAdvocate" />
                          <button
                            type="submit"
                            className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                          >
                            ↓ Remove Admin
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                )
              })}

              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-neutral-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
