import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_CONGRESS } from '@/lib/demo-data'
import { PlaceholderButton, PlusIcon, VoteButton } from '@/components/ui/client-buttons'

export default async function CongressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const congress = DEMO_CONGRESS

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Congress</h1>
        <p className="mt-1 text-sm text-neutral-500">Annual gathering of the Inspire2Live community.</p>
      </div>

      {/* Event card */}
      <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">{congress.event.title}</h2>
            <p className="mt-1 text-sm text-neutral-600">{congress.event.description}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-700">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                {new Date(congress.event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                {congress.event.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Proposed topics */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-neutral-900">Proposed Topics</h2>
          <PlaceholderButton label="Propose Topic" icon={<PlusIcon />} message="Topic proposals will be available closer to Congress 2026." />
        </div>
        <div className="space-y-2">
          {congress.topics.map(t => (
            <div key={t.id} className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <VoteButton votes={t.votes} />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-neutral-900">{t.title}</h3>
                <p className="text-xs text-neutral-500">Proposed by {t.proposer} · {t.initiative}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sessions */}
      <section>
        <h2 className="text-base font-semibold text-neutral-900 mb-3">Confirmed Sessions</h2>
        <div className="space-y-2">
          {congress.sessions.map(s => (
            <div key={s.id} className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <span className="shrink-0 rounded-lg bg-orange-100 px-3 py-1.5 text-sm font-bold text-orange-700">{s.time}</span>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">{s.title}</h3>
                <p className="text-xs text-neutral-500">Speaker: {s.speaker}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
