'use server'

/**
 * Server actions for Initiative team page.
 * Handles: invite, revoke, mark-notification-read.
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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

/**
 * Send an invitation to join an initiative.
 * Expects a FormData with:
 *   initiativeId, initiativeTitle, inviteeUserId | inviteeEmail,
 *   inviteeRole, inviteeName (for email), message (optional)
 */
export async function sendInitiativeInvite(
  _prev: InviteFormState,
  formData: FormData
): Promise<InviteFormState> {
  const initiativeId    = formData.get('initiativeId') as string
  const initiativeTitle = formData.get('initiativeTitle') as string | null
  const inviteeUserId   = (formData.get('inviteeUserId') as string | null) || undefined
  const inviteeEmail    = (formData.get('inviteeEmail') as string | null) || undefined
  const inviteeRole     = (formData.get('inviteeRole') as string | null) ?? 'contributor'
  const inviteeName     = (formData.get('inviteeName') as string | null) || undefined
  const message         = (formData.get('message') as string | null) || undefined

  if (!initiativeId) return { ok: false, error: 'Missing initiative ID.' }
  if (!isUuid(initiativeId)) {
    return { ok: false, error: 'Invalid initiative ID. Open a real initiative workspace before sending invites.' }
  }

  const supabase = await createClient()

  // Get inviter's display name
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
    scope: 'initiative',
    initiativeId,
    inviteeUserId,
    inviteeEmail,
    inviteeRole,
    message,
  })

  if (!result.ok) return { ok: false, error: result.error }

  // Send email
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
      scope: 'initiative',
      targetTitle: initiativeTitle ?? 'an initiative',
      inviteeRole,
      message,
      baseUrl,
    })
    emailSent = emailResult.sent
  }

  revalidatePath(`/app/initiatives/${initiativeId}/team`)
  return { ok: true, emailSent }
}

/**
 * Revoke a pending invitation.
 */
export async function revokeInitiativeInvite(
  _prev: InviteFormState,
  formData: FormData
): Promise<InviteFormState> {
  const invitationId = formData.get('invitationId') as string
  const initiativeId = formData.get('initiativeId') as string

  if (!invitationId) return { ok: false, error: 'Missing invitation ID.' }

  const supabase = await createClient()
  const result = await revokeInvitation(supabase, invitationId)

  if (!result.ok) return { ok: false, error: result.error }

  revalidatePath(`/app/initiatives/${initiativeId}/team`)
  return { ok: true }
}
