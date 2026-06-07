-- ============================================================
-- MIGRATION 00051: WhatsApp outbound messages
--
-- Adds the missing "send" half of the WhatsApp Cloud API loop:
--   1. whatsapp_outbound_messages — records replies sent from OCI
--      back to a WhatsApp user via the Graph API (separate from
--      intake_items, whose columns are inbound-triage concepts that
--      don't apply to outbound sends).
--   2. Backfills intake_items.channel = 'communications' for rows
--      that already came in over WhatsApp but predate migration
--      00049's channel discriminator, and makes the webhook
--      processor populate it going forward (see comms-webhook.ts).
-- ============================================================

create table if not exists public.whatsapp_outbound_messages (
  id uuid primary key default gen_random_uuid(),
  recipient_whatsapp_id text not null,
  body text not null,
  sent_by uuid references public.profiles(id) on delete set null,
  in_reply_to_intake_item_id uuid references public.intake_items(id) on delete set null,
  graph_message_id text,
  delivery_status text not null default 'sent' check (delivery_status in ('sent', 'failed')),
  error_detail text,
  sent_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_outbound_recipient
  on public.whatsapp_outbound_messages(recipient_whatsapp_id, sent_at desc);

alter table public.whatsapp_outbound_messages enable row level security;

create policy whatsapp_outbound_messages_comms_access
  on public.whatsapp_outbound_messages for all
  using (public.is_comms_team_or_admin())
  with check (public.is_comms_team_or_admin());

update public.intake_items
set channel = 'communications'
where channel is null
  and sender_whatsapp_id is not null;
