-- ============================================================
-- MIGRATION 00024: Invitation-based visibility scope
--
-- Goal:
-- - Only invited/members can SEE initiative and congress records
-- - PlatformAdmin / HubCoordinator retain full access
-- - Keep capability permissions separate from visibility scope
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1) Congress membership table (visibility scope)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.congress_members (
  id            uuid primary key default gen_random_uuid(),
  congress_id    uuid not null references public.congress_events(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  member_role    text not null default 'attendee' check (
    member_role in ('attendee', 'contributor', 'speaker', 'facilitator', 'observer')
  ),
  invite_status  text not null default 'accepted' check (
    invite_status in ('invited', 'accepted', 'declined', 'revoked')
  ),
  invited_by     uuid references public.profiles(id) on delete set null,
  invited_at     timestamptz not null default now(),
  accepted_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (congress_id, user_id)
);

create index if not exists congress_members_congress_idx on public.congress_members(congress_id);
create index if not exists congress_members_user_idx on public.congress_members(user_id);

alter table public.congress_members enable row level security;

drop policy if exists "congress_members_select" on public.congress_members;
create policy "congress_members_select" on public.congress_members
  for select using (
    user_id = auth.uid()
    or public.is_coordinator_or_admin()
  );

drop policy if exists "congress_members_manage" on public.congress_members;
create policy "congress_members_manage" on public.congress_members
  for all using (public.is_coordinator_or_admin())
  with check (public.is_coordinator_or_admin());

drop trigger if exists congress_members_set_updated_at on public.congress_members;
create trigger congress_members_set_updated_at
  before update on public.congress_members
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 2) Helper: effective congress visibility
-- ─────────────────────────────────────────────────────────────

create or replace function public.is_congress_member(event_id uuid)
returns boolean as $$
  select (
    exists (
      select 1
      from public.congress_members cm
      where cm.congress_id = event_id
        and cm.user_id = auth.uid()
        and cm.invite_status = 'accepted'
    )
    or exists (
      select 1
      from public.congress_assignments ca
      where ca.congress_id = event_id
        and ca.user_id = auth.uid()
        and ca.effective_from <= current_date
        and (ca.effective_to is null or ca.effective_to >= current_date)
    )
  );
$$ language sql security definer stable;

-- ─────────────────────────────────────────────────────────────
-- 3) Tighten initiatives visibility
-- ─────────────────────────────────────────────────────────────

drop policy if exists "initiatives_select" on public.initiatives;
create policy "initiatives_select" on public.initiatives
  for select using (
    public.is_initiative_member(id)
    or public.is_coordinator_or_admin()
  );

drop policy if exists "resources_select" on public.resources;
create policy "resources_select" on public.resources
  for select using (
    initiative_id is null
    or public.is_initiative_member(initiative_id)
    or public.is_coordinator_or_admin()
  );

-- ─────────────────────────────────────────────────────────────
-- 4) Tighten congress visibility across lifecycle + workspace
-- ─────────────────────────────────────────────────────────────

-- Backward-compatibility shim:
-- Some environments still have congress_topics.congress_id (older schema)
-- instead of congress_topics.event_id (newer schema).
-- Ensure event_id exists before creating policies that reference it.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'congress_topics'
      and column_name = 'event_id'
  ) then
    alter table public.congress_topics add column event_id uuid;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'congress_topics'
        and column_name = 'congress_id'
    ) then
      execute 'update public.congress_topics set event_id = congress_id where event_id is null';
    end if;

    alter table public.congress_topics
      add constraint congress_topics_event_id_fkey
      foreign key (event_id)
      references public.congress_events(id)
      on delete cascade;

    create index if not exists congress_topics_event_id_idx on public.congress_topics(event_id);
  end if;
end;
$$;

drop policy if exists "congress_events_select" on public.congress_events;
drop policy if exists "auth_read_congress_events" on public.congress_events;
create policy "congress_events_select" on public.congress_events
  for select using (
    public.is_congress_member(id)
    or public.is_coordinator_or_admin()
  );

drop policy if exists "congress_topics_select" on public.congress_topics;
create policy "congress_topics_select" on public.congress_topics
  for select using (
    event_id is not null
    and (
      public.is_congress_member(event_id)
      or public.is_coordinator_or_admin()
    )
  );

drop policy if exists "congress_topics_insert" on public.congress_topics;
create policy "congress_topics_insert" on public.congress_topics
  for insert with check (
    auth.uid() is not null
    and event_id is not null
    and (
      public.is_congress_member(event_id)
      or public.is_coordinator_or_admin()
    )
  );

drop policy if exists "congress_sessions_select" on public.congress_sessions;
drop policy if exists "auth_read_congress_sessions" on public.congress_sessions;
create policy "congress_sessions_select" on public.congress_sessions
  for select using (
    public.is_congress_member(event_id)
    or public.is_coordinator_or_admin()
  );

drop policy if exists "congress_decisions_select" on public.congress_decisions;
create policy "congress_decisions_select" on public.congress_decisions
  for select using (
    event_id is not null
    and (
      public.is_congress_member(event_id)
      or public.is_coordinator_or_admin()
    )
  );

drop policy if exists "auth_read_congress_themes" on public.congress_themes;
create policy "congress_themes_select" on public.congress_themes
  for select using (
    exists (
      select 1
      from public.congress_event_themes cet
      where cet.theme_id = congress_themes.id
        and (
          public.is_congress_member(cet.event_id)
          or public.is_coordinator_or_admin()
        )
    )
  );

drop policy if exists "auth_read_event_themes" on public.congress_event_themes;
create policy "congress_event_themes_select" on public.congress_event_themes
  for select using (
    public.is_congress_member(event_id)
    or public.is_coordinator_or_admin()
  );

drop policy if exists "auth_read_session_notes" on public.congress_session_notes;
create policy "congress_session_notes_select" on public.congress_session_notes
  for select using (
    exists (
      select 1
      from public.congress_sessions cs
      where cs.id = congress_session_notes.session_id
        and (
          public.is_congress_member(cs.event_id)
          or public.is_coordinator_or_admin()
        )
    )
  );

drop policy if exists "auth_read_session_attendees" on public.congress_session_attendees;
create policy "congress_session_attendees_select" on public.congress_session_attendees
  for select using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.congress_sessions cs
      where cs.id = congress_session_attendees.session_id
        and (
          public.is_congress_member(cs.event_id)
          or public.is_coordinator_or_admin()
        )
    )
  );

drop policy if exists "auth_read_public_congress_assets" on public.congress_assets;
create policy "congress_assets_select" on public.congress_assets
  for select using (
    is_public = true
    and (
      public.is_congress_member(event_id)
      or public.is_coordinator_or_admin()
    )
  );

drop policy if exists "auth_read_workstreams" on public.congress_workstreams;
create policy "congress_workstreams_select" on public.congress_workstreams
  for select using (
    public.is_congress_member(congress_id)
    or public.is_coordinator_or_admin()
  );

drop policy if exists "auth_read_milestones" on public.congress_milestones;
create policy "congress_milestones_select" on public.congress_milestones
  for select using (
    public.is_congress_member(congress_id)
    or public.is_coordinator_or_admin()
  );

drop policy if exists "auth_read_tasks" on public.congress_tasks;
create policy "congress_tasks_select" on public.congress_tasks
  for select using (
    public.is_congress_member(congress_id)
    or public.is_coordinator_or_admin()
  );

drop policy if exists "auth_read_task_deps" on public.congress_task_dependencies;
create policy "congress_task_dependencies_select" on public.congress_task_dependencies
  for select using (
    exists (
      select 1
      from public.congress_tasks ct
      where ct.id = congress_task_dependencies.task_id
        and (
          public.is_congress_member(ct.congress_id)
          or public.is_coordinator_or_admin()
        )
    )
  );

drop policy if exists "auth_read_raid" on public.congress_raid_items;
create policy "congress_raid_items_select" on public.congress_raid_items
  for select using (
    public.is_congress_member(congress_id)
    or public.is_coordinator_or_admin()
  );

drop policy if exists "auth_read_live_ops" on public.congress_live_ops_updates;
create policy "congress_live_ops_updates_select" on public.congress_live_ops_updates
  for select using (
    public.is_congress_member(congress_id)
    or public.is_coordinator_or_admin()
  );

drop policy if exists "auth_read_follow_up" on public.congress_follow_up_actions;
create policy "congress_follow_up_actions_select" on public.congress_follow_up_actions
  for select using (
    public.is_congress_member(congress_id)
    or public.is_coordinator_or_admin()
  );

drop policy if exists "auth_read_messages" on public.congress_messages;
create policy "congress_messages_select" on public.congress_messages
  for select using (
    public.is_congress_member(congress_id)
    or public.is_coordinator_or_admin()
  );

drop policy if exists "auth_read_approvals" on public.congress_approval_requests;
create policy "congress_approval_requests_select" on public.congress_approval_requests
  for select using (
    public.is_congress_member(congress_id)
    or public.is_coordinator_or_admin()
  );
