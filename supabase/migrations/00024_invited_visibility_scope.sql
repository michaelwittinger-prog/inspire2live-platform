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

-- Backward-compatibility shim:
-- Some environments still have congress_sessions.congress_id (older schema)
-- instead of congress_sessions.event_id (newer schema).
-- Ensure event_id exists before creating policies that reference it.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'congress_sessions'
      and column_name = 'event_id'
  ) then
    alter table public.congress_sessions add column event_id uuid;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'congress_sessions'
        and column_name = 'congress_id'
    ) then
      execute 'update public.congress_sessions set event_id = congress_id where event_id is null';
    end if;

    alter table public.congress_sessions
      add constraint congress_sessions_event_id_fkey
      foreign key (event_id)
      references public.congress_events(id)
      on delete cascade;

    create index if not exists congress_sessions_event_id_idx on public.congress_sessions(event_id);
  end if;
end;
$$;

-- Backward-compatibility shim:
-- Some environments still have congress_decisions without event_id.
-- Ensure event_id exists before creating policies that reference it.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'congress_decisions'
      and column_name = 'event_id'
  ) then
    alter table public.congress_decisions add column event_id uuid;

    -- Best-effort backfill through session linkage if present.
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'congress_decisions'
        and column_name = 'session_id'
    ) then
      if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'congress_sessions'
          and column_name = 'event_id'
      ) then
        execute '
          update public.congress_decisions cd
          set event_id = cs.event_id
          from public.congress_sessions cs
          where cd.session_id = cs.id
            and cd.event_id is null
            and cs.event_id is not null
        ';
      elsif exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'congress_sessions'
          and column_name = 'congress_id'
      ) then
        execute '
          update public.congress_decisions cd
          set event_id = cs.congress_id
          from public.congress_sessions cs
          where cd.session_id = cs.id
            and cd.event_id is null
            and cs.congress_id is not null
        ';
      end if;
    end if;

    alter table public.congress_decisions
      add constraint congress_decisions_event_id_fkey
      foreign key (event_id)
      references public.congress_events(id)
      on delete cascade;

    create index if not exists congress_decisions_event_id_idx on public.congress_decisions(event_id);
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
