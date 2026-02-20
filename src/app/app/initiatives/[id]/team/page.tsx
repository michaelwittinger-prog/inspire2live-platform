'use client'

import { useState } from 'react'
import { DEMO_TEAM_MEMBERS_RICH } from '@/lib/demo-data'
import { ActionModal } from '@/components/ui/action-modal'

// Auth check is handled by the parent layout.tsx server component.

const ROLE_META: Record<string, { label: string; color: string }> = {
  lead:        { label: 'Lead',        color: 'bg-orange-100 text-orange-700' },
  contributor: { label: 'Contributor', color: 'bg-blue-100 text-blue-700' },
  reviewer:    { label: 'Reviewer',    color: 'bg-purple-100 text-purple-700' },
  observer:    { label: 'Observer',    color: 'bg-neutral-100 text-neutral-600' },
}

const PLATFORM_ROLE_LABEL: Record<string, string> = {
  HubCoordinator:  'Hub Coordinator',
  PatientAdvocate: 'Patient Advocate',
  Researcher:      'Researcher',
  Clinician:       'Clinician',
  BoardMember:     'Board Member',
  PlatformAdmin:   'Platform Admin',
}

function activityDot(lastActiveAt: string | undefined): { color: string; label: string } {
  if (!lastActiveAt) return { color: 'bg-neutral-300', label: 'Unknown' }
  const days = Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 86400000)
  if (days <= 1)  return { color: 'bg-emerald-500', label: 'Active today' }
  if (days <= 7)  return { color: 'bg-emerald-400', label: `Active ${days}d ago` }
  if (days <= 30) return { color: 'bg-amber-400',   label: `Active ${days}d ago` }
  return { color: 'bg-red-400', label: `Inactive ${days}d` }
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

type TeamMember = {
  user_id: string
  name: string
  role: string
  platform_role: string
  country: string
  email?: string | null
  phone?: string | null
  bio?: string | null
  responsibilities?: string[] | null
  joined_at: string
  last_active_at?: string
  organization?: string | null
}

export default function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false)

  const members: TeamMember[] = DEMO_TEAM_MEMBERS_RICH
  const sorted = [...members].sort((a, b) => {
    const order = (r: string) => r === 'lead' ? 0 : r === 'reviewer' ? 1 : 2
    return order(a.role) - order(b.role)
  })
  const lead = sorted.find(m => m.role === 'lead')

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Initiative Team</h2>
          <p className="text-sm text-neutral-500">{members.length} members</p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Invite to Initiative
        </button>
      </div>

      {/* ── Invite Modal ── */}
      <ActionModal title="Invite to Initiative" open={inviteOpen} onClose={() => setInviteOpen(false)}>
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            📬 Email invitations are coming in the next release. This is a preview of the invite flow.
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Email Address</label>
            <input type="email" placeholder="colleague@organization.org"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Role in Initiative</label>
            <select className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="contributor">Contributor</option>
              <option value="reviewer">Reviewer</option>
              <option value="observer">Observer</option>
              <option value="lead">Lead</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Personal Message (optional)</label>
            <textarea rows={3} placeholder="Hi, I'd like to invite you to join this initiative..."
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={() => setInviteOpen(false)} className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
              Cancel
            </button>
            <button disabled className="rounded-lg bg-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 cursor-not-allowed">
              Send Invitation (coming soon)
            </button>
          </div>
        </div>
      </ActionModal>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
        📋 Showing representative example team profiles for this initiative
      </div>

      {/* ── Lead spotlight ── */}
      {lead && (
        <section className="rounded-xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-orange-600">Initiative Lead</p>
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-200 text-lg font-bold text-orange-800">
              {initials(lead.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900">{lead.name}</h3>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">Lead</span>
                {lead.last_active_at && (
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
                    <span className={`inline-block h-2 w-2 rounded-full ${activityDot(lead.last_active_at).color}`} />
                    {activityDot(lead.last_active_at).label}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-neutral-600">{PLATFORM_ROLE_LABEL[lead.platform_role] ?? lead.platform_role} · {lead.country}</p>
              {lead.organization && <p className="mt-0.5 text-xs text-neutral-500">{lead.organization}</p>}
              {lead.bio && <p className="mt-2 text-sm leading-relaxed text-neutral-700">{lead.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    {lead.email}
                  </a>
                )}
                {lead.phone && (
                  <span className="inline-flex items-center gap-1.5 text-neutral-600">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    {lead.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── All members ── */}
      <div className="space-y-4">
        {sorted.map(m => {
          const roleMeta = ROLE_META[m.role] ?? ROLE_META.contributor
          const activity = activityDot(m.last_active_at)
          return (
            <div key={m.user_id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold text-neutral-600">
                  {initials(m.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900">{m.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleMeta.color}`}>{roleMeta.label}</span>
                    {m.last_active_at && (
                      <span className="flex items-center gap-1 text-xs text-neutral-400">
                        <span className={`inline-block h-2 w-2 rounded-full ${activity.color}`} />{activity.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {PLATFORM_ROLE_LABEL[m.platform_role] ?? m.platform_role}
                    {m.organization && <> · {m.organization}</>}
                    {m.country && <> · {m.country}</>}
                  </p>
                  {m.bio && <p className="mt-2 text-sm leading-relaxed text-neutral-700">{m.bio}</p>}
                  {m.responsibilities && m.responsibilities.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">Responsibilities</p>
                      <ul className="space-y-1">
                        {m.responsibilities.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(m.email || m.phone) && (
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                      {m.email && (
                        <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                          {m.email}
                        </a>
                      )}
                      {m.phone && (
                        <span className="inline-flex items-center gap-1.5 text-neutral-500">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                          </svg>
                          {m.phone}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-neutral-400">
                    Joined {new Date(m.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
