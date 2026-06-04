-- MIGRATION 00047: Structured event ownership for I2L-owned events

alter table public.events
  add column if not exists owner_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_events_owner_id on public.events(owner_id);

notify pgrst, 'reload schema';
