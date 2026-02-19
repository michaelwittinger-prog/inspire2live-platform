import { createClient } from '@/lib/supabase/server'
import { threadTypeConfig } from '@/lib/initiative-workspace'
import Link from 'next/link'

export default async function InitiativeDiscussionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()

  const { data } = await supabase
    .from('discussions')
    .select(
      'id, title, content, thread_type, is_pinned, reply_count, created_at, author:profiles!discussions_author_id_fkey(name)',
    )
    .eq('initiative_id', id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const typeFilter = sp.type ?? 'all'

  type DiscussionRow = {
    id: string
    title: string
    content: string
    thread_type: string
    is_pinned: boolean
    reply_count: number
    created_at: string
    author: { name: string } | null
  }

  const rows = ((data ?? []) as unknown as DiscussionRow[]).filter(
    (d) => typeFilter === 'all' || d.thread_type === typeFilter,
  )

  const threadTypes = ['general', 'decision', 'question', 'blocker', 'idea']
  const baseUrl = `/app/initiatives/${id}/discussions`

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs font-semibold text-neutral-500 mr-1">Filter:</span>
          {['all', ...threadTypes].map((t) => {
            const cfg = t === 'all' ? { label: 'All', style: '' } : threadTypeConfig(t)
            const isActive = typeFilter === t
            return (
              <Link
                key={t}
                href={`${baseUrl}?type=${t}`}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : t === 'all'
                      ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      : `${cfg.style} opacity-80 hover:opacity-100`
                }`}
              >
                {cfg.label}
              </Link>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-neutral-400">
          {rows.length} thread{rows.length !== 1 ? 's' : ''}
        </p>
      </section>

      {rows.length === 0 ? (
        <section className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm font-medium text-neutral-600">No discussions yet.</p>
          <p className="mt-1 text-sm text-neutral-400">
            Start a thread to share ideas, flag blockers, or record decisions for the team.
          </p>
        </section>
      ) : (
        <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <ul className="divide-y divide-neutral-100">
            {rows.map((discussion) => {
              const cfg = threadTypeConfig(discussion.thread_type)
              const preview = discussion.content.slice(0, 140) + (discussion.content.length > 140 ? '…' : '')
              return (
                <li
                  key={discussion.id}
                  className="px-5 py-4 hover:bg-neutral-50 transition-colors"
                >
                  {/* Header row */}
                  <div className="flex items-start gap-2">
                    {/* Pinned indicator */}
                    {discussion.is_pinned && (
                      <span className="mt-0.5 shrink-0 text-xs font-bold text-amber-500" title="Pinned">
                        📌
                      </span>
                    )}
                    {/* Thread type tag */}
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${cfg.style}`}>
                      {cfg.label}
                    </span>
                    {/* Title */}
                    <p className="flex-1 text-sm font-semibold text-neutral-900 leading-snug">
                      {discussion.title}
                    </p>
                    {/* Reply count */}
                    <span className="ml-auto shrink-0 flex items-center gap-1 text-xs text-neutral-400">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {discussion.reply_count}
                    </span>
                  </div>
                  {/* Content preview */}
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed line-clamp-2">{preview}</p>
                  {/* Footer */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
                    <span>{discussion.author?.name ?? 'Unknown'}</span>
                    <span>·</span>
                    <span>
                      {new Date(discussion.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
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
