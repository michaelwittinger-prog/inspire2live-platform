-- ============================================================
-- MIGRATION 00049: Communications team dashboard
--
-- Adds support for the comms team dashboard:
--   1. A `channel` discriminator on intake_items so the two
--      WhatsApp channel cards (campus / communications) are accurate.
--   2. A weekly meeting agenda table where any comms-workspace member
--      can propose an agenda item (title + short summary). The proposer
--      is the owner, and each item is a tracked task on the dashboard.
-- ============================================================

-- 1. WhatsApp channel discriminator on intake items -----------------
alter table public.intake_items
  add column if not exists channel text
  check (channel is null or channel in ('campus', 'communications'));

create index if not exists idx_intake_channel
  on public.intake_items(channel)
  where channel is not null;

-- 2. Weekly meeting agenda ------------------------------------------
create table if not exists public.comms_weekly_agenda_items (
  id uuid primary key default gen_random_uuid(),
  meeting_date date not null,
  title text not null,
  summary text,
  owner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'not_started' check (
    status in ('not_started', 'in_progress', 'completed', 'skipped')
  ),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_comms_weekly_agenda_meeting
  on public.comms_weekly_agenda_items(meeting_date desc);

create index if not exists idx_comms_weekly_agenda_owner
  on public.comms_weekly_agenda_items(owner_id)
  where owner_id is not null;

alter table public.comms_weekly_agenda_items enable row level security;

-- Any comms-workspace member (or admin) can read all agenda items and
-- create their own. Editing / removing is restricted to the owner or an
-- admin, keeping ownership accountable ("you proposed it, you own it").
drop policy if exists comms_weekly_agenda_read on public.comms_weekly_agenda_items;
create policy comms_weekly_agenda_read on public.comms_weekly_agenda_items
  for select
  using (public.is_comms_team_or_admin());

drop policy if exists comms_weekly_agenda_insert on public.comms_weekly_agenda_items;
create policy comms_weekly_agenda_insert on public.comms_weekly_agenda_items
  for insert
  with check (public.is_comms_team_or_admin() and owner_id = auth.uid());

drop policy if exists comms_weekly_agenda_update on public.comms_weekly_agenda_items;
create policy comms_weekly_agenda_update on public.comms_weekly_agenda_items
  for update
  using (public.is_comms_team_or_admin() and owner_id = auth.uid())
  with check (public.is_comms_team_or_admin() and owner_id = auth.uid());

drop policy if exists comms_weekly_agenda_delete on public.comms_weekly_agenda_items;
create policy comms_weekly_agenda_delete on public.comms_weekly_agenda_items
  for delete
  using (public.is_comms_team_or_admin() and owner_id = auth.uid());

notify pgrst, 'reload schema';
