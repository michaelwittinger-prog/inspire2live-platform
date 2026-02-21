import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/status-badge'
import type { StatusTone } from '@/components/ui/status-badge'
import { PATIENT_STORY_STATUS_META, type PatientStoryStatus } from '@/lib/patient-stories'
import { WorkspaceDiagnostics } from '@/components/congress/workspace/workspace-diagnostics'
import { submitStory, updateStory } from '../actions'

type StoryRow = {
  id: string
  author_id: string
  title: string
  summary: string | null
  body: string
  status: PatientStoryStatus
  tags: string[]
  is_anonymous: boolean
  display_name: string | null
  consent_to_publish: boolean
  allow_contact: boolean
  reviewer_notes: string | null
  rejection_reason: string | null
  slug: string | null
  updated_at: string
}

export default async function StoryEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

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
  const { data: row, error } = await sb
    .from('patient_stories')
    .select('id, author_id, title, summary, body, status, tags, is_anonymous, display_name, consent_to_publish, allow_contact, reviewer_notes, rejection_reason, slug, updated_at')
    .eq('id', id)
    .maybeSingle()

  const issues = [] as Array<{ scope: string; message: string; code?: string; hint?: string }>
  if (error) issues.push({ scope: 'patient_stories.select_one', message: error.message, code: error.code, hint: (error as unknown as { hint?: string }).hint })

  const story = row as StoryRow | null
  if (!story) {
    return (
      <div className="mx-auto max-w-3xl">
        <WorkspaceDiagnostics issues={issues} />
        <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          Story not found or not accessible.
        </div>
      </div>
    )
  }

  const isAuthor = story.author_id === user.id
  if (!isAuthor && !canReview) redirect('/app/stories')

  const meta = PATIENT_STORY_STATUS_META[story.status]
  const tone = meta?.tone ?? 'neutral'
  const statusTone: StatusTone =
    tone === 'green' ? 'green' :
    tone === 'red' ? 'red' :
    tone === 'blue' ? 'blue' :
    tone === 'amber' ? 'amber' :
    'neutral'

  const editableByAuthor = isAuthor && ['draft', 'needs_changes', 'rejected'].includes(story.status)
  const publicUrl = story.slug ? `/stories/${story.slug}` : null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <WorkspaceDiagnostics issues={issues} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-900">Story</h1>
            <StatusBadge label={meta?.label ?? story.status} tone={statusTone} />
            {publicUrl && (
              <Link href={publicUrl} className="text-sm font-semibold text-orange-700 hover:underline">
                View public →
              </Link>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-600">
            Updated {new Date(story.updated_at).toLocaleDateString('en-GB')}
          </p>
        </div>
        <Link href="/app/stories" className="text-sm font-semibold text-neutral-700 hover:underline">
          ← Back
        </Link>
      </div>

      {(story.reviewer_notes || story.rejection_reason) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-semibold text-amber-900">Reviewer feedback</p>
          {story.reviewer_notes && (
            <p className="mt-1 text-amber-900">{story.reviewer_notes}</p>
          )}
          {story.rejection_reason && (
            <p className="mt-1 text-amber-900">{story.rejection_reason}</p>
          )}
        </div>
      )}

      <form action={updateStory} className="space-y-4">
        <input type="hidden" name="story_id" value={story.id} />

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Title</label>
            <input
              name="title"
              required
              defaultValue={story.title}
              disabled={!editableByAuthor}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">Summary (optional)</label>
            <input
              name="summary"
              defaultValue={story.summary ?? ''}
              disabled={!editableByAuthor}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">Story</label>
            <textarea
              name="body"
              required
              rows={12}
              defaultValue={story.body}
              disabled={!editableByAuthor}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">Tags (comma separated)</label>
            <input
              name="tags"
              defaultValue={(story.tags ?? []).join(', ')}
              disabled={!editableByAuthor}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-50"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-neutral-900">Privacy & consent</p>

          <div className="flex items-start gap-2">
            <input
              id="anon"
              type="checkbox"
              name="is_anonymous"
              value="true"
              defaultChecked={story.is_anonymous}
              disabled={!editableByAuthor}
              className="mt-1"
            />
            <label htmlFor="anon" className="text-sm text-neutral-700">
              Publish anonymously
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">Display name (optional)</label>
            <input
              name="display_name"
              defaultValue={story.display_name ?? ''}
              disabled={!editableByAuthor}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-50"
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              id="consent"
              type="checkbox"
              name="consent_to_publish"
              value="true"
              defaultChecked={story.consent_to_publish}
              disabled={!editableByAuthor}
              className="mt-1"
            />
            <label htmlFor="consent" className="text-sm text-neutral-700">
              I consent to publication of this story.
            </label>
          </div>

          <div className="flex items-start gap-2">
            <input
              id="contact"
              type="checkbox"
              name="allow_contact"
              value="true"
              defaultChecked={story.allow_contact}
              disabled={!editableByAuthor}
              className="mt-1"
            />
            <label htmlFor="contact" className="text-sm text-neutral-700">
              I’m open to being contacted by Inspire2Live.
            </label>
          </div>
        </div>

        {editableByAuthor && (
          <div className="flex items-center justify-between gap-3">
            <button
              type="submit"
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              Save changes
            </button>

            {story.status !== 'submitted' && (
              <div>
                <button
                  form="submit-story-form"
                  type="submit"
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  Submit for review
                </button>
              </div>
            )}
          </div>
        )}

        {!editableByAuthor && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
            This story is locked while it is in workflow. If you need changes, wait for reviewer feedback.
          </div>
        )}
      </form>

      {/* separate form to avoid nested <form> */}
      <form id="submit-story-form" action={submitStory}>
        <input type="hidden" name="story_id" value={story.id} />
      </form>
    </div>
  )
}
