import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import {
  memberRoleStyle,
  memberRoleLabel,
  activityLevel,
  activityDotStyle,
} from '@/lib/initiative-workspace'

export default async function InitiativeTeamPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('initiative_members')
    .select(
      'id, role, joined_at, profile:profiles!initiative_members_user_id_fkey(id, name, role, avatar_url, organization, country, last_active_at)',
    )
    .eq('initiative_id', params.id)
    .order('joined_at', { ascending: true })

  type MemberRow = {
    id: string
    role: string
    joined_at: string
    profile: {
      id: string
      name: string
      role: string
      avatar_url: string | null
      organization: string | null
      country: string
      last_active_at: string
    } | null
  }

  const members = ((data ?? []) as unknown as MemberRow[]).filter((m) => m.profile !== null)

  // Sort: leads first
  const sorted = [...members].sort((a, b) => {
    if (a.role === 'lead' && b.role !== 'lead') return -1
    if (b.role === 'lead' && a.role !== 'lead') return 1
    return 0
  })

  const counts = {
    total: members.length,
    leads: members.filter((m) => m.role === 'lead').length,
    partners: members.filter((m) => m.role === 'partner').length,
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { label: 'Members', value: counts.total },
          { label: 'Leads', value: counts.leads },
          { label: 'Partners', value: counts.partners },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">{value}</p>
          </div>
        ))}
      </section>

      {sorted.length === 0 ? (
        <section className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm font-medium text-neutral-600">No team members yet.</p>
          <p className="mt-1 text-sm text-neutral-400">
            Coordinators can invite people via the initiative settings.
          </p>
        </section>
      ) : (
        <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="text-base font-semibold text-neutral-900">Team Roster</h2>
          </div>
          <ul className="divide-y divide-neutral-100">
            {sorted.map((member) => {
              const p = member.profile!
              const level = activityLevel(p.last_active_at)
              const dotStyle = activityDotStyle(level)
              const activityLabel =
                level === 'active'
                  ? 'Active recently'
                  : level === 'recent'
                    ? 'Active this week'
                    : 'Inactive'

              return (
                <li key={member.id} className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors">
                  {/* Avatar + activity dot */}
                  <div className="relative shrink-0">
                    {p.avatar_url ? (
                      <Image
                        src={p.avatar_url}
                        alt={p.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200">
                        <span className="text-sm font-bold text-neutral-600">
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Activity indicator dot */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${dotStyle}`}
                      title={activityLabel}
                    />
                  </div>

                  {/* Name + meta */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900">{p.name}</p>
                    <p className="mt-0.5 text-xs text-neutral-500 truncate">
                      {p.organization ? `${p.organization} · ` : ''}{p.country}
                    </p>
                  </div>

                  {/* Role badges */}
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${memberRoleStyle(member.role)}`}
                    >
                      {memberRoleLabel(member.role)}
                    </span>
                    <span className="rounded px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-500">
                      {p.role}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}

