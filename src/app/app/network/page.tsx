'use client'

import { useState } from 'react'
import { DEMO_NETWORK_INTERNAL, DEMO_NETWORK_EXTERNAL } from '@/lib/demo-data'
import { ActionModal } from '@/components/ui/action-modal'

const ROLE_COLOR: Record<string, string> = {
  HubCoordinator:  'bg-orange-100 text-orange-700',
  PatientAdvocate: 'bg-pink-100 text-pink-700',
  Researcher:      'bg-purple-100 text-purple-700',
  Clinician:       'bg-blue-100 text-blue-700',
  BoardMember:     'bg-teal-100 text-teal-700',
  PlatformAdmin:   'bg-neutral-200 text-neutral-700',
}

const PARTNER_TYPE_META: Record<string, { label: string; color: string }> = {
  policy:   { label: 'Policy',    color: 'bg-teal-100 text-teal-700' },
  industry: { label: 'Industry',  color: 'bg-blue-100 text-blue-700' },
  hospital: { label: 'Hospital',  color: 'bg-red-100 text-red-700' },
  academic: { label: 'Academic',  color: 'bg-purple-100 text-purple-700' },
  ngo:      { label: 'NGO',       color: 'bg-emerald-100 text-emerald-700' },
}

const RELATIONSHIP_META: Record<string, { label: string; color: string }> = {
  active_partner: { label: 'Active Partner', color: 'bg-emerald-100 text-emerald-700' },
  engaged:        { label: 'Engaged',        color: 'bg-blue-100 text-blue-700' },
  exploring:      { label: 'Exploring',      color: 'bg-amber-100 text-amber-700' },
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-orange-200 text-orange-800',
  'bg-blue-200 text-blue-800',
  'bg-emerald-200 text-emerald-800',
  'bg-purple-200 text-purple-800',
  'bg-teal-200 text-teal-800',
  'bg-pink-200 text-pink-800',
]
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function activityDot(lastActiveAt: string) {
  const days = Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 86400000)
  if (days <= 1)  return { color: 'bg-emerald-500', label: 'Active today' }
  if (days <= 7)  return { color: 'bg-emerald-400', label: `Active ${days}d ago` }
  if (days <= 30) return { color: 'bg-amber-400',   label: `Active ${days}d ago` }
  return { color: 'bg-red-400', label: `Inactive ${days}d` }
}

type InviteType = 'platform' | 'initiative' | 'group'

export default function NetworkPage() {
  const [tab, setTab] = useState<'internal' | 'external'>('internal')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteType, setInviteType] = useState<InviteType>('platform')
  const [search, setSearch] = useState('')

  const internal = DEMO_NETWORK_INTERNAL.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.organization.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  )

  const external = DEMO_NETWORK_EXTERNAL.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.focus.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Network</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {internal.length} platform members · {DEMO_NETWORK_EXTERNAL.length} external partners
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Invite
        </button>
      </div>

      {/* ── Tabs + Search ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-neutral-200 bg-neutral-50 p-1">
          {(['internal', 'external'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {t === 'internal' ? `Platform Members (${DEMO_NETWORK_INTERNAL.length})` : `External Partners (${DEMO_NETWORK_EXTERNAL.length})`}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* ── Internal ── */}
      {tab === 'internal' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {internal.map(m => {
            const roleColor = ROLE_COLOR[m.role] ?? 'bg-neutral-100 text-neutral-700'
            const activity = activityDot(m.last_active_at)
            return (
              <div key={m.user_id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColor(m.name)}`}>
                    {initials(m.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900">{m.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${roleColor}`}>{m.role}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">{m.organization} · {m.country}</p>
                    {m.initiatives.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.initiatives.map(i => (
                          <span key={i} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600">{i}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-1 text-xs text-neutral-400">
                      <span className={`h-2 w-2 rounded-full ${activity.color}`} />
                      {activity.label}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {internal.length === 0 && (
            <p className="col-span-2 py-12 text-center text-sm text-neutral-400">No members match your search.</p>
          )}
        </div>
      )}

      {/* ── External ── */}
      {tab === 'external' && (
        <div className="space-y-3">
          {external.map(p => {
            const typeMeta = PARTNER_TYPE_META[p.type] ?? { label: p.type, color: 'bg-neutral-100 text-neutral-700' }
            const relMeta = RELATIONSHIP_META[p.relationship] ?? { label: p.relationship, color: 'bg-neutral-100 text-neutral-700' }
            return (
              <div key={p.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900">{p.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${typeMeta.color}`}>{typeMeta.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${relMeta.color}`}>{relMeta.label}</span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">Contact: {p.contact}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">{p.focus}</p>
                  </div>
                  <button
                    onClick={() => { setInviteType('platform'); setInviteOpen(true) }}
                    className="shrink-0 rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50"
                  >
                    Invite to Platform
                  </button>
                </div>
                {p.linked_initiatives.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.linked_initiatives.map(i => (
                      <span key={i} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600">🔗 {i}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {external.length === 0 && (
            <p className="py-12 text-center text-sm text-neutral-400">No partners match your search.</p>
          )}
        </div>
      )}

      {/* ── Invite Modal ── */}
      <ActionModal title="Send Invitation" open={inviteOpen} onClose={() => setInviteOpen(false)}>
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            📬 Email invitations are coming in the next release. This is a preview of the invite flow.
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Invite Type</label>
            <div className="flex gap-2">
              {([['platform', 'Join Platform'], ['initiative', 'Join Initiative'], ['group', 'Join Group']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setInviteType(val)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    inviteType === val ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="name@organization.org"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {inviteType === 'initiative' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Initiative</label>
              <select className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option>Palliative Care Access in Sub-Saharan Africa</option>
                <option>Early Detection Biomarkers — Breast Cancer</option>
                <option>Clinical Trial Access for Rare Cancers</option>
              </select>
            </div>
          )}

          {inviteType === 'initiative' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Role in Initiative</label>
              <select className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="contributor">Contributor</option>
                <option value="reviewer">Reviewer</option>
                <option value="observer">Observer</option>
                <option value="lead">Lead</option>
              </select>
            </div>
          )}

          {inviteType === 'group' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Group / Network</label>
              <input
                placeholder="Group name..."
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Platform Role</label>
            <select className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option>PatientAdvocate</option>
              <option>Clinician</option>
              <option>Researcher</option>
              <option>HubCoordinator</option>
              <option>IndustryPartner</option>
              <option>BoardMember</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Personal Message (optional)</label>
            <textarea
              rows={3}
              placeholder="Hi, I'd like to invite you to join the Inspire2Live platform..."
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={() => setInviteOpen(false)} className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
              Cancel
            </button>
            <button
              onClick={() => setInviteOpen(false)}
              className="rounded-lg bg-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 cursor-not-allowed"
              disabled
            >
              Send Invitation (coming soon)
            </button>
          </div>
        </div>
      </ActionModal>
    </div>
  )
}
