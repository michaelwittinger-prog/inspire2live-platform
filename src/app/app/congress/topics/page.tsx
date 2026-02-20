import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TOPIC_STATUS_META, normalizeTopicStatus, type CongressTopic } from '@/lib/congress'
import { DEMO_CONGRESS_TOPICS } from '@/lib/demo-data'
import { PlaceholderButton, PlusIcon, VoteButton } from '@/components/ui/client-buttons'

// ── Sub-components declared at module level (avoids react-hooks/rules-of-hooks) ──

function SectionHeader({ title, count, badge }: { title: string; count: number; badge: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}>
        {count}
      </span>
    </div>
  )
}

function TopicCard({ t }: { t: CongressTopic }) {
  const meta = TOPIC_STATUS_META[normalizeTopicStatus(t.status)]
  return (
    <div className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <VoteButton votes={t.vote_count} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-neutral-900">{t.title}</h3>
          <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.badge}`}>
            {meta.label}
          </span>
        </div>
        {t.description && (
          <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{t.description}</p>
        )}
        <p className="mt-1.5 text-xs text-neutral-400">
          Proposed by {t.submitter_name ?? 'Community Member'}
          {t.initiative_title && ` · ${t.initiative_title}`}
          {t.carryover_from_topic_id && (
            <span className="ml-2 inline-flex items-center gap-0.5 text-violet-600">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
              carried over
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CongressTopicsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbTopics } = await supabase
    .from('congress_topics')
    .select('*, profiles(full_name)')
    .order('vote_count', { ascending: false })

  const topics: CongressTopic[] = (dbTopics && dbTopics.length > 0)
    ? (dbTopics as unknown[]).map((raw) => {
        const t = raw as Record<string, unknown>
        return {
          ...(t as unknown as CongressTopic),
          submitter_name: (t.profiles as { full_name?: string } | null)?.full_name ?? 'Community Member',
        }
      })
    : DEMO_CONGRESS_TOPICS

  const byStatus = {
    approved:   topics.filter(t => normalizeTopicStatus(t.status) === 'approved'),
    discussing: topics.filter(t => normalizeTopicStatus(t.status) === 'discussing'),
    submitted:  topics.filter(t => normalizeTopicStatus(t.status) === 'submitted'),
    resolved:   topics.filter(t => normalizeTopicStatus(t.status) === 'resolved'),
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Congress Topics</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Community-proposed topics for Congress 2026 — vote for the issues that matter most.
          </p>
        </div>
        <PlaceholderButton
          label="Propose Topic"
          icon={<PlusIcon />}
          message="Topic submission form will be enabled once agenda building begins."
        />
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <strong>Topics are open for community voting.</strong> Upvote the topics you believe should be on the
        Congress 2026 agenda. High-voted topics are prioritised for session scheduling.
      </div>

      {byStatus.approved.length > 0 && (
        <section>
          <SectionHeader title="Approved for Agenda" count={byStatus.approved.length} badge="bg-green-100 text-green-700" />
          <div className="space-y-2">{byStatus.approved.map(t => <TopicCard key={t.id} t={t} />)}</div>
        </section>
      )}

      {byStatus.discussing.length > 0 && (
        <section>
          <SectionHeader title="Under Discussion" count={byStatus.discussing.length} badge="bg-violet-100 text-violet-700" />
          <div className="space-y-2">{byStatus.discussing.map(t => <TopicCard key={t.id} t={t} />)}</div>
        </section>
      )}

      {byStatus.submitted.length > 0 && (
        <section>
          <SectionHeader title="Open Proposals" count={byStatus.submitted.length} badge="bg-blue-100 text-blue-700" />
          <div className="space-y-2">{byStatus.submitted.map(t => <TopicCard key={t.id} t={t} />)}</div>
        </section>
      )}

      {byStatus.resolved.length > 0 && (
        <section>
          <SectionHeader title="Resolved" count={byStatus.resolved.length} badge="bg-neutral-200 text-neutral-500" />
          <div className="space-y-2">{byStatus.resolved.map(t => <TopicCard key={t.id} t={t} />)}</div>
        </section>
      )}

      {topics.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center">
          <p className="text-sm text-neutral-500">No topics yet. Be the first to propose a topic for Congress 2026.</p>
        </div>
      )}
    </div>
  )
}
