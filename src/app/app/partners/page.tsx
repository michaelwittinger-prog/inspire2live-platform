import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_PARTNERS } from '@/lib/demo-data'

const neutralityColor: Record<string, string> = { declared: 'bg-emerald-100 text-emerald-700', pending: 'bg-amber-100 text-amber-700', review: 'bg-blue-100 text-blue-700' }

export default async function PartnersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // partner_initiatives table may not exist yet - use demo data
  const partners = DEMO_PARTNERS

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Partners</h1>
          <p className="mt-1 text-sm text-neutral-500">{partners.length} partnerships with neutrality declarations.</p>
        </div>
        <button onClick={() => alert('Add partner feature coming in next release!')} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Partner
        </button>
      </div>
      <div className="space-y-3">
        {partners.map(p => (
          <div key={p.id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">{p.partner}</h3>
                <p className="mt-1 text-sm text-neutral-600">{p.contribution}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                  {p.initiative && <span>Initiative: {p.initiative}</span>}
                  {p.contact && <span>Contact: {p.contact}</span>}
                  <span>Since {new Date(p.since).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${neutralityColor[p.neutrality_status] ?? 'bg-neutral-100 text-neutral-600'}`}>
                Neutrality: {p.neutrality_status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
