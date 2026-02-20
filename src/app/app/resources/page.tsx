import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_RESOURCES } from '@/lib/demo-data'

const typeColor: Record<string, string> = { document: 'bg-blue-100 text-blue-700', protocol: 'bg-purple-100 text-purple-700', data: 'bg-emerald-100 text-emerald-700', template: 'bg-amber-100 text-amber-700', guide: 'bg-orange-100 text-orange-700' }

export default async function ResourcesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbResources } = await supabase.from('resources').select('*').order('created_at', { ascending: false })
  const resources = (dbResources ?? []).length > 0
    ? dbResources!.map(r => ({ id: r.id, title: r.title, type: r.type, language: r.language ?? 'en', version: '1.0', initiative: '', uploaded_by: 'Team', uploaded_at: r.created_at }))
    : DEMO_RESOURCES

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Resources</h1>
          <p className="mt-1 text-sm text-neutral-500">{resources.length} shared resources across initiatives.</p>
        </div>
        <button onClick={() => alert('Upload resource feature coming in next release!')} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
          Upload Resource
        </button>
      </div>
      <div className="space-y-2">
        {resources.map(r => (
          <div key={r.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
              <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900 truncate">{r.title}</p>
              <p className="text-xs text-neutral-500">{r.initiative} · By {r.uploaded_by} · {new Date(r.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${typeColor[r.type] ?? 'bg-neutral-100 text-neutral-600'}`}>{r.type}</span>
            <span className="shrink-0 text-xs text-neutral-400">v{r.version}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
