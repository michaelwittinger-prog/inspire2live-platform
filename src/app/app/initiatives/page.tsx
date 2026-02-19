import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function InitiativesIndexPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (profile && !profile.onboarding_completed) redirect('/onboarding')

  const role = profile?.role ?? 'PatientAdvocate'
  const isCoordinator = role === 'HubCoordinator' || role === 'PlatformAdmin'

  const { data: all } = await supabase
    .from('initiative_health')
    .select('id, title, phase, status, member_count, open_tasks, blocked_tasks')
    .order('title')

  let rows = all ?? []

  if (!isCoordinator) {
    const { data: membershipRows } = await supabase
      .from('initiative_members')
      .select('initiative_id')
      .eq('user_id', user.id)
    const memberIds = new Set((membershipRows ?? []).map((m) => m.initiative_id))
    rows = rows.filter((r) => r.id && memberIds.has(r.id))
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Initiatives</h1>
        <p className="mt-1 text-sm text-neutral-500">Browse and open initiative workspaces.</p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <ul className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <Link href={`/app/initiatives/${row.id}`} className="text-sm font-semibold text-neutral-900 hover:text-orange-700">
                  {row.title}
                </Link>
                <p className="text-xs capitalize text-neutral-500">
                  {row.phase} · {row.status}
                </p>
              </div>
              <div className="text-right text-xs text-neutral-600">
                <p>{row.member_count ?? 0} members</p>
                <p>{row.open_tasks ?? 0} open · {row.blocked_tasks ?? 0} blocked</p>
              </div>
            </li>
          ))}

          {rows.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-neutral-500">
              No initiatives available for your current role.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
