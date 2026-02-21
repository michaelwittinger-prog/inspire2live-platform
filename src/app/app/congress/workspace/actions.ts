'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { DEMO_CONGRESS_EVENTS } from '@/lib/demo-data'

// ─── Guard ───────────────────────────────────────────────────────────────────

async function requireCoordinator() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const role: string = profile?.role ?? ''
  if (!['PlatformAdmin', 'HubCoordinator'].includes(role)) {
    throw new Error('Not authorized — requires coordinator or admin role')
  }
  return { supabase: supabase as ReturnType<typeof createClient> extends Promise<infer T> ? T : never, userId: user.id }
}

// ─── Ensure the congress event exists in DB ──────────────────────────────────

async function ensureCongressEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  congressId: string,
) {
  // Check if event already exists
  const { data: existing } = await supabase
    .from('congress_events')
    .select('id')
    .eq('id', congressId)
    .maybeSingle()

  if (existing) return // already in DB

  // Auto-create from demo template
  const demo = DEMO_CONGRESS_EVENTS.find(e => e.id === congressId) ?? DEMO_CONGRESS_EVENTS[0]
  const { error } = await supabase.from('congress_events').insert({
    id:              congressId,
    year:            demo.year,
    title:           demo.title,
    description:     demo.description,
    location:        demo.location,
    start_date:      demo.start_date,
    end_date:        demo.end_date,
    theme_headline:  demo.theme_headline,
    status:          demo.status ?? 'planning',
    parent_event_id: null,
  })
  if (error) {
    // Ignore duplicate-key race condition
    if (!error.message?.includes('duplicate') && !error.code?.includes('23505')) {
      throw new Error(`Failed to bootstrap congress event: ${error.message}`)
    }
  }
}

// ─── Workstreams ──────────────────────────────────────────────────────────────

export async function createWorkstream(formData: FormData) {
  const { supabase } = await requireCoordinator()
  const congressId   = formData.get('congress_id') as string
  const title        = (formData.get('title') as string).trim()
  const description  = (formData.get('description') as string | null)?.trim() || null
  const ownerRole    = (formData.get('owner_role') as string | null)?.trim() || null
  const health       = (formData.get('health') as string) || 'on_track'
  const progressPct  = parseInt(formData.get('progress_pct') as string, 10) || 0
  const nextMilestone = (formData.get('next_milestone') as string | null)?.trim() || null

  if (!title || !congressId) throw new Error('Title and congress required')

  await ensureCongressEvent(supabase, congressId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('congress_workstreams')
    .insert({ congress_id: congressId, title, description, owner_role: ownerRole, health, progress_pct: progressPct, next_milestone: nextMilestone })
  if (error) throw new Error(error.message)
  revalidatePath('/app/congress/workspace/workstreams')
  revalidatePath('/app/congress/workspace/overview')
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function createTask(formData: FormData) {
  const { supabase } = await requireCoordinator()
  const congressId   = formData.get('congress_id') as string
  const title        = (formData.get('title') as string).trim()
  const status       = (formData.get('status') as string) || 'todo'
  const priority     = (formData.get('priority') as string) || 'medium'
  const lane         = (formData.get('lane') as string) || 'next'
  const dueDate      = (formData.get('due_date') as string | null)?.trim() || null
  const ownerName    = (formData.get('owner_name') as string | null)?.trim() || null
  const workstreamId = (formData.get('workstream_id') as string | null)?.trim() || null

  if (!title || !congressId) throw new Error('Title and congress required')

  await ensureCongressEvent(supabase, congressId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('congress_tasks')
    .insert({
      congress_id:   congressId,
      title,
      status,
      priority,
      lane,
      due_date:      dueDate || null,
      owner_name:    ownerName,
      workstream_id: workstreamId || null,
    })
  if (error) throw new Error(error.message)
  revalidatePath('/app/congress/workspace/tasks')
  revalidatePath('/app/congress/workspace/overview')
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function createMessage(formData: FormData) {
  const { supabase, userId } = await requireCoordinator()

  const { data: profRow } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
  const authorName = (formData.get('author_name') as string | null)?.trim() || profRow?.role || 'Unknown'

  const congressId  = formData.get('congress_id') as string
  const subject     = (formData.get('subject') as string).trim()
  const body        = (formData.get('body') as string).trim()
  const threadType  = (formData.get('thread_type') as string) || 'update'
  const labelsRaw   = (formData.get('labels') as string | null)?.trim()
  const labels      = labelsRaw ? labelsRaw.split(',').map(l => l.trim()).filter(Boolean) : []

  if (!subject || !body || !congressId) throw new Error('Subject, body, and congress required')

  await ensureCongressEvent(supabase, congressId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('congress_messages')
    .insert({ congress_id: congressId, subject, body, thread_type: threadType, author_name: authorName, labels })
  if (error) throw new Error(error.message)
  revalidatePath('/app/congress/workspace/communications')
}

// ─── Milestones ───────────────────────────────────────────────────────────────

export async function createMilestone(formData: FormData) {
  const { supabase } = await requireCoordinator()
  const congressId    = formData.get('congress_id') as string
  const title         = (formData.get('title') as string).trim()
  const milestoneDate = (formData.get('milestone_date') as string).trim()
  const status        = (formData.get('status') as string) || 'upcoming'
  const workstreamId  = (formData.get('workstream_id') as string | null)?.trim() || null

  if (!title || !milestoneDate || !congressId) throw new Error('Title, date, and congress required')

  await ensureCongressEvent(supabase, congressId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('congress_milestones')
    .insert({ congress_id: congressId, title, milestone_date: milestoneDate, status, workstream_id: workstreamId || null })
  if (error) throw new Error(error.message)
  revalidatePath('/app/congress/workspace/timeline')
}

// ─── RAID items ───────────────────────────────────────────────────────────────

export async function createRaidItem(formData: FormData) {
  const { supabase } = await requireCoordinator()
  const congressId = formData.get('congress_id') as string
  const title      = (formData.get('title') as string).trim()
  const type       = (formData.get('type') as string) || 'risk'
  const status     = (formData.get('status') as string) || 'open'
  const priority   = (formData.get('priority') as string) || 'medium'
  const ownerRole  = (formData.get('owner_role') as string | null)?.trim() || null
  const description = (formData.get('description') as string | null)?.trim() || null

  if (!title || !congressId) throw new Error('Title and congress required')

  await ensureCongressEvent(supabase, congressId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('congress_raid_items')
    .insert({ congress_id: congressId, title, type, status, priority, owner_role: ownerRole, description })
  if (error) throw new Error(error.message)
  revalidatePath('/app/congress/workspace/raid')
  revalidatePath('/app/congress/workspace/overview')
}
