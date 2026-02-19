import { createClient } from '@/lib/supabase/server'

// ─── Type helpers ─────────────────────────────────────────────────────────────
function resourceTypeIcon(type: string): string {
  switch (type) {
    case 'paper':           return '📄'
    case 'dataset':         return '📊'
    case 'presentation':    return '📋'
    case 'video':           return '🎥'
    case 'protocol':        return '📑'
    case 'report':          return '📰'
    case 'guideline':       return '📌'
    case 'template':        return '🗂️'
    default:                return '🔗'
  }
}

function translationBadge(lang: string): string {
  const map: Record<string, string> = {
    en: '🇬🇧', de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸',
    it: '🇮🇹', nl: '🇳🇱', pl: '🇵🇱', pt: '🇵🇹',
  }
  return map[lang.toLowerCase()] ?? lang.toUpperCase()
}

function translationStatusStyle(status: string): string {
  switch (status) {
    case 'complete':    return 'bg-emerald-100 text-emerald-700'
    case 'in_progress': return 'bg-amber-100 text-amber-700'
    case 'needed':      return 'bg-red-100 text-red-700'
    default:            return 'bg-neutral-100 text-neutral-500'
  }
}

type ResourceRow = {
  id: string
  title: string
  type: string
  version: string
  language: string
  cancer_type: string | null
  translation_status: string
  is_partner_contribution: boolean
  partner_org: string | null
  superseded: boolean
  initiative_id: string | null
  initiative_title: string | null
  file_url: string | null
  created_at: string
  translations: { language: string; status: string }[]
}

const RESOURCE_TYPES = [
  'all', 'paper', 'dataset', 'presentation', 'video', 'protocol', 'report', 'guideline', 'template',
]
const LANGUAGES = ['all', 'en', 'de', 'fr', 'es', 'it', 'nl', 'pl']
const CANCER_TYPES = ['all', 'breast', 'lung', 'colorectal', 'prostate', 'pancreatic', 'other']

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; lang?: string; cancer?: string; initiative?: string; view?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const searchQ      = params.q          ?? ''
  const filterType   = params.type       ?? 'all'
  const filterLang   = params.lang       ?? 'all'
  const filterCancer = params.cancer     ?? 'all'
  const filterInit   = params.initiative ?? 'all'
  const view         = params.view       ?? 'grid'

  // ── Fetch initiatives for filter dropdown ─────────────────────────────────
  const { data: initiatives } = await supabase
    .from('initiatives')
    .select('id, title')
    .eq('status', 'active')
    .order('title')

  // ── Fetch resources with translation info ─────────────────────────────────
  let query = supabase
    .from('resources')
    .select(
      'id, title, type, version, language, cancer_type, translation_status, is_partner_contribution, partner_org, superseded, initiative_id, file_url, created_at, initiative:initiatives!resources_initiative_id_fkey(title), translations:resource_translations(language, status)',
    )
    .order('created_at', { ascending: false })

  if (filterType !== 'all')   query = query.eq('type', filterType)
  if (filterLang !== 'all')   query = query.eq('language', filterLang)
  if (filterCancer !== 'all') query = query.eq('cancer_type', filterCancer)
  if (filterInit !== 'all')   query = query.eq('initiative_id', filterInit)

  const { data: rawResources } = await query

  type RawResource = {
    id: string; title: string; type: string; version: string; language: string
    cancer_type: string | null; translation_status: string; is_partner_contribution: boolean
    partner_org: string | null; superseded: boolean; initiative_id: string | null
    file_url: string | null; created_at: string
    initiative: { title: string } | null
    translations: { language: string; status: string }[] | null
  }

  let resources: ResourceRow[] = ((rawResources ?? []) as unknown as RawResource[]).map((r) => ({
    id: r.id, title: r.title, type: r.type, version: r.version ?? '1.0',
    language: r.language ?? 'en', cancer_type: r.cancer_type,
    translation_status: r.translation_status ?? 'needed',
    is_partner_contribution: r.is_partner_contribution ?? false,
    partner_org: r.partner_org, superseded: r.superseded ?? false,
    initiative_id: r.initiative_id, initiative_title: r.initiative?.title ?? null,
    file_url: r.file_url, created_at: r.created_at,
    translations: r.translations ?? [],
  }))

  // Client-side search (title)
  if (searchQ.trim()) {
    const q = searchQ.toLowerCase()
    resources = resources.filter((r) => r.title.toLowerCase().includes(q))
  }

  const totalCount = resources.length
  const activeCount = resources.filter((r) => !r.superseded).length
  const typeCount = new Set(resources.map((r) => r.type)).size
  const partnerCount = resources.filter((r) => r.is_partner_contribution).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Resource Library</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {activeCount} active resource{activeCount !== 1 ? 's' : ''} across {typeCount} type{typeCount !== 1 ? 's' : ''}
          </p>
        </div>
        <a
          href="#upload"
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition-colors"
        >
          + Upload Resource
        </a>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Resources',         value: totalCount,    color: 'text-neutral-900' },
          { label: 'Active (not superseded)', value: activeCount,   color: 'text-emerald-700' },
          { label: 'Resource Types',           value: typeCount,     color: 'text-blue-700' },
          { label: 'Partner Contributions',    value: partnerCount,  color: 'text-violet-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="mt-1 text-xs font-medium text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <form method="GET" className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Search</label>
            <input
              name="q"
              defaultValue={searchQ}
              type="text"
              placeholder="Search by title…"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Type</label>
            <select name="type" defaultValue={filterType}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500">
              {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t === 'all' ? 'All types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          {/* Language */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Language</label>
            <select name="lang" defaultValue={filterLang}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500">
              {LANGUAGES.map((l) => <option key={l} value={l}>{l === 'all' ? 'All languages' : l.toUpperCase()}</option>)}
            </select>
          </div>
          {/* Cancer type */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Cancer type</label>
            <select name="cancer" defaultValue={filterCancer}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500">
              {CANCER_TYPES.map((c) => <option key={c} value={c}>{c === 'all' ? 'All types' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          {/* Initiative */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Initiative</label>
            <select name="initiative" defaultValue={filterInit}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500">
              <option value="all">All initiatives</option>
              {(initiatives ?? []).map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
            </select>
          </div>
          {/* View toggle */}
          <div className="flex gap-1 self-end pb-0.5">
            <button type="submit" name="view" value="grid"
              className={`rounded-lg px-3 py-2 text-sm font-medium border transition-colors ${view === 'grid' ? 'bg-orange-50 border-orange-300 text-orange-700' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
              Grid
            </button>
            <button type="submit" name="view" value="list"
              className={`rounded-lg px-3 py-2 text-sm font-medium border transition-colors ${view === 'list' ? 'bg-orange-50 border-orange-300 text-orange-700' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
              List
            </button>
          </div>
          <button type="submit"
            className="self-end rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 transition-colors">
            Filter
          </button>
        </div>
      </form>

      {/* Resource display */}
      {resources.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
          <p className="text-3xl">📚</p>
          <p className="mt-3 text-sm font-semibold text-neutral-700">No resources found</p>
          <p className="mt-1 text-xs text-neutral-400">Try adjusting your filters or upload the first resource.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => <ResourceCard key={r.id} resource={r} />)}
        </div>
      ) : (
        <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-100 text-sm">
            <thead className="bg-neutral-50">
              <tr>
                {['Title', 'Type', 'Version', 'Language', 'Translations', 'Initiative', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {resources.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="text-base">{resourceTypeIcon(r.type)}</span>
                      <div>
                        <p className="font-medium text-neutral-900">
                          {r.file_url ? (
                            <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="hover:text-orange-700">{r.title}</a>
                          ) : r.title}
                        </p>
                        {r.superseded && <span className="text-xs text-neutral-400 italic">Superseded</span>}
                        {r.is_partner_contribution && (
                          <span className="block text-xs text-violet-600 font-medium">Partner: {r.partner_org}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-neutral-500">{r.type}</td>
                  <td className="px-4 py-3">
                    <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600">v{r.version}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{translationBadge(r.language)} {r.language.toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.translations.slice(0, 4).map((t) => (
                        <span key={t.language} className={`rounded px-1.5 py-0.5 text-xs font-medium ${translationStatusStyle(t.status)}`}>
                          {translationBadge(t.language)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">
                    {r.initiative_title ?? <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Upload form */}
      <section id="upload" className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-900">Upload a Resource</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Fill in all required fields. Partner contributions must include the contributing organisation name.
        </p>
        <form className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" action="#" method="POST" encType="multipart/form-data">
          {/* Title */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input name="title" type="text" required placeholder="e.g. MCED Patient Information Leaflet — DE"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Type <span className="text-red-500">*</span></label>
            <select name="type" required className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500">
              {RESOURCE_TYPES.filter((t) => t !== 'all').map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          {/* Language */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Language <span className="text-red-500">*</span></label>
            <select name="language" required className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500">
              {LANGUAGES.filter((l) => l !== 'all').map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
          </div>
          {/* Cancer type */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Cancer Type</label>
            <select name="cancer_type" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500">
              <option value="">Not specific</option>
              {CANCER_TYPES.filter((c) => c !== 'all').map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          {/* Initiative */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Related Initiative</label>
            <select name="initiative_id" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500">
              <option value="">Platform-wide</option>
              {(initiatives ?? []).map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
            </select>
          </div>
          {/* Version */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Version</label>
            <input name="version" type="text" defaultValue="1.0" placeholder="e.g. 1.0 or 2.1"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
          {/* Partner contribution */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Partner Organisation (if partner contribution)</label>
            <input name="partner_org" type="text" placeholder="e.g. Roche Diagnostics — leave blank if not a partner contribution"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
            <p className="mt-1 text-xs text-neutral-400">Partner contributions are labelled &ldquo;Partner Contribution — [Org]&rdquo; to maintain transparency.</p>
          </div>
          {/* File upload */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">File <span className="text-red-500">*</span></label>
            <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 hover:border-orange-400 hover:bg-orange-50 transition-colors cursor-pointer">
              <div className="text-center">
                <p className="text-3xl">📎</p>
                <p className="mt-2 text-sm font-medium text-neutral-700">Drop file here or click to browse</p>
                <p className="mt-1 text-xs text-neutral-400">PDF, DOCX, XLSX, PPTX, MP4 · max 50 MB</p>
              </div>
              <input name="file" type="file" className="sr-only" accept=".pdf,.docx,.xlsx,.pptx,.mp4" />
            </div>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors">
              Upload Resource
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

// ─── Resource Card (grid view) ─────────────────────────────────────────────────
function ResourceCard({ resource: r }: { resource: ResourceRow }) {
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm flex flex-col gap-3 transition-shadow hover:shadow-md ${r.superseded ? 'opacity-60 border-neutral-200' : 'border-neutral-200'}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{resourceTypeIcon(r.type)}</span>
          <div>
            <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600 capitalize">{r.type}</span>
            {r.superseded && <span className="ml-1 rounded px-1.5 py-0.5 text-xs font-medium bg-neutral-200 text-neutral-400 italic">Superseded</span>}
          </div>
        </div>
        <span className="rounded px-1.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700">v{r.version}</span>
      </div>
      {/* Title */}
      <div>
        {r.file_url ? (
          <a href={r.file_url} target="_blank" rel="noopener noreferrer"
            className="text-sm font-semibold text-neutral-900 hover:text-orange-700 line-clamp-2">
            {r.title}
          </a>
        ) : (
          <p className="text-sm font-semibold text-neutral-900 line-clamp-2">{r.title}</p>
        )}
        {r.is_partner_contribution && (
          <p className="mt-0.5 text-xs font-medium text-violet-600">Partner Contribution — {r.partner_org}</p>
        )}
      </div>
      {/* Meta */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {/* Language */}
        <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600">
          {translationBadge(r.language)} {r.language.toUpperCase()}
        </span>
        {/* Translation status */}
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${translationStatusStyle(r.translation_status)}`}>
          {r.translation_status === 'complete' ? 'Translated' :
           r.translation_status === 'in_progress' ? 'In progress' : 'Needs translation'}
        </span>
        {/* Additional translation badges */}
        {r.translations.slice(0, 3).map((t) => (
          <span key={t.language} title={`${t.language.toUpperCase()} — ${t.status}`}
            className={`rounded px-1.5 py-0.5 text-xs ${translationStatusStyle(t.status)}`}>
            {translationBadge(t.language)}
          </span>
        ))}
        {r.translations.length > 3 && (
          <span className="rounded px-1.5 py-0.5 text-xs bg-neutral-100 text-neutral-500">+{r.translations.length - 3}</span>
        )}
      </div>
      {/* Initiative + date */}
      <div className="flex items-center justify-between border-t border-neutral-100 pt-2">
        <span className="text-xs text-neutral-500 truncate max-w-[60%]">
          {r.initiative_title ?? 'Platform-wide'}
        </span>
        <span className="text-xs text-neutral-400 whitespace-nowrap">
          {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  )
}
