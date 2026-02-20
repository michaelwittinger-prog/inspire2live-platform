import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_INITIATIVES } from '@/lib/demo-data'

export default async function InitiativeOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbInit } = await supabase.from('initiatives').select('*').eq('id', id).maybeSingle()
  const demo = DEMO_INITIATIVES.find(i => i.id === id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const init: any = dbInit ?? demo

  if (!init) return <div className="p-8 text-center text-neutral-500">Initiative not found.</div>

  const phaseColor: Record<string, string> = { planning: 'bg-blue-100 text-blue-700', research: 'bg-purple-100 text-purple-700', execution: 'bg-emerald-100 text-emerald-700' }
  const objectives = 'objectives' in init ? (init as typeof DEMO_INITIATIVES[0]).objectives : []
  const countries = 'countries' in init ? (init as typeof DEMO_INITIATIVES[0]).countries : []
  const cancerTypes = 'cancer_types' in init ? (init as typeof DEMO_INITIATIVES[0]).cancer_types : []
  const lead = 'lead' in init ? (init as typeof DEMO_INITIATIVES[0]).lead : null

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start gap-3">
          <h1 className="text-xl font-bold text-neutral-900">{init.title}</h1>
          <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${phaseColor[init.phase ?? ''] ?? 'bg-neutral-100 text-neutral-600'}`}>{init.phase}</span>
        </div>
        {'pillar' in init && <p className="mt-1 text-sm text-neutral-500">{(init as typeof DEMO_INITIATIVES[0]).pillar}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Members</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">{init.member_count ?? 0}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Open Tasks</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">{init.open_tasks ?? 0}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Milestones</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">{init.completed_milestones ?? 0}/{init.total_milestones ?? 0}</p>
        </div>
      </div>

      {'description' in init && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-900 mb-2">Description</h2>
          <p className="text-sm text-neutral-700 leading-relaxed">{(init as typeof DEMO_INITIATIVES[0]).description}</p>
        </section>
      )}

      {objectives && objectives.length > 0 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-900 mb-2">Objectives</h2>
          <ul className="space-y-1.5">
            {objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                {obj}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {countries && countries.length > 0 && (
          <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-900 mb-2">Countries</h2>
            <div className="flex flex-wrap gap-2">
              {countries.map(c => <span key={c} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">{c}</span>)}
            </div>
          </section>
        )}
        {cancerTypes && cancerTypes.length > 0 && (
          <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-900 mb-2">Cancer Types</h2>
            <div className="flex flex-wrap gap-2">
              {cancerTypes.map(ct => <span key={ct} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">{ct}</span>)}
            </div>
          </section>
        )}
      </div>

      {lead && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-900 mb-2">Initiative Lead</h2>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
              {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">{lead.name}</p>
              <p className="text-xs text-neutral-500">{lead.role} · {lead.country}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
