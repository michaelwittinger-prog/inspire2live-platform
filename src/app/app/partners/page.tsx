import { createClient } from '@/lib/supabase/server'

// ─── Badge helpers ─────────────────────────────────────────────────────────────
function appStatusBadge(status: string): { cls: string; label: string } {
  switch (status) {
    case 'approved':   return { cls: 'bg-emerald-100 text-emerald-700', label: 'Approved' }
    case 'declined':   return { cls: 'bg-red-100 text-red-700',         label: 'Declined' }
    case 'clarify':    return { cls: 'bg-amber-100 text-amber-700',     label: 'Needs Clarification' }
    case 'under_review': return { cls: 'bg-blue-100 text-blue-700',     label: 'Under Review' }
    default:           return { cls: 'bg-neutral-100 text-neutral-600', label: 'Submitted' }
  }
}

function auditActionBadge(action: string): string {
  switch (action) {
    case 'approved':   return 'bg-emerald-100 text-emerald-700'
    case 'declined':   return 'bg-red-100 text-red-700'
    case 'clarify':    return 'bg-amber-100 text-amber-700'
    case 'submitted':  return 'bg-blue-100 text-blue-700'
    case 'updated':    return 'bg-neutral-100 text-neutral-600'
    default:           return 'bg-neutral-100 text-neutral-500'
  }
}

type PartnerApp = {
  id: string
  org_name: string
  contact_name: string
  contact_email: string
  scope: string
  neutrality_declaration: boolean
  compliance_note: string | null
  status: string
  review_note: string | null
  submitted_by: string
  submitted_by_name: string
  reviewed_by_name: string | null
  initiative_id: string | null
  initiative_title: string | null
  submitted_at: string
  updated_at: string
}

type AuditRow = {
  id: string
  partner_application_id: string
  org_name: string
  action: string
  actor_name: string
  note: string | null
  created_at: string
}

export default async function PartnersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id ?? '')
    .maybeSingle()

  const role = profile?.role ?? 'PatientAdvocate'
  const isCoordinator = ['HubCoordinator', 'PlatformAdmin'].includes(role)
  const isPartner = role === 'IndustryPartner'

  // ── Fetch applications ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appQuery = (supabase as any)
    .from('partner_applications')
    .select(
      'id, org_name, contact_name, contact_email, scope, neutrality_declaration, compliance_note, status, review_note, submitted_at, updated_at, initiative_id, submitted_by:profiles!partner_applications_submitted_by_fkey(name), reviewed_by:profiles!partner_applications_reviewed_by_fkey(name), initiative:initiatives!partner_applications_initiative_id_fkey(title)',
    )
    .order('submitted_at', { ascending: false })

  const { data: rawApps } = isPartner
    ? await appQuery.eq('submitted_by_id', user?.id ?? '')
    : await appQuery

  type RawApp = {
    id: string; org_name: string; contact_name: string; contact_email: string
    scope: string; neutrality_declaration: boolean; compliance_note: string | null
    status: string; review_note: string | null; submitted_at: string; updated_at: string
    initiative_id: string | null
    submitted_by: { name: string } | null
    reviewed_by: { name: string } | null
    initiative: { title: string } | null
  }

  const applications: PartnerApp[] = ((rawApps ?? []) as unknown as RawApp[]).map((a) => ({
    id: a.id, org_name: a.org_name, contact_name: a.contact_name,
    contact_email: a.contact_email, scope: a.scope,
    neutrality_declaration: a.neutrality_declaration,
    compliance_note: a.compliance_note, status: a.status,
    review_note: a.review_note, submitted_by: '',
    submitted_by_name: a.submitted_by?.name ?? 'Unknown',
    reviewed_by_name: a.reviewed_by?.name ?? null,
    initiative_id: a.initiative_id,
    initiative_title: a.initiative?.title ?? null,
    submitted_at: a.submitted_at, updated_at: a.updated_at,
  }))

  // ── Fetch audit trail (coordinators only) ─────────────────────────────────
  let auditRows: AuditRow[] = []
  if (isCoordinator) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawAudit } = await (supabase as any)
      .from('partner_audit_log')
      .select(
        'id, partner_application_id, action, note, created_at, actor:profiles!partner_audit_log_actor_id_fkey(name), application:partner_applications!partner_audit_log_partner_application_id_fkey(org_name)',
      )
      .order('created_at', { ascending: false })
      .limit(50)

    type RawAudit = {
      id: string; partner_application_id: string; action: string; note: string | null; created_at: string
      actor: { name: string } | null; application: { org_name: string } | null
    }

    auditRows = ((rawAudit ?? []) as unknown as RawAudit[]).map((a) => ({
      id: a.id, partner_application_id: a.partner_application_id,
      org_name: a.application?.org_name ?? 'Unknown', action: a.action,
      actor_name: a.actor?.name ?? 'System', note: a.note, created_at: a.created_at,
    }))
  }

  const pending = applications.filter((a) => a.status === 'submitted' || a.status === 'under_review')
  const approved = applications.filter((a) => a.status === 'approved')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">
            {isPartner ? 'My Partner Engagements' : 'Partner Portal'}
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {isPartner
              ? 'Submit a new partnership application or track your existing engagements.'
              : `${applications.length} applications · ${pending.length} pending review · ${approved.length} approved`}
          </p>
        </div>
      </div>

      {/* KPI strip (coordinators) */}
      {isCoordinator && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Applications',  value: applications.length, color: 'text-neutral-900' },
            { label: 'Pending Review',       value: pending.length,      color: pending.length > 0 ? 'text-amber-600' : 'text-neutral-900' },
            { label: 'Approved',             value: approved.length,     color: 'text-emerald-700' },
            { label: 'Audit Events',         value: auditRows.length,    color: 'text-neutral-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Application list */}
      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">
            {isCoordinator ? 'All Applications' : 'My Applications'}
          </h2>
          <span className="text-xs text-neutral-400">{applications.length} total</span>
        </div>
        {applications.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-neutral-400">No applications yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {applications.map((app) => {
              const badge = appStatusBadge(app.status)
              return (
                <li key={app.id} className="px-5 py-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-neutral-900">{app.org_name}</p>
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                        {app.neutrality_declaration && (
                          <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-600">✓ Neutrality declared</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{app.scope}</p>
                      <div className="mt-1.5 flex items-center gap-3 flex-wrap text-xs text-neutral-400">
                        <span>Contact: <span className="font-medium text-neutral-600">{app.contact_name}</span></span>
                        <span>·</span>
                        <span>Submitted by {app.submitted_by_name}</span>
                        {app.initiative_title && <><span>·</span><span className="text-orange-700">{app.initiative_title}</span></>}
                        <span>·</span>
                        <span>{new Date(app.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      {app.review_note && (
                        <p className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                          <span className="font-semibold">Reviewer note:</span> {app.review_note}
                        </p>
                      )}
                    </div>
                    {/* Governance review actions (coordinators only) */}
                    {isCoordinator && (app.status === 'submitted' || app.status === 'under_review') && (
                      <div className="shrink-0 flex flex-col gap-1.5">
                        <form action={`/app/partners/${app.id}/approve`} method="POST">
                          <button type="submit"
                            className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
                            Approve
                          </button>
                        </form>
                        <form action={`/app/partners/${app.id}/clarify`} method="POST">
                          <button type="submit"
                            className="w-full rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors">
                            Request Clarification
                          </button>
                        </form>
                        <form action={`/app/partners/${app.id}/decline`} method="POST">
                          <button type="submit"
                            className="w-full rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors">
                            Decline
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Partner Application Form */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-900">
          {isPartner ? 'Submit a New Application' : 'Submit Application on Behalf of Partner'}
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          All partner applications are reviewed by the Bureau. The neutrality declaration is mandatory and binding.
          Partner access is scoped and contributions are always labelled separately from Inspire2Live content.
        </p>
        <form className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" action="#" method="POST" encType="multipart/form-data">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Organisation Name <span className="text-red-500">*</span></label>
            <input name="org_name" type="text" required placeholder="e.g. Roche Diagnostics GmbH"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Contact Name <span className="text-red-500">*</span></label>
            <input name="contact_name" type="text" required placeholder="Full name of primary contact"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Contact Email <span className="text-red-500">*</span></label>
            <input name="contact_email" type="email" required placeholder="contact@organisation.com"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Related Initiative (optional)</label>
            <input name="initiative" type="text" placeholder="Initiative name or leave blank for platform-wide"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Scope of Engagement <span className="text-red-500">*</span></label>
            <textarea name="scope" rows={3} required
              placeholder="Describe what the organisation will contribute and in what capacity (e.g. funding, data, expertise, co-authorship)…"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Compliance Notes (optional)</label>
            <textarea name="compliance_note" rows={2}
              placeholder="Any relevant compliance, conflict-of-interest, or regulatory notes…"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Compliance Document (optional)</label>
            <input name="compliance_doc" type="file" accept=".pdf,.docx"
              className="block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-orange-700 hover:file:bg-orange-100" />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input name="neutrality_declaration" type="checkbox" required
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500" />
              <span className="text-xs text-neutral-700 leading-relaxed">
                <span className="font-semibold text-neutral-900">Neutrality Declaration (mandatory).</span>{' '}
                I confirm that this organisation&apos;s involvement will not influence scientific content, patient communications, or governance decisions.
                All contributions will be clearly labelled and remain subject to Inspire2Live governance oversight.
              </span>
            </label>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors">
              Submit Application
            </button>
          </div>
        </form>
      </section>

      {/* Audit Trail (coordinators only) */}
      {isCoordinator && (
        <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="text-base font-semibold text-neutral-900">Partner Audit Trail</h2>
            <p className="mt-0.5 text-xs text-neutral-500">Last 50 governance actions — visible to coordinators and board members only</p>
          </div>
          {auditRows.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <p className="text-sm text-neutral-400">No audit events recorded yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {auditRows.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-3 hover:bg-neutral-50 transition-colors">
                  <span className={`mt-0.5 rounded px-1.5 py-0.5 text-xs font-semibold capitalize ${auditActionBadge(a.action)}`}>
                    {a.action}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-neutral-900 font-medium">{a.org_name}</p>
                    {a.note && <p className="mt-0.5 text-xs text-neutral-500">{a.note}</p>}
                    <p className="mt-0.5 text-xs text-neutral-400">by {a.actor_name}</p>
                  </div>
                  <span className="shrink-0 text-xs text-neutral-400 whitespace-nowrap">
                    {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
