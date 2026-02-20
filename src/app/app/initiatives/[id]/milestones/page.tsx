import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_MILESTONES } from '@/lib/demo-data'

const statusStyle: Record<string, { bg: string; dot: string; label: string }> = {
  completed: { bg: 'bg-emerald-50', dot: 'bg-emerald-500', label: 'Completed' },
  in_progress: { bg: 'bg-blue-50', dot: 'bg-blue-500', label: 'In Progress' },
  upcoming: { bg: 'bg-neutral-50', dot: 'bg-neutral-400', label: 'Upcoming' },
}

export default async function MilestonesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbMilestones } = await supabase
    .from('milestones')
    .select('*')
    .eq('initiative_id', id)
    .order('target_date')

  const milestones = (dbMilestones ?? []).length > 0
    ? dbMilestones!.map(m => ({ id: m.id, title: m.title, status: m.status, target_date: m.target_date, completed_date: m.completed_date, evidence_required: m.evidence_required }))
    : DEMO_MILESTONES

  const completed = milestones.filter(m => m.status === 'completed').length
  const total = milestones.length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Milestones</h2>
          <p className="text-sm text-neutral-500">{completed} of {total} completed</p>
        </div>
        <button onClick={() => alert('Add milestone feature coming in next release!')} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Milestone
        </button>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-neutral-500 mb-1">
          <span>Progress</span>
          <span>{total > 0 ? Math.round((completed / total) * 100) : 0}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-100">
          <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {milestones.map((m) => {
          const s = statusStyle[m.status] ?? statusStyle.upcoming
          return (
            <div key={m.id} className={`rounded-xl border border-neutral-200 ${s.bg} p-4 shadow-sm`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${s.dot}`} />
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">{m.title}</h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                      <span>Target: {new Date(m.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {m.completed_date && <span>Completed: {new Date(m.completed_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      {m.evidence_required && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">Evidence required</span>}
                    </div>
                  </div>
                </div>
                <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-neutral-600 bg-white border border-neutral-200">{s.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
