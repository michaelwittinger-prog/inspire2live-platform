'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { slugifyStoryTitle, type PatientStoryStatus } from '@/lib/patient-stories'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, userId: user.id }
}

async function requireCoordinatorOrAdmin() {
  const { supabase, userId } = await requireAuth()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  const role = profile?.role ?? ''
  if (!['HubCoordinator', 'PlatformAdmin'].includes(role)) {
    throw new Error('Not authorized — requires coordinator or admin role')
  }
  return { supabase, userId, role }
}

async function logEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  {
    storyId,
    actorId,
    action,
    notes,
  }: {
    storyId: string
    actorId: string
    action: string
    notes?: string | null
  },
) {
  try {
    await supabase.from('patient_story_events').insert({
      story_id: storyId,
      actor_id: actorId,
      action,
      notes: notes ?? null,
    })
  } catch {
    // ignore
  }
}

function asNonEmptyString(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : ''
}

function statusOrThrow(input: string): PatientStoryStatus {
  const allowed: PatientStoryStatus[] = ['draft', 'submitted', 'in_review', 'needs_changes', 'approved', 'published', 'archived', 'rejected']
  if (!allowed.includes(input as PatientStoryStatus)) throw new Error('Invalid status')
  return input as PatientStoryStatus
}

// ─────────────────────────────────────────────────────────────────────────────
// Author actions
// ─────────────────────────────────────────────────────────────────────────────

export async function createStory(formData: FormData) {
  const { supabase, userId } = await requireAuth()

  const title = asNonEmptyString(formData.get('title'))
  const summary = asNonEmptyString(formData.get('summary')) || null
  const body = asNonEmptyString(formData.get('body'))
  const tagsRaw = asNonEmptyString(formData.get('tags'))
  const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : []
  const isAnonymous = asNonEmptyString(formData.get('is_anonymous')) === 'true'
  const displayName = asNonEmptyString(formData.get('display_name')) || null
  const consentToPublish = asNonEmptyString(formData.get('consent_to_publish')) === 'true'
  const allowContact = asNonEmptyString(formData.get('allow_contact')) === 'true'

  if (!title || !body) throw new Error('Title and story body are required')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { data, error } = await sb
    .from('patient_stories')
    .insert({
      author_id: userId,
      title,
      summary,
      body,
      tags,
      is_anonymous: isAnonymous,
      display_name: isAnonymous ? null : displayName,
      consent_to_publish: consentToPublish,
      allow_contact: allowContact,
      status: 'draft',
    })
    .select('id')
    .maybeSingle()
  if (error) throw new Error(error.message)

  if (data?.id) {
    await logEvent(sb, { storyId: String(data.id), actorId: userId, action: 'created', notes: null })
  }

  revalidatePath('/app/stories')
}

export async function updateStory(formData: FormData) {
  const { supabase, userId } = await requireAuth()
  const storyId = asNonEmptyString(formData.get('story_id'))
  const title = asNonEmptyString(formData.get('title'))
  const summary = asNonEmptyString(formData.get('summary')) || null
  const body = asNonEmptyString(formData.get('body'))
  const tagsRaw = asNonEmptyString(formData.get('tags'))
  const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : []
  const isAnonymous = asNonEmptyString(formData.get('is_anonymous')) === 'true'
  const displayName = asNonEmptyString(formData.get('display_name')) || null
  const consentToPublish = asNonEmptyString(formData.get('consent_to_publish')) === 'true'
  const allowContact = asNonEmptyString(formData.get('allow_contact')) === 'true'

  if (!storyId || !title || !body) throw new Error('Story id, title, and body are required')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { error } = await sb
    .from('patient_stories')
    .update({
      title,
      summary,
      body,
      tags,
      is_anonymous: isAnonymous,
      display_name: isAnonymous ? null : displayName,
      consent_to_publish: consentToPublish,
      allow_contact: allowContact,
    })
    .eq('id', storyId)
  if (error) throw new Error(error.message)

  await logEvent(sb, { storyId, actorId: userId, action: 'updated', notes: null })
  revalidatePath('/app/stories')
  revalidatePath(`/app/stories/${storyId}`)
}

export async function submitStory(formData: FormData) {
  const { supabase, userId } = await requireAuth()
  const storyId = asNonEmptyString(formData.get('story_id'))
  if (!storyId) throw new Error('story_id required')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: row } = await sb
    .from('patient_stories')
    .select('consent_to_publish')
    .eq('id', storyId)
    .maybeSingle()
  if (!row?.consent_to_publish) {
    throw new Error('Consent to publish is required before submitting for review.')
  }

  const { error } = await sb
    .from('patient_stories')
    .update({ status: 'submitted', submitted_at: new Date().toISOString(), rejection_reason: null })
    .eq('id', storyId)
  if (error) throw new Error(error.message)

  await logEvent(sb, { storyId, actorId: userId, action: 'submitted', notes: null })
  revalidatePath('/app/stories')
  revalidatePath('/app/stories/review')
}

// ─────────────────────────────────────────────────────────────────────────────
// Reviewer actions
// ─────────────────────────────────────────────────────────────────────────────

export async function reviewerSetStatus(formData: FormData) {
  const { supabase, userId } = await requireCoordinatorOrAdmin()
  const storyId = asNonEmptyString(formData.get('story_id'))
  const status = statusOrThrow(asNonEmptyString(formData.get('status')))
  const notes = asNonEmptyString(formData.get('notes')) || null

  if (!storyId) throw new Error('story_id required')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const now = new Date().toISOString()
  const patch: Record<string, unknown> = { status, reviewer_id: userId, reviewed_at: now }
  if (status === 'needs_changes') patch.reviewer_notes = notes
  if (status === 'rejected') patch.rejection_reason = notes
  if (status === 'approved') patch.approved_at = now
  if (status === 'archived') patch.archived_at = now

  const { error } = await sb
    .from('patient_stories')
    .update(patch)
    .eq('id', storyId)
  if (error) throw new Error(error.message)

  const action =
    status === 'in_review' ? 'start_review'
      : status === 'needs_changes' ? 'request_changes'
      : status

  await logEvent(sb, { storyId, actorId: userId, action, notes })

  revalidatePath('/app/stories/review')
  revalidatePath('/app/stories')
  revalidatePath(`/app/stories/${storyId}`)
}

export async function publishStory(formData: FormData) {
  const { supabase, userId } = await requireCoordinatorOrAdmin()
  const storyId = asNonEmptyString(formData.get('story_id'))
  if (!storyId) throw new Error('story_id required')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: story } = await sb
    .from('patient_stories')
    .select('title, status')
    .eq('id', storyId)
    .maybeSingle()

  const currentStatus = (story?.status ?? '') as PatientStoryStatus
  if (!['approved', 'published'].includes(currentStatus)) {
    throw new Error('Only approved stories can be published.')
  }

  const base = slugifyStoryTitle(String(story?.title ?? 'story')) || `story-${storyId.slice(0, 8)}`

  // Try unique slugs with suffix.
  let slug = base
  for (let i = 0; i < 20; i++) {
    const suffix = i === 0 ? '' : `-${i + 1}`
    const candidate = `${base}${suffix}`

    const { data: existing } = await sb
      .from('patient_stories')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (!existing?.id || existing.id === storyId) {
      slug = candidate
      break
    }
  }

  const { error } = await sb
    .from('patient_stories')
    .update({ status: 'published', slug, published_at: new Date().toISOString(), reviewer_id: userId })
    .eq('id', storyId)
  if (error) throw new Error(error.message)

  await logEvent(sb, { storyId, actorId: userId, action: 'published', notes: null })
  revalidatePath('/stories')
  revalidatePath('/app/stories/review')
  revalidatePath('/app/stories')
  revalidatePath(`/stories/${slug}`)
}
