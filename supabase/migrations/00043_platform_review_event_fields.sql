-- MIGRATION 00043: Platform review event detail fields

alter table public.events
  add column if not exists attendance_kind text not null default 'visitor',
  add column if not exists presentation_summary text,
  add column if not exists presentation_asset_url text,
  add column if not exists event_image_url text,
  add column if not exists event_website_url text,
  add column if not exists push_to_group_calendar boolean not null default false;

alter table public.events
  drop constraint if exists events_attendance_kind_check;

alter table public.events
  add constraint events_attendance_kind_check
  check (attendance_kind in ('visitor', 'presenter', 'chair', 'organiser', 'sponsor', 'speaker'));

notify pgrst, 'reload schema';
