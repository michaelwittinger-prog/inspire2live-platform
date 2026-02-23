'use server'

/**
 * Notification server actions.
 * mark-read, mark-all-read, respond to invite (accept/decline).
 */
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { respondToInvitation } from '@/lib/invitations'

export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  revalidatePath('/app/notifications')
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  revalidatePath('/app/notifications')
}

export interface InviteResponseResult {
  ok: boolean
  error?: string
}

/**
 * Accept an invitation — called from a server form action.
 * Reads invitationId from a hidden <input name="invitationId" />.
 */
export async function acceptInviteAction(formData: FormData): Promise<void> {
  const id = formData.get('invitationId') as string
  if (!id) return
  const supabase = await createClient()
  await respondToInvitation(supabase, id, 'accepted')
  revalidatePath('/app/notifications')
}

/**
 * Decline an invitation — called from a server form action.
 */
export async function declineInviteAction(formData: FormData): Promise<void> {
  const id = formData.get('invitationId') as string
  if (!id) return
  const supabase = await createClient()
  await respondToInvitation(supabase, id, 'declined')
  revalidatePath('/app/notifications')
}
