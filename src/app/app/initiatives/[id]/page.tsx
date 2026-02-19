import { createClient } from '@/lib/supabase/server'
import { milestoneStatusConfig } from '@/lib/initiative-workspace'

export default async function InitiativeOverviewPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const [{ data: initiative }, { data: milestones }, { data: activity }] = await Promise.all([
    supabase
      .from('initiatives')
      .select('id, title, description, phase, status, countries, objectives')
      .eq('id', params.id)
      .maybeSingle(),

    supabase
      .from('milestones')
      .select('id, title, status, target_date, sort_order')
      .eq('initiative_id', params.id)
      .order('sort_order', { ascending: true })
      .order('target_date', { ascending: true }),

    supabase
      .from('activity_log')
      .select('id, action, entity_type, created_at')
      .eq('initiative_id', params.id)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const milestoneRows = milestones ?? []
  const doneMilestones = milestoneRows.filter((m) => m.status === 'completed').length
  const overdueMilestones = milestoneRows.filter((m) => m.status === 'overdue').length

  // Parse objectives from jsonb (array of strings or objects)
  let objectives: string[] = []
  try {
    const raw = initiative?.objectives
    if (Array.isArray(raw)) {
      objectives = raw.map((o) => (typeof o === 'string' ? o : String(o)))
    }
  } catch {
    objectives = []
  }

  // Mini timeline: show up to 6 milestones
  const timelineMilestones = milestoneRows.slice(0, 6)

  return (
    <div className="space-y-4">
      {/* Description + Country */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-900">Overview</h2>
        <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
          {initiative?.description || 'No description added yet.'}
        </p>
        {initiative?.countries && initiative.countries.length > 0 && (
          <p className="mt-2 text-xs text-neutral-500">
            🌍 {initiative.countries.join(' · ')}
          </p>
        )}
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Phase', value: initiative?.phase ?? '—' },
          { label: 'Status', value: initiative?.status ?? '—' },
          {
            label: 'Milestones',
            value: `${doneMilestones} / ${milestoneRows.length}`,
          },
          {
            label: 'Overdue',
            value: overdueMilestones > 0 ? String(overdueMilestones) : '—',
          },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {label}
            </p>
            <p className="mt-1 text-sm font-semibold text-neutral-900 capitalize">{value}</p>
          </div>
        ))}
      </section>

      {/* Objectives */}
      {objectives.length > 0 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-900">Objectives</h2>
          <ul className="mt-3 space-y-2">
            {objectives.map((obj, i) => (
              <li key={i} className="flex gap-2 text-sm text-neutral-700">
                <span className="mt-0.5 shrink-0 text-(--color-primary-500)">✓</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Mini Milestone Timeline */}
      {timelineMilestones.length > 0 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-900">Milestone Timeline</h2>
          <div className="mt-4 overflow-x-auto">
            <div className="flex min-w-max items-start gap-0">
              {timelineMilestones.map((m, i) => {
                const cfg = milestoneStatusConfig(m.status)
                const isLast = i === timelineMilestones.length - 1
                return (
                  <div key={m.id} className="flex items-start">
                    {/* Node */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-4 w-4 shrink-0 rounded-full border-2 border-white shadow-sm ${cfg.dot}`}
                      />
                      <div className="mt-2 w-28 text-center">
                        <p className="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">
                          {m.title}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                          {new Date(m.target_date).toLocaleDateString('en-GB', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        <span
                          className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${cfg.badge}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                    {/* Connector */}
                    {!isLast && (
                      <div className="mx-1 mt-1.5 h-0.5 w-8 shrink-0 bg-neutral-200" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          {milestoneRows.length > 6 && (
            <p className="mt-3 text-xs text-neutral-400">
              +{milestoneRows.length - 6} more milestones — view the Milestones tab for the full timeline.
            </p>
          )}
        </section>
      )}

      {/* Recent Activity */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-900">Recent Activity</h2>
        {activity && activity.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {activity.map((item) => (
              <li key={item.id} className="flex items-center gap-3 text-sm text-neutral-700">
                <span className="shrink-0 text-neutral-300">•</span>
                <span className="font-medium capitalize">{item.action.replace(/_/g, ' ')}</span>
                <span className="ml-auto shrink-0 text-xs text-neutral-400">
                  {new Date(item.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-neutral-400">
            No activity recorded yet. Start by assigning a task or uploading evidence.
          </p>
        )}
      </section>
    </div>
  )
}
