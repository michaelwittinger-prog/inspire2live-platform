'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const role: string = profile?.role ?? ''
  if (role !== 'PlatformAdmin') {
    throw new Error('Not authorized — requires PlatformAdmin')
  }
  return { supabase: supabase as ReturnType<typeof createClient> extends Promise<infer T> ? T : never, userId: user.id }
}

// ─── Activity log helper ─────────────────────────────────────────────────────

async function logActivity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  {
    congressId,
    actorId,
    action,
    entityType,
    entityId,
    entityTitle,
  }: {
    congressId: string
    actorId: string
    action: string
    entityType?: string
    entityId?: string
    entityTitle?: string
  },
) {
  // Best-effort logging: never fail the primary write due to logging.
  try {
    await supabase
      .from('congress_activity_log')
      .insert({
        congress_id: congressId,
        actor_id: actorId,
        action,
        entity_type: entityType ?? null,
        entity_id: entityId ?? null,
        entity_title: entityTitle ?? null,
      })
  } catch {
    // ignore
  }
}

// NOTE: We intentionally do NOT auto-create congress_events from demo templates.
// Rationale: prod/staging schema can drift (e.g. missing `title`), and writing demo-shaped
// rows can fail or create inconsistent data. Workspace UI should surface missing data
// clearly and require an admin to create the event explicitly.

// ─── Workstreams ──────────────────────────────────────────────────────────────

export async function createWorkstream(formData: FormData) {
  const { supabase, userId } = await requireCoordinator()
  const congressId   = formData.get('congress_id') as string
  const title        = (formData.get('title') as string).trim()
  const description  = (formData.get('description') as string | null)?.trim() || null
  const ownerRole    = (formData.get('owner_role') as string | null)?.trim() || null
  const health       = (formData.get('health') as string) || 'on_track'
  const progressPct  = parseInt(formData.get('progress_pct') as string, 10) || 0
  const nextMilestone = (formData.get('next_milestone') as string | null)?.trim() || null

  if (!title || !congressId) throw new Error('Title and congress required')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error, data } = await (supabase as any)
    .from('congress_workstreams')
    .insert({ congress_id: congressId, title, description, owner_role: ownerRole, health, progress_pct: progressPct, next_milestone: nextMilestone })
    .select('id')
    .maybeSingle()
  if (error) throw new Error(error.message)

  await logActivity(supabase, {
    congressId,
    actorId: userId,
    action: 'created_workstream',
    entityType: 'congress_workstreams',
    entityId: data?.id ? String(data.id) : undefined,
    entityTitle: title,
  })

  revalidatePath('/app/congress/workspace/workstreams')
  revalidatePath('/app/congress/workspace/overview')
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function createTask(formData: FormData) {
  const { supabase, userId } = await requireCoordinator()
  const congressId   = formData.get('congress_id') as string
  const title        = (formData.get('title') as string).trim()
  const status       = (formData.get('status') as string) || 'todo'
  const priority     = (formData.get('priority') as string) || 'medium'
  const lane         = (formData.get('lane') as string) || 'next'
  const dueDate      = (formData.get('due_date') as string | null)?.trim() || null
  const ownerName    = (formData.get('owner_name') as string | null)?.trim() || null
  const workstreamId = (formData.get('workstream_id') as string | null)?.trim() || null

  if (!title || !congressId) throw new Error('Title and congress required')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error, data } = await (supabase as any)
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
    .select('id')
    .maybeSingle()
  if (error) throw new Error(error.message)

  await logActivity(supabase, {
    congressId,
    actorId: userId,
    action: 'created_task',
    entityType: 'congress_tasks',
    entityId: data?.id ? String(data.id) : undefined,
    entityTitle: title,
  })

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error, data } = await (supabase as any)
    .from('congress_messages')
    .insert({ congress_id: congressId, subject, body, thread_type: threadType, author_name: authorName, labels })
    .select('id')
    .maybeSingle()
  if (error) throw new Error(error.message)

  await logActivity(supabase, {
    congressId,
    actorId: userId,
    action: 'created_message',
    entityType: 'congress_messages',
    entityId: data?.id ? String(data.id) : undefined,
    entityTitle: subject,
  })

  revalidatePath('/app/congress/workspace/communications')
}

// ─── Milestones ───────────────────────────────────────────────────────────────

export async function createMilestone(formData: FormData) {
  const { supabase, userId } = await requireCoordinator()
  const congressId    = formData.get('congress_id') as string
  const title         = (formData.get('title') as string).trim()
  const milestoneDate = (formData.get('milestone_date') as string).trim()
  const status        = (formData.get('status') as string) || 'upcoming'
  const workstreamId  = (formData.get('workstream_id') as string | null)?.trim() || null

  if (!title || !milestoneDate || !congressId) throw new Error('Title, date, and congress required')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error, data } = await (supabase as any)
    .from('congress_milestones')
    .insert({ congress_id: congressId, title, milestone_date: milestoneDate, status, workstream_id: workstreamId || null })
    .select('id')
    .maybeSingle()
  if (error) throw new Error(error.message)

  await logActivity(supabase, {
    congressId,
    actorId: userId,
    action: 'created_milestone',
    entityType: 'congress_milestones',
    entityId: data?.id ? String(data.id) : undefined,
    entityTitle: title,
  })

  revalidatePath('/app/congress/workspace/timeline')
}

// ─── RAID items ───────────────────────────────────────────────────────────────

export async function createRaidItem(formData: FormData) {
  const { supabase, userId } = await requireCoordinator()
  const congressId = formData.get('congress_id') as string
  const title      = (formData.get('title') as string).trim()
  const type       = (formData.get('type') as string) || 'risk'
  const status     = (formData.get('status') as string) || 'open'
  const priority   = (formData.get('priority') as string) || 'medium'
  const ownerRole  = (formData.get('owner_role') as string | null)?.trim() || null
  const description = (formData.get('description') as string | null)?.trim() || null

  if (!title || !congressId) throw new Error('Title and congress required')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error, data } = await (supabase as any)
    .from('congress_raid_items')
    .insert({ congress_id: congressId, title, type, status, priority, owner_role: ownerRole, description })
    .select('id')
    .maybeSingle()
  if (error) throw new Error(error.message)

  await logActivity(supabase, {
    congressId,
    actorId: userId,
    action: 'created_raid_item',
    entityType: 'congress_raid_items',
    entityId: data?.id ? String(data.id) : undefined,
    entityTitle: title,
  })

  revalidatePath('/app/congress/workspace/raid')
  revalidatePath('/app/congress/workspace/overview')
}

// ─── Live Ops ───────────────────────────────────────────────────────────────

export async function createLiveOpsUpdate(formData: FormData) {
  const { supabase, userId } = await requireCoordinator()
  const congressId  = formData.get('congress_id') as string
  const title       = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const status      = (formData.get('status') as string) || 'open'
  const severity    = (formData.get('severity') as string) || 'sev3'

  if (!title || !congressId) throw new Error('Title and congress required')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error, data } = await (supabase as any)
    .from('congress_live_ops_updates')
    .insert({ congress_id: congressId, title, description, status, severity })
    .select('id')
    .maybeSingle()
  if (error) throw new Error(error.message)

  await logActivity(supabase, {
    congressId,
    actorId: userId,
    action: 'created_live_ops_update',
    entityType: 'congress_live_ops_updates',
    entityId: data?.id ? String(data.id) : undefined,
    entityTitle: title,
  })

  revalidatePath('/app/congress/workspace/live-ops')
  revalidatePath('/app/congress/workspace/overview')
}

// ─── Follow-up actions ──────────────────────────────────────────────────────

export async function createFollowUpAction(formData: FormData) {
  const { supabase, userId } = await requireCoordinator()
  const congressId  = formData.get('congress_id') as string
  const title       = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const status      = (formData.get('status') as string) || 'todo'
  const priority    = (formData.get('priority') as string) || 'medium'
  const ownerName   = (formData.get('owner_name') as string | null)?.trim() || null
  const dueDate     = (formData.get('due_date') as string | null)?.trim() || null

  if (!title || !congressId) throw new Error('Title and congress required')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error, data } = await (supabase as any)
    .from('congress_follow_up_actions')
    .insert({
      congress_id: congressId,
      title,
      description,
      status,
      priority,
      owner_name: ownerName,
      due_date: dueDate || null,
    })
    .select('id')
    .maybeSingle()
  if (error) throw new Error(error.message)

  await logActivity(supabase, {
    congressId,
    actorId: userId,
    action: 'created_follow_up_action',
    entityType: 'congress_follow_up_actions',
    entityId: data?.id ? String(data.id) : undefined,
    entityTitle: title,
  })

  revalidatePath('/app/congress/workspace/follow-up')
  revalidatePath('/app/congress/workspace/overview')
}

// ─── Approvals ──────────────────────────────────────────────────────────────

export async function createApprovalRequest(formData: FormData) {
  const { supabase, userId } = await requireCoordinator()
  const congressId  = formData.get('congress_id') as string
  const title       = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const requestedByName = (formData.get('requested_by_name') as string | null)?.trim() || null

  if (!title || !congressId) throw new Error('Title and congress required')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error, data } = await (supabase as any)
    .from('congress_approval_requests')
    .insert({
      congress_id: congressId,
      title,
      description,
      requested_by_name: requestedByName,
      status: 'submitted',
    })
    .select('id')
    .maybeSingle()
  if (error) throw new Error(error.message)

  await logActivity(supabase, {
    congressId,
    actorId: userId,
    action: 'created_approval_request',
    entityType: 'congress_approval_requests',
    entityId: data?.id ? String(data.id) : undefined,
    entityTitle: title,
  })

  revalidatePath('/app/congress/workspace/approvals')
  revalidatePath('/app/congress/workspace/overview')
}

// ─── Status transition actions ──────────────────────────────────────────────

export async function updateTaskStatus(formData: FormData) {
  const { supabase, userId } = await requireCoordinator()
  const taskId = (formData.get('task_id') as string).trim()
  const status = (formData.get('status') as string).trim()
  const congressId = (formData.get('congress_id') as string).trim()

  if (!taskId || !status) throw new Error('Task id + status required')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('congress_tasks')
    .update({ status })
    .eq('id', taskId)

  if (error) throw new Error(error.message)

  if (congressId) {
    await logActivity(supabase, {
      congressId,
      actorId: userId,
      action: 'updated_task_status',
      entityType: 'congress_tasks',
      entityId: taskId,
      entityTitle: `status=${status}`,
    })
  }

  revalidatePath('/app/congress/workspace/tasks')
  revalidatePath('/app/congress/workspace/overview')
}

export async function updateRaidItemStatus(formData: FormData) {
  const { supabase, userId } = await requireCoordinator()
  const raidId = (formData.get('raid_id') as string).trim()
  const status = (formData.get('status') as string).trim()
  const congressId = (formData.get('congress_id') as string).trim()

  if (!raidId || !status) throw new Error('RAID id + status required')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('congress_raid_items')
    .update({ status })
    .eq('id', raidId)

  if (error) throw new Error(error.message)

  if (congressId) {
    await logActivity(supabase, {
      congressId,
      actorId: userId,
      action: 'updated_raid_status',
      entityType: 'congress_raid_items',
      entityId: raidId,
      entityTitle: `status=${status}`,
    })
  }

  revalidatePath('/app/congress/workspace/raid')
  revalidatePath('/app/congress/workspace/overview')
}

export async function updateApprovalStatus(formData: FormData) {
  const { supabase, userId } = await requireCoordinator()
  const approvalId = (formData.get('approval_id') as string).trim()
  const status = (formData.get('status') as string).trim()
  const congressId = (formData.get('congress_id') as string).trim()

  if (!approvalId || !status) throw new Error('Approval id + status required')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('congress_approval_requests')
    .update({ status })
    .eq('id', approvalId)
  if (error) throw new Error(error.message)

  if (congressId) {
    await logActivity(supabase, {
      congressId,
      actorId: userId,
      action: 'updated_approval_status',
      entityType: 'congress_approval_requests',
      entityId: approvalId,
      entityTitle: `status=${status}`,
    })
  }

  revalidatePath('/app/congress/workspace/approvals')
  revalidatePath('/app/congress/workspace/overview')
}

export async function updateLiveOpsStatus(formData: FormData) {
  const { supabase, userId } = await requireCoordinator()
  const incidentId = (formData.get('incident_id') as string).trim()
  const status = (formData.get('status') as string).trim()
  const congressId = (formData.get('congress_id') as string).trim()

  if (!incidentId || !status) throw new Error('Incident id + status required')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('congress_live_ops_updates')
    .update({
      status,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    })
    .eq('id', incidentId)
  if (error) throw new Error(error.message)

  if (congressId) {
    await logActivity(supabase, {
      congressId,
      actorId: userId,
      action: 'updated_live_ops_status',
      entityType: 'congress_live_ops_updates',
      entityId: incidentId,
      entityTitle: `status=${status}`,
    })
  }

  revalidatePath('/app/congress/workspace/live-ops')
  revalidatePath('/app/congress/workspace/overview')
}

// ─── Congress stage transitions ───────────────────────────────────────────

export async function updateCongressStatus(formData: FormData) {
  const { supabase, userId } = await requireAdmin()
  const congressId = (formData.get('congress_id') as string | null)?.trim() || ''
  const status = (formData.get('status') as string | null)?.trim() || ''

  if (!congressId || !status) throw new Error('congress_id + status required')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('congress_events')
    .update({ status })
    .eq('id', congressId)

  if (error) throw new Error(error.message)

  await logActivity(supabase, {
    congressId,
    actorId: userId,
    action: 'updated_congress_status',
    entityType: 'congress_events',
    entityId: congressId,
    entityTitle: `status=${status}`,
  })

  revalidatePath('/app/congress/workspace/overview')
}
