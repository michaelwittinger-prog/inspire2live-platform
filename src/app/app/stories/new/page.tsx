import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createStory } from '../actions'

export default async function NewStoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .maybeSingle()

  // Keep UI open for any authenticated user; database RLS enforces who can actually insert.
  // This avoids "blank page" for bootstrap admins / coordinators.

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">New Story</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Share your lived experience. You can save as a draft and submit when ready.
          </p>
        </div>
        <Link href="/app/stories" className="text-sm font-semibold text-neutral-700 hover:underline">
          ← Back
        </Link>
      </div>

      <form action={createStory} className="space-y-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Title</label>
            <input
              name="title"
              required
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              placeholder="e.g. What I wish I had known at diagnosis"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">Summary (optional)</label>
            <input
              name="summary"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              placeholder="1–2 lines that help readers understand the theme"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">Story</label>
            <textarea
              name="body"
              required
              rows={10}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              placeholder="Write your story. Consider: The challenge, what helped, what didn’t, and what should change."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">Tags (comma separated)</label>
            <input
              name="tags"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              placeholder="diagnosis, access, communication"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-neutral-900">Privacy & consent</p>

          <div className="flex items-start gap-2">
            <input id="anon" type="checkbox" name="is_anonymous" value="true" className="mt-1" />
            <label htmlFor="anon" className="text-sm text-neutral-700">
              Publish anonymously (your name will not be shown)
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">Display name (optional)</label>
            <input
              name="display_name"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              defaultValue={profile?.name ?? ''}
              placeholder="e.g. Maria (Patient Advocate)"
            />
            <p className="mt-1 text-[11px] text-neutral-500">
              If you publish anonymously, display name will be ignored.
            </p>
          </div>

          <div className="flex items-start gap-2">
            <input id="consent" type="checkbox" name="consent_to_publish" value="true" className="mt-1" />
            <label htmlFor="consent" className="text-sm text-neutral-700">
              I consent to publication of this story on the Inspire2Live platform.
            </label>
          </div>

          <div className="flex items-start gap-2">
            <input id="contact" type="checkbox" name="allow_contact" value="true" className="mt-1" />
            <label htmlFor="contact" className="text-sm text-neutral-700">
              I’m open to being contacted by Inspire2Live (not shown publicly).
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Create draft
          </button>
        </div>
      </form>
    </div>
  )
}
