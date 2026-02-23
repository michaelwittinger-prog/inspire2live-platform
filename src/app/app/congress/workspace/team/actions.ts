'use server'

/**
 * Server actions for Congress workspace team page.
 * Handles: invite, revoke.
 */
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createInvitation, revokeInvitation } from '@/lib/invitations'
import { sendInviteEmail } from '@/lib/invitation-email'

export interface InviteFormState {
  ok: boolean
  error?: string
  emailSent?: boolean
}

export async function sendCongressInvite(
  _prev: InviteFormState,
  formData: FormData
): Promise<InviteFormState> {
  const congressId    = formData.get('congressId') as string
  const congressTitle = formData.get('congressTitle') as string | null
  const inviteeUserId = (formData.get('inviteeUserId') as string | null) || undefined
  const inviteeEmail  = (formData.get('inviteeEmail') as string | null) || undefined
  const inviteeRole   = (formData.get('inviteeRole') as string | null) ?? 'attendee'
  const inviteeName   = (formData.get('inviteeName') as string | null) || undefined
  const message       = (formData.get('message') as string | null) || undefined

  if (!congressId) return { ok: false, error: 'Missing congress ID.' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: inviterProfile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', user?.id ?? '')
    .maybeSingle()
  const inviterName = (inviterProfile as unknown as { name?: string; email?: string } | null)?.name
    ?? inviterProfile?.email
    ?? 'A platform member'

  const result = await createInvitation(supabase, {
    scope: 'congress',
    congressId,
    inviteeUserId,
    inviteeEmail,
    inviteeRole,
    message,
  })

  if (!result.ok) return { ok: false, error: result.error }

  let emailSent = false
  const emailTarget = inviteeEmail ?? ''
  if (emailTarget && result.invitationId) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.inspire2live.org'
    const emailResult = await sendInviteEmail({
      supabase,
      invitationId: result.invitationId,
      recipientEmail: emailTarget,
      recipientName: inviteeName,
      inviterName,
      scope: 'congress',
      targetTitle: congressTitle ?? 'a congress',
      inviteeRole,
      message,
      baseUrl,
    })
    emailSent = emailResult.sent
  }

  revalidatePath('/app/congress/workspace/team')
  return { ok: true, emailSent }
}

export async function revokeCongressInvite(
  _prev: InviteFormState,
  formData: FormData
): Promise<InviteFormState> {
  const invitationId = formData.get('invitationId') as string
  if (!invitationId) return { ok: false, error: 'Missing invitation ID.' }

  const supabase = await createClient()
  const result = await revokeInvitation(supabase, invitationId)

  if (!result.ok) return { ok: false, error: result.error }

  revalidatePath('/app/congress/workspace/team')
  return { ok: true }
}
