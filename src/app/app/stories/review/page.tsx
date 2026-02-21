import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceDiagnostics } from '@/components/congress/workspace/workspace-diagnostics'
import { StatusBadge } from '@/components/ui/status-badge'
import type { StatusTone } from '@/components/ui/status-badge'
import { PATIENT_STORY_STATUS_META, type PatientStoryStatus } from '@/lib/patient-stories'
import { publishStory, reviewerSetStatus } from '../actions'

type ReviewStoryRow = {
  id: string
  title: string
  summary: string | null
  status: PatientStoryStatus
  author_id: string
  submitted_at: string | null
  updated_at: string
}

export default async function StoryReviewQueuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const role = profile?.role ?? ''
  const canReview = ['HubCoordinator', 'PlatformAdmin'].includes(role)
  if (!canReview) redirect('/app/stories')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { data: rows, error } = await sb
    .from('patient_stories')
    .select('id, title, summary, status, author_id, submitted_at, updated_at')
    .in('status', ['submitted', 'in_review', 'needs_changes', 'approved'])
    .order('submitted_at', { ascending: true, nullsFirst: false })

  const issues = [] as Array<{ scope: string; message: string; code?: string; hint?: string }>
  if (error) issues.push({ scope: 'patient_stories.select_review_queue', message: error.message, code: error.code, hint: (error as unknown as { hint?: string }).hint })

  const stories = (rows ?? []) as ReviewStoryRow[]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <WorkspaceDiagnostics issues={issues} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Story Review Queue</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Review submitted stories for privacy, consent, safety, and mission alignment.
          </p>
        </div>
        <Link href="/app/stories" className="text-sm font-semibold text-neutral-700 hover:underline">
          ← Back to My Stories
        </Link>
      </div>

      {stories.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          No stories waiting for review.
        </div>
      )}

      {stories.length > 0 && (
        <div className="space-y-3">
          {stories.map((s) => {
            const meta = PATIENT_STORY_STATUS_META[s.status]
            const tone = meta?.tone ?? 'neutral'
            const statusTone: StatusTone =
              tone === 'green' ? 'green' :
              tone === 'red' ? 'red' :
              tone === 'blue' ? 'blue' :
              tone === 'amber' ? 'amber' :
              'neutral'

            return (
              <div key={s.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-neutral-900 truncate">{s.title}</h3>
                      <StatusBadge label={meta?.label ?? s.status} tone={statusTone} />
                      <Link href={`/app/stories/${s.id}`} className="text-xs font-semibold text-orange-700 hover:underline">
                        Open →
                      </Link>
                    </div>
                    {s.summary && <p className="mt-1 text-xs text-neutral-600">{s.summary}</p>}
                    <p className="mt-2 text-[11px] text-neutral-500">
                      Updated {new Date(s.updated_at).toLocaleDateString('en-GB')}
                      {s.submitted_at ? ` · Submitted ${new Date(s.submitted_at).toLocaleDateString('en-GB')}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {/* Minimal reviewer controls (MVP) */}
                    <form action={reviewerSetStatus} className="flex items-center gap-2">
                      <input type="hidden" name="story_id" value={s.id} />
                      <select name="status" defaultValue={s.status} className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs">
                        <option value="submitted">Submitted</option>
                        <option value="in_review">In Review</option>
                        <option value="needs_changes">Needs Changes</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <input
                        name="notes"
                        className="w-48 rounded-lg border border-neutral-200 px-2 py-1 text-xs"
                        placeholder="Notes (optional)"
                      />
                      <button type="submit" className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold hover:bg-neutral-50">
                        Save
                      </button>
                    </form>

                    {s.status === 'approved' && (
                      <form action={publishStory}>
                        <input type="hidden" name="story_id" value={s.id} />
                        <button
                          type="submit"
                          className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
                        >
                          Publish
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
