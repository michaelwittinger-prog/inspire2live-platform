import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_EVIDENCE_RICH } from '@/lib/demo-data'
import { PlaceholderButton } from '@/components/ui/client-buttons'

const CATEGORY_META: Record<string, { label: string; color: string; icon: string }> = {
  regulatory:     { label: 'Regulatory',      color: 'bg-red-100 text-red-700',       icon: '📋' },
  clinical:       { label: 'Clinical',         color: 'bg-blue-100 text-blue-700',     icon: '🩺' },
  research:       { label: 'Research',         color: 'bg-purple-100 text-purple-700', icon: '🔬' },
  policy:         { label: 'Policy',           color: 'bg-teal-100 text-teal-700',     icon: '📜' },
  patient_stories:{ label: 'Patient Stories',  color: 'bg-orange-100 text-orange-700', icon: '🎤' },
  operational:    { label: 'Operational',      color: 'bg-neutral-100 text-neutral-700',icon: '⚙️' },
}

const STATUS_META: Record<string, { color: string; label: string }> = {
  published: { color: 'bg-emerald-100 text-emerald-700', label: 'Published' },
  reviewed:  { color: 'bg-blue-100 text-blue-700',       label: 'Reviewed' },
  draft:     { color: 'bg-amber-100 text-amber-700',     label: 'Draft' },
}

const FILE_ICON: Record<string, string> = {
  pdf: '📄', docx: '📝', xlsx: '📊', mp4: '🎬', png: '🖼️', zip: '🗜️',
}

type EvidenceItem = {
  id: string
  title: string
  category: string
  status: string
  linked_milestone: string | null
  owner: string
  version: string
  uploaded_at: string
  file_type: string
  description: string
}

export default async function EvidencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbEvidence } = await supabase
    .from('resources')
    .select('*')
    .eq('initiative_id', id)
    .order('created_at', { ascending: false })

  const usingDemo = !dbEvidence || dbEvidence.length === 0

  const evidence: EvidenceItem[] = usingDemo
    ? DEMO_EVIDENCE_RICH
    : dbEvidence!.map((e) => ({
        id: String(e.id),
        title: String(e.title),
        category: String(e.type ?? 'operational'),
        status: 'published',
        linked_milestone: null,
        owner: 'Team member',
        version: '1.0',
        uploaded_at: String(e.created_at),
        file_type: 'pdf',
        description: '',
      }))

  // Summary counts
  const published = evidence.filter(e => e.status === 'published').length
  const draft = evidence.filter(e => e.status === 'draft').length

  // Group by category
  const byCategory: Record<string, typeof evidence> = {}
  for (const e of evidence) {
    const cat = e.category ?? 'operational'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(e)
  }
  const categories = Object.keys(byCategory)

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Evidence Hub</h2>
          <p className="text-sm text-neutral-500">{evidence.length} items · {published} published · {draft} draft</p>
        </div>
        <PlaceholderButton
          label="Upload Evidence"
          message="Evidence upload is coming in the next release."
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          }
        />
      </div>

      {usingDemo && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
          📋 Showing representative example evidence items for this initiative
        </div>
      )}

      {/* ── Summary chips ── */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const meta = CATEGORY_META[cat] ?? CATEGORY_META.operational
          return (
            <span key={cat} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${meta.color}`}>
              {meta.icon} {meta.label} ({byCategory[cat].length})
            </span>
          )
        })}
      </div>

      {/* ── Evidence by category ── */}
      <div className="space-y-6">
        {categories.map(cat => {
          const meta = CATEGORY_META[cat] ?? CATEGORY_META.operational
          const items = byCategory[cat]
          return (
            <section key={cat}>
              <div className="mb-3 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>
                  {meta.icon} {meta.label}
                </span>
                <div className="h-px flex-1 bg-neutral-200" />
                <span className="text-xs text-neutral-400">{items.length} items</span>
              </div>

              <div className="space-y-2">
                {items.map(e => {
                  const statusMeta = STATUS_META[e.status] ?? STATUS_META.draft
                  const fileEmoji = FILE_ICON[e.file_type ?? 'pdf'] ?? '📎'
                  return (
                    <div key={e.id} className="rounded-xl border border-neutral-200 bg-white px-4 py-3.5 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-xl">
                          {fileEmoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-neutral-900">{e.title}</p>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusMeta.color}`}>
                                {statusMeta.label}
                              </span>
                              <span className="text-xs text-neutral-400">v{e.version}</span>
                            </div>
                          </div>
                          {e.description && (
                            <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{e.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                            <span>👤 {e.owner}</span>
                            <span>📅 {new Date(e.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            {e.linked_milestone && (
                              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-600">
                                🔗 {e.linked_milestone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* ── Empty state ── */}
      {evidence.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 py-16 text-center text-neutral-500">
          <p className="text-base font-medium">No evidence yet</p>
          <p className="mt-1 text-sm">Upload documents, data, reports and patient stories to build the evidence base for this initiative.</p>
        </div>
      )}
    </div>
  )
}
