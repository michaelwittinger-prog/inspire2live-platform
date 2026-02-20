import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_EVIDENCE } from '@/lib/demo-data'

const typeColor: Record<string, string> = { document: 'bg-blue-100 text-blue-700', data: 'bg-purple-100 text-purple-700', recording: 'bg-amber-100 text-amber-700', report: 'bg-emerald-100 text-emerald-700' }

export default async function EvidencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbEvidence } = await supabase.from('resources').select('*').eq('initiative_id', id).order('created_at', { ascending: false })
  const evidence = (dbEvidence ?? []).length > 0
    ? dbEvidence!.map(e => ({ id: e.id, title: e.title, type: e.type, language: e.language ?? 'en', version: '1.0', uploaded_by: 'Team member', uploaded_at: e.created_at }))
    : DEMO_EVIDENCE

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Evidence &amp; Resources</h2>
          <p className="text-sm text-neutral-500">{evidence.length} items</p>
        </div>
        <button onClick={() => alert('Upload evidence feature coming in next release!')} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
          Upload Evidence
        </button>
      </div>
      <div className="space-y-2">
        {evidence.map(e => (
          <div key={e.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
              <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900 truncate">{e.title}</p>
              <p className="text-xs text-neutral-500">By {e.uploaded_by} · {new Date(e.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${typeColor[e.type] ?? 'bg-neutral-100 text-neutral-600'}`}>{e.type}</span>
            <span className="shrink-0 text-xs text-neutral-400">v{e.version}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
