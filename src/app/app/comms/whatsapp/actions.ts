'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canAccessCommsWorkspace } from '@/lib/comms-access'
import { sendWhatsAppMessage } from '@/lib/whatsapp-send'

export interface CommsFormState {
  ok: boolean
  message?: string
  error?: string
}

const INITIAL_STATE: CommsFormState = { ok: false }

function asText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

async function requireCommsOperator() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!profile || !canAccessCommsWorkspace(profile.role)) {
    throw new Error('Not authorized for the communications workspace')
  }

  return { user, profile }
}

export async function sendWhatsAppReply(
  _prevState: CommsFormState = INITIAL_STATE,
  formData: FormData
): Promise<CommsFormState> {
  try {
    const { user } = await requireCommsOperator()
    const recipientWhatsappId = asText(formData.get('recipient_whatsapp_id'))
    const body = asText(formData.get('body'))
    const inReplyToIntakeItemId = asText(formData.get('in_reply_to_intake_item_id')) || null

    if (!recipientWhatsappId || !body) {
      return { ok: false, error: 'A recipient and message are required.' }
    }

    const result = await sendWhatsAppMessage(recipientWhatsappId, body)
    const admin = createAdminClient()

    const { error: insertError } = await admin.from('whatsapp_outbound_messages').insert({
      recipient_whatsapp_id: recipientWhatsappId,
      body,
      sent_by: user.id,
      in_reply_to_intake_item_id: inReplyToIntakeItemId,
      graph_message_id: result.ok ? result.messageId : null,
      delivery_status: result.ok ? 'sent' : 'failed',
      error_detail: result.ok ? null : result.error,
    })

    if (insertError) throw new Error(insertError.message)

    revalidatePath('/app/comms/whatsapp')

    if (!result.ok) {
      return { ok: false, error: `Message could not be delivered: ${result.error}` }
    }

    return { ok: true, message: 'Reply sent.' }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Could not send the WhatsApp reply.' }
  }
}
