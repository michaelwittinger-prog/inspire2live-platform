'use client'

import { useState, useActionState } from 'react'
import { DEMO_TEAM_MEMBERS_RICH } from '@/lib/demo-data'
import { ActionModal } from '@/components/ui/action-modal'
import { InviteCombobox } from '@/components/ui/invite-combobox'
import type { ProfileSuggestion } from '@/components/ui/invite-combobox'
import { sendInitiativeInvite, revokeInitiativeInvite } from './actions'
import type { InviteFormState } from './actions'

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

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  invited:  { label: 'Invited',  color: 'bg-amber-100 text-amber-800',   dot: 'bg-amber-400' },
  accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700',       dot: 'bg-red-400' },
  revoked:  { label: 'Revoked',  color: 'bg-neutral-100 text-neutral-500', dot: 'bg-neutral-300' },
}

function activityDot(lastActiveAt: string | undefined) {
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

const INIT_STATE: InviteFormState = { ok: false }

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteModal({
  open,
  onClose,
  initiativeId,
  initiativeTitle,
}: {
  open: boolean
  onClose: () => void
  initiativeId: string
  initiativeTitle: string
}) {
  const [selectedUser, setSelectedUser] = useState<ProfileSuggestion | null>(null)
  const [rawEmail, setRawEmail] = useState('')
  const [role, setRole] = useState('contributor')
  const [message, setMessage] = useState('')
  const [state, formAction, pending] = useActionState(sendInitiativeInvite, INIT_STATE)

  const handleSelect = (s: ProfileSuggestion | null, email: string) => {
    setSelectedUser(s)
    setRawEmail(email)
  }

  const canSubmit = !pending && (selectedUser !== null || rawEmail.includes('@'))

  return (
    <ActionModal title="Invite to Initiative" open={open} onClose={onClose}>
      {state.ok ? (
        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-sm font-semibold text-emerald-800">✓ Invitation sent!</p>
            {state.emailSent && (
              <p className="mt-1 text-xs text-emerald-700">An invitation email has been sent.</p>
            )}
            {!state.emailSent && (
              <p className="mt-1 text-xs text-emerald-700">In-app notification delivered. (Email not configured)</p>
            )}
          </div>
          <div className="flex justify-end">
            <button onClick={onClose} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
              Done
            </button>
          </div>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="initiativeId" value={initiativeId} />
          <input type="hidden" name="initiativeTitle" value={initiativeTitle} />
          <input type="hidden" name="inviteeUserId" value={selectedUser?.id ?? ''} />
          <input type="hidden" name="inviteeEmail" value={rawEmail} />
          <input type="hidden" name="inviteeName" value={selectedUser?.name ?? ''} />

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Search by name or email
            </label>
            <InviteCombobox onSelect={handleSelect} disabled={pending} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Role in Initiative</label>
            <select
              name="inviteeRole"
              value={role}
              onChange={e => setRole(e.target.value)}
              disabled={pending}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="contributor">Contributor</option>
              <option value="reviewer">Reviewer</option>
              <option value="observer">Observer</option>
              <option value="lead">Lead</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Personal message (optional)</label>
            <textarea
              name="message"
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              disabled={pending}
              placeholder="Hi, I'd like to invite you to join this initiative…"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {state.error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {state.error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white
                ${canSubmit ? 'bg-orange-600 hover:bg-orange-700' : 'bg-neutral-300 cursor-not-allowed'}`}
            >
              {pending ? 'Sending…' : 'Send Invitation'}
            </button>
          </div>
        </form>
      )}
    </ActionModal>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

// TODO: once DB is seeded, replace DEMO with real members from initiative_members
const DEMO_MEMBERS: TeamMember[] = DEMO_TEAM_MEMBERS_RICH

export default function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false)
  // TODO: read initiativeId from params via server component; placeholder for now
  const initiativeId = 'demo'
  const initiativeTitle = 'Demo Initiative'

  const members: TeamMember[] = DEMO_MEMBERS
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
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        initiativeId={initiativeId}
        initiativeTitle={initiativeTitle}
      />

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
        📋 Showing example team. Real membership data loads once DB is seeded.
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
                  {m.email && (
                    <div className="mt-3">
                      <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                        {m.email}
                      </a>
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

      {/* ── Invite status legend ── */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-xs font-semibold text-neutral-700 mb-2">Invitation status codes</p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <span key={key} className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
