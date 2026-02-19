import { createClient } from '@/lib/supabase/server'
import { resourceTypeIcon, translationBadge } from '@/lib/initiative-workspace'
import Link from 'next/link'

export default async function InitiativeEvidencePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string; view?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()

  const { data } = await supabase
    .from('resources')
    .select(
      'id, title, type, version, language, translation_status, is_partner_contribution, partner_organization, created_at, uploader:profiles!resources_uploaded_by_id_fkey(name)',
    )
    .eq('initiative_id', id)
    .order('created_at', { ascending: false })

  const typeFilter = sp.type ?? 'all'
  const view = sp.view ?? 'grid'

  type ResourceRow = {
    id: string
    title: string
    type: string
    version: number
    language: string
    translation_status: string
    is_partner_contribution: boolean
    partner_organization: string | null
    created_at: string
    uploader: { name: string } | null
  }

  const rows = ((data ?? []) as unknown as ResourceRow[]).filter(
    (r) => typeFilter === 'all' || r.type === typeFilter,
  )

  const resourceTypes = ['document', 'data', 'link', 'recording', 'template', 'report']
  const baseUrl = `/app/initiatives/${id}/evidence`
  const filterLink = (key: string, val: string) => {
    const t = key === 'type' ? val : typeFilter
    const v = key === 'view' ? val : view
    return `${baseUrl}?type=${t}&view=${v}`
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs font-semibold text-neutral-500 mr-1">Type:</span>
            {['all', ...resourceTypes].map((t) => (
              <Link
                key={t}
                href={filterLink('type', t)}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  typeFilter === t
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {t === 'all' ? 'All' : `${resourceTypeIcon(t)} ${t.charAt(0).toUpperCase() + t.slice(1)}`}
              </Link>
            ))}
          </div>
          {/* View toggle */}
          <div className="ml-auto flex items-center gap-1">
            {(['grid', 'list'] as const).map((v) => (
              <Link
                key={v}
                href={filterLink('view', v)}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  view === v
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {v === 'grid' ? 'Grid' : 'List'}
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-neutral-400">{rows.length} item{rows.length !== 1 ? 's' : ''}</p>
      </section>

      {rows.length === 0 ? (
        <section className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm font-medium text-neutral-600">No evidence uploaded yet.</p>
          <p className="mt-1 text-sm text-neutral-400">
            Upload documents, data, recordings, and links to build the initiative evidence base.
          </p>
        </section>
      ) : view === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => {
            const tbadge = translationBadge(r.translation_status)
            return (
              <div
                key={r.id}
                className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm flex flex-col gap-2"
              >
                {/* Icon + title */}
                <div className="flex items-start gap-2">
                  <span className="text-2xl shrink-0 leading-none">{resourceTypeIcon(r.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900 line-clamp-2 leading-snug">{r.title}</p>
                    <p className="mt-0.5 text-xs text-neutral-400 capitalize">{r.type}</p>
                  </div>
                </div>
                {/* Badges row */}
                <div className="flex flex-wrap gap-1 mt-auto">
                  <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600">
                    v{r.version}
                  </span>
                  <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-500 uppercase">
                    {r.language}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${tbadge.style}`}>
                    {tbadge.label}
                  </span>
                  {r.is_partner_contribution && (
                    <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">
                      Partner{r.partner_organization ? ` — ${r.partner_organization}` : ''}
                    </span>
                  )}
                </div>
                {/* Uploader + date */}
                <p className="text-xs text-neutral-400">
                  {r.uploader?.name ?? 'Unknown'} ·{' '}
                  {new Date(r.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )
          })}
        </div>
      ) : (
        /* List view */
        <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <ul className="divide-y divide-neutral-100">
            {rows.map((r) => {
              const tbadge = translationBadge(r.translation_status)
              return (
                <li key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50 transition-colors">
                  <span className="text-xl shrink-0">{resourceTypeIcon(r.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 truncate">{r.title}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {r.uploader?.name ?? 'Unknown'} ·{' '}
                      {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1 justify-end">
                    <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600">v{r.version}</span>
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${tbadge.style}`}>{tbadge.label}</span>
                    {r.is_partner_contribution && (
                      <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">Partner</span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
