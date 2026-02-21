import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/status-badge'
import type { StatusTone } from '@/components/ui/status-badge'
import { PATIENT_STORY_STATUS_META, type PatientStoryStatus } from '@/lib/patient-stories'
import { WorkspaceDiagnostics } from '@/components/congress/workspace/workspace-diagnostics'

type StoryRow = {
  id: string
  title: string
  summary: string | null
  status: PatientStoryStatus
  updated_at: string
  published_at: string | null
  slug: string | null
}

export default async function MyStoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role ?? 'PatientAdvocate'
  const canReview = ['HubCoordinator', 'PlatformAdmin'].includes(role)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { data: rows, error } = await sb
    .from('patient_stories')
    .select('id, title, summary, status, updated_at, published_at, slug')
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false })

  const issues = [] as Array<{ scope: string; message: string; code?: string; hint?: string }>
  if (error) issues.push({ scope: 'patient_stories.select_my', message: error.message, code: error.code, hint: (error as unknown as { hint?: string }).hint })

  const stories = (rows ?? []) as StoryRow[]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <WorkspaceDiagnostics issues={issues} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Stories</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Your lived-experience narratives. Draft privately, submit for review, and publish when approved.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canReview && (
            <Link
              href="/app/stories/review"
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              Review Queue
            </Link>
          )}
          <Link
            href="/app/stories/new"
            className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            + New Story
          </Link>
        </div>
      </div>

      {stories.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          No stories yet. Create your first draft.
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
            const publicUrl = s.slug ? `/stories/${s.slug}` : null
            return (
              <div key={s.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-neutral-900 truncate">{s.title}</h3>
                      <StatusBadge label={meta?.label ?? s.status} tone={statusTone} />
                      {publicUrl && (
                        <Link href={publicUrl} className="text-xs font-semibold text-orange-700 hover:underline">
                          Public →
                        </Link>
                      )}
                    </div>
                    {s.summary && <p className="mt-1 text-xs text-neutral-600">{s.summary}</p>}
                    <p className="mt-2 text-[11px] text-neutral-500">
                      Updated {new Date(s.updated_at).toLocaleDateString('en-GB')}
                      {s.published_at ? ` · Published ${new Date(s.published_at).toLocaleDateString('en-GB')}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/app/stories/${s.id}`}
                      className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
                    >
                      Open
                    </Link>
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
