import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_TEAM_MEMBERS } from '@/lib/demo-data'

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbMembers } = await supabase
    .from('initiative_members')
    .select('user_id, role, joined_at, profiles(name, role, country)')
    .eq('initiative_id', id)

  const members = (dbMembers ?? []).length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? dbMembers!.map((m: any) => ({ user_id: m.user_id, name: m.profiles?.name ?? 'Unknown', role: m.role, platform_role: m.profiles?.role ?? '', country: m.profiles?.country ?? '', joined_at: m.joined_at }))
    : DEMO_TEAM_MEMBERS

  const roleColor: Record<string, string> = { lead: 'bg-orange-100 text-orange-700', contributor: 'bg-blue-100 text-blue-700', reviewer: 'bg-purple-100 text-purple-700', partner: 'bg-emerald-100 text-emerald-700' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Team Members</h2>
          <p className="text-sm text-neutral-500">{members.length} members</p>
        </div>
        <button onClick={() => alert('Invite member feature coming in next release!')} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
          Invite Member
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {members.map((m) => (
          <div key={m.user_id} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
              {m.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900 truncate">{m.name}</p>
              <p className="text-xs text-neutral-500">{m.platform_role} · {m.country}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${roleColor[m.role] ?? 'bg-neutral-100 text-neutral-600'}`}>{m.role}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
