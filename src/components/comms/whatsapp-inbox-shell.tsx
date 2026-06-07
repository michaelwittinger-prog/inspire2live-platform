'use client'

import { useActionState, useMemo } from 'react'
import { StatusBadge } from '@/components/ui/status-badge'
import { sendWhatsAppReply, type CommsFormState } from '@/app/app/comms/whatsapp/actions'

export type WhatsAppFeedItem = {
  id: string
  direction: 'inbound' | 'outbound'
  whatsappId: string
  displayName: string
  text: string
  timestamp: string
  status: string
  errorDetail?: string | null
}

const INITIAL_STATE: CommsFormState = { ok: false }

function formatTimestamp(input: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(input))
}

function statusTone(direction: WhatsAppFeedItem['direction'], status: string): 'neutral' | 'green' | 'amber' | 'red' | 'blue' {
  if (direction === 'outbound') return status === 'failed' ? 'red' : 'green'
  if (status === 'unreviewed') return 'amber'
  if (status === 'dismissed') return 'neutral'
  return 'blue'
}

type Conversation = {
  whatsappId: string
  displayName: string
  latestTimestamp: string
  messages: WhatsAppFeedItem[]
  lastInboundIntakeItemId: string | null
}

function groupIntoConversations(feed: WhatsAppFeedItem[]): Conversation[] {
  const byWhatsappId = new Map<string, WhatsAppFeedItem[]>()

  for (const item of feed) {
    const existing = byWhatsappId.get(item.whatsappId)
    if (existing) existing.push(item)
    else byWhatsappId.set(item.whatsappId, [item])
  }

  const conversations: Conversation[] = []
  for (const [whatsappId, items] of byWhatsappId) {
    const chronological = [...items].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    const latestInbound = [...chronological].reverse().find((item) => item.direction === 'inbound')
    const inboundDisplayName = chronological.find((item) => item.direction === 'inbound')?.displayName

    conversations.push({
      whatsappId,
      displayName: inboundDisplayName || whatsappId,
      latestTimestamp: chronological[chronological.length - 1].timestamp,
      messages: chronological,
      lastInboundIntakeItemId: latestInbound?.id ?? null,
    })
  }

  return conversations.sort((a, b) => new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime())
}

function ReplyForm({ whatsappId, inReplyToIntakeItemId }: { whatsappId: string; inReplyToIntakeItemId: string | null }) {
  const [state, formAction, pending] = useActionState(sendWhatsAppReply, INITIAL_STATE)

  return (
    <form action={formAction} className="space-y-2 border-t border-neutral-100 pt-3">
      <input type="hidden" name="recipient_whatsapp_id" value={whatsappId} />
      {inReplyToIntakeItemId && <input type="hidden" name="in_reply_to_intake_item_id" value={inReplyToIntakeItemId} />}
      <textarea
        name="body"
        rows={2}
        placeholder={`Reply to ${whatsappId}…`}
        required
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 outline-none focus:ring-2 focus:ring-orange-300"
      />
      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-orange-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
        >
          {pending ? 'Sending…' : 'Send'}
        </button>
        {(state.error || state.message) && (
          <p className={`text-xs ${state.ok ? 'text-emerald-700' : 'text-red-700'}`}>
            {state.ok ? state.message : state.error}
          </p>
        )}
      </div>
    </form>
  )
}

function FeedMessage({ item }: { item: WhatsAppFeedItem }) {
  const isOutbound = item.direction === 'outbound'

  return (
    <div className={['rounded-xl border px-4 py-3', isOutbound ? 'border-orange-200 bg-orange-50' : 'border-neutral-200 bg-white'].join(' ')}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={isOutbound ? 'OCI reply' : item.displayName} tone={isOutbound ? 'neutral' : 'blue'} />
        <StatusBadge label={item.status.replace(/_/g, ' ')} tone={statusTone(item.direction, item.status)} />
        <span className="text-xs text-neutral-500">{formatTimestamp(item.timestamp)}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">{item.text}</p>
      {item.errorDetail && <p className="mt-1 text-xs text-red-700">Delivery error: {item.errorDetail}</p>}
    </div>
  )
}

export function WhatsAppInboxShell({ feed }: { feed: WhatsAppFeedItem[] }) {
  const conversations = useMemo(() => groupIntoConversations(feed), [feed])

  if (conversations.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
        No WhatsApp messages yet. Incoming messages will appear here once the webhook receives them.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-neutral-900">WhatsApp inbox</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Incoming WhatsApp messages and OCI replies, grouped by conversation. Replies are sent live via the WhatsApp Cloud API.
        </p>
      </header>

      <div className="space-y-4">
        {conversations.map((conversation) => (
          <article key={conversation.whatsappId} className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <header className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-neutral-900">{conversation.displayName}</h2>
              <span className="text-xs text-neutral-500">{conversation.whatsappId}</span>
            </header>

            <div className="space-y-2">
              {conversation.messages.map((item) => (
                <FeedMessage key={`${item.direction}-${item.id}`} item={item} />
              ))}
            </div>

            <ReplyForm whatsappId={conversation.whatsappId} inReplyToIntakeItemId={conversation.lastInboundIntakeItemId} />
          </article>
        ))}
      </div>
    </div>
  )
}
