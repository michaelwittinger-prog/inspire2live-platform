import { createClient } from '@/lib/supabase/server'
import { milestoneStatusConfig } from '@/lib/initiative-workspace'

export default async function InitiativeMilestonesPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('milestones')
    .select('id, title, description, status, target_date, completed_date, evidence_required, sort_order')
    .eq('initiative_id', params.id)
    .order('sort_order', { ascending: true })
    .order('target_date', { ascending: true })

  const milestones = data ?? []

  const counts = {
    total: milestones.length,
    completed: milestones.filter((m) => m.status === 'completed').length,
    in_progress: milestones.filter((m) => m.status === 'in_progress').length,
    overdue: milestones.filter((m) => m.status === 'overdue').length,
    upcoming: milestones.filter((m) => m.status === 'upcoming').length,
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: counts.total },
          { label: 'Completed', value: counts.completed },
          { label: 'In Progress', value: counts.in_progress },
          { label: 'Overdue', value: counts.overdue },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">{value}</p>
          </div>
        ))}
      </section>

      {milestones.length === 0 ? (
        <section className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm font-medium text-neutral-600">No milestones added yet.</p>
          <p className="mt-1 text-sm text-neutral-400">
            Milestones help track major progress points. Add the first one to get started.
          </p>
        </section>
      ) : (
        <>
          {/* Horizontal Timeline — scrollable on small screens */}
          <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-900">Timeline</h2>
            <div className="mt-6 overflow-x-auto pb-2">
              <div className="flex min-w-max items-start gap-0">
                {milestones.map((m, i) => {
                  const cfg = milestoneStatusConfig(m.status)
                  const isLast = i === milestones.length - 1
                  return (
                    <div key={m.id} className="flex items-start">
                      <div className="flex flex-col items-center">
                        {/* Status dot */}
                        <div
                          className={`h-5 w-5 shrink-0 rounded-full border-2 border-white shadow ${cfg.dot}`}
                          title={cfg.label}
                        />
                        {/* Label */}
                        <div className="mt-2 w-32 text-center">
                          <p className="text-xs font-semibold text-neutral-800 line-clamp-2 leading-snug">
                            {m.title}
                          </p>
                          <p className="mt-1 text-xs text-neutral-400">
                            {new Date(m.target_date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <span
                            className={`mt-1.5 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${cfg.badge}`}
                          >
                            {cfg.label}
                          </span>
                          {m.evidence_required && (
                            <span className="ml-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">
                              Evidence req.
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Connector line */}
                      {!isLast && (
                        <div className="mx-1 mt-2 h-0.5 w-10 shrink-0 bg-neutral-200" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Detail List with expandable items */}
          <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100">
              <h2 className="text-base font-semibold text-neutral-900">Milestone Details</h2>
            </div>
            <ul className="divide-y divide-neutral-100">
              {milestones.map((m) => {
                const cfg = milestoneStatusConfig(m.status)
                return (
                  <li key={m.id}>
                    <details className="group">
                      <summary className="flex cursor-pointer items-center gap-3 px-5 py-4 select-none hover:bg-neutral-50 transition-colors">
                        {/* Status dot */}
                        <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />
                        {/* Title + date */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-900 truncate">{m.title}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Target:{' '}
                            {new Date(m.target_date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                            {m.completed_date && (
                              <> · Completed:{' '}
                                {new Date(m.completed_date).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </>
                            )}
                          </p>
                        </div>
                        {/* Badges */}
                        <div className="flex items-center gap-2 shrink-0">
                          {m.evidence_required && (
                            <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">
                              Evidence req.
                            </span>
                          )}
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                          {/* Chevron */}
                          <svg
                            className="h-4 w-4 text-neutral-400 group-open:rotate-180 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </summary>
                      {/* Expanded detail */}
                      <div className="bg-neutral-50 px-5 pb-4 pt-2 text-sm text-neutral-600">
                        {m.description ? (
                          <p className="leading-relaxed">{m.description}</p>
                        ) : (
                          <p className="italic text-neutral-400">No description added.</p>
                        )}
                      </div>
                    </details>
                  </li>
                )
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
