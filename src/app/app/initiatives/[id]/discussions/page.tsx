import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_DISCUSSIONS } from '@/lib/demo-data'

const typeColor: Record<string, string> = {
  decision: 'bg-blue-100 text-blue-700',
  blocker: 'bg-red-100 text-red-700',
  idea: 'bg-emerald-100 text-emerald-700',
  general: 'bg-neutral-100 text-neutral-600',
}

export default async function DiscussionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbDiscussions } = await supabase
    .from('discussions')
    .select('id, title, thread_type, created_at, author_id, profiles(name)')
    .eq('initiative_id', id)
    .order('created_at', { ascending: false })

  const discussions = (dbDiscussions ?? []).length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? dbDiscussions!.map((d: any) => ({ id: d.id, title: d.title, thread_type: d.thread_type, author: d.profiles?.name ?? 'Unknown', created_at: d.created_at, reply_count: 0, preview: '' }))
    : DEMO_DISCUSSIONS

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Discussions</h2>
          <p className="text-sm text-neutral-500">{discussions.length} threads</p>
        </div>
        <button onClick={() => alert('Start discussion feature coming in next release!')} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Start Discussion
        </button>
      </div>

      <div className="space-y-3">
        {discussions.map((d) => (
          <div key={d.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm hover:border-orange-200 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${typeColor[d.thread_type] ?? typeColor.general}`}>{d.thread_type}</span>
                  <h3 className="text-sm font-semibold text-neutral-900 truncate">{d.title}</h3>
                </div>
                {d.preview && <p className="mt-1.5 text-sm text-neutral-600 line-clamp-2">{d.preview}</p>}
                <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                  <span>By {d.author}</span>
                  <span>{new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                  {d.reply_count}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
