-- ============================================================
-- MIGRATION 00025: Invitation system
--
-- Adds:
--   1. invitations          — unified invite record (initiative or congress)
--   2. initiative_members   — initiative membership (mirrors congress_members)
--   3. email_log            — audit log of outbound invite emails
--   4. RLS policies for all three tables
--   5. Helper functions: is_initiative_member(), can_invite()
--   6. Notification trigger on new invite
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1) invitations
-- ─────────────────────────────────────────────────────────────

create table if not exists public.invitations (
  id              uuid primary key default gen_random_uuid(),

  -- scope: either 'initiative' or 'congress'
  scope           text not null check (scope in ('initiative', 'congress')),

  -- scoped target
  initiative_id   uuid references public.initiatives(id) on delete cascade,
  congress_id     uuid references public.congress_events(id) on delete cascade,

  -- invitee: either an existing user_id OR an external email
  invitee_user_id uuid references public.profiles(id) on delete cascade,
  invitee_email   text,

  -- role the invitee will have
  invitee_role    text not null default 'contributor',

  -- optional personal message
  message         text,

  -- lifecycle
  status          text not null default 'invited' check (
    status in ('invited', 'accepted', 'declined', 'revoked')
  ),

  -- who sent it
  invited_by      uuid not null references public.profiles(id) on delete cascade,
  invited_at      timestamptz not null default now(),
  responded_at    timestamptz,

  -- token for email-link acceptance (external users)
  token           uuid not null default gen_random_uuid(),

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- at least one of user_id or email must be set
  constraint invitations_must_have_invitee
    check (invitee_user_id is not null or invitee_email is not null),

  -- scoped uniqueness: one active invite per invitee per target
  constraint invitations_unique_active_user
    unique nulls not distinct (scope, initiative_id, congress_id, invitee_user_id),
  constraint invitations_unique_active_email
    unique nulls not distinct (scope, initiative_id, congress_id, invitee_email)
);

create index if not exists invitations_invitee_user_idx  on public.invitations(invitee_user_id);
create index if not exists invitations_invitee_email_idx on public.invitations(invitee_email);
create index if not exists invitations_initiative_idx    on public.invitations(initiative_id);
create index if not exists invitations_congress_idx      on public.invitations(congress_id);
create index if not exists invitations_status_idx        on public.invitations(status);
create index if not exists invitations_token_idx         on public.invitations(token);

alter table public.invitations enable row level security;

-- invitees can see their own invitations
drop policy if exists "invitations_select_own" on public.invitations;
create policy "invitations_select_own" on public.invitations
  for select using (
    invitee_user_id = auth.uid()
    or invited_by = auth.uid()
    or public.is_coordinator_or_admin()
  );

-- only HubCoordinator and PlatformAdmin can create / revoke
drop policy if exists "invitations_insert" on public.invitations;
create policy "invitations_insert" on public.invitations
  for insert with check (
    auth.uid() is not null
    and public.is_coordinator_or_admin()
  );

drop policy if exists "invitations_update" on public.invitations;
create policy "invitations_update" on public.invitations
  for update using (
    -- invitee can accept/decline their own
    invitee_user_id = auth.uid()
    or public.is_coordinator_or_admin()
  );

drop trigger if exists invitations_set_updated_at on public.invitations;
create trigger invitations_set_updated_at
  before update on public.invitations
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 2) initiative_members (mirrors congress_members pattern)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.initiative_members (
  id              uuid primary key default gen_random_uuid(),
  initiative_id   uuid not null references public.initiatives(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  member_role     text not null default 'contributor' check (
    member_role in ('lead', 'contributor', 'reviewer', 'observer')
  ),
  invite_status   text not null default 'accepted' check (
    invite_status in ('invited', 'accepted', 'declined', 'revoked')
  ),
  invited_by      uuid references public.profiles(id) on delete set null,
  invited_at      timestamptz not null default now(),
  accepted_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (initiative_id, user_id)
);

create index if not exists initiative_members_initiative_idx on public.initiative_members(initiative_id);
create index if not exists initiative_members_user_idx       on public.initiative_members(user_id);

-- Backward-compatibility shim:
-- initiative_members may already exist from older schema versions.
-- Ensure required invitation-era columns are present.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'initiative_members' and column_name = 'member_role'
  ) then
    alter table public.initiative_members add column member_role text;
    update public.initiative_members set member_role = coalesce(member_role, 'contributor');
    alter table public.initiative_members alter column member_role set default 'contributor';
    alter table public.initiative_members alter column member_role set not null;
    alter table public.initiative_members
      add constraint initiative_members_member_role_check
      check (member_role in ('lead', 'contributor', 'reviewer', 'observer'));
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'initiative_members' and column_name = 'invite_status'
  ) then
    alter table public.initiative_members add column invite_status text;
    update public.initiative_members set invite_status = coalesce(invite_status, 'accepted');
    alter table public.initiative_members alter column invite_status set default 'accepted';
    alter table public.initiative_members alter column invite_status set not null;
    alter table public.initiative_members
      add constraint initiative_members_invite_status_check
      check (invite_status in ('invited', 'accepted', 'declined', 'revoked'));
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'initiative_members' and column_name = 'invited_by'
  ) then
    alter table public.initiative_members add column invited_by uuid references public.profiles(id) on delete set null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'initiative_members' and column_name = 'invited_at'
  ) then
    alter table public.initiative_members add column invited_at timestamptz not null default now();
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'initiative_members' and column_name = 'accepted_at'
  ) then
    alter table public.initiative_members add column accepted_at timestamptz;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'initiative_members' and column_name = 'created_at'
  ) then
    alter table public.initiative_members add column created_at timestamptz not null default now();
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'initiative_members' and column_name = 'updated_at'
  ) then
    alter table public.initiative_members add column updated_at timestamptz not null default now();
  end if;
end;
$$;

alter table public.initiative_members enable row level security;

drop policy if exists "initiative_members_select" on public.initiative_members;
create policy "initiative_members_select" on public.initiative_members
  for select using (
    user_id = auth.uid()
    or public.is_coordinator_or_admin()
    or exists (
      select 1 from public.initiative_members im2
      where im2.initiative_id = initiative_members.initiative_id
        and im2.user_id = auth.uid()
        and im2.invite_status = 'accepted'
    )
  );

drop policy if exists "initiative_members_manage" on public.initiative_members;
create policy "initiative_members_manage" on public.initiative_members
  for all using (public.is_coordinator_or_admin())
  with check (public.is_coordinator_or_admin());

-- allow invitee to update their own status (accept/decline)
drop policy if exists "initiative_members_self_update" on public.initiative_members;
create policy "initiative_members_self_update" on public.initiative_members
  for update using (user_id = auth.uid());

drop trigger if exists initiative_members_set_updated_at on public.initiative_members;
create trigger initiative_members_set_updated_at
  before update on public.initiative_members
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 3) email_log
-- ─────────────────────────────────────────────────────────────

create table if not exists public.email_log (
  id              uuid primary key default gen_random_uuid(),
  invitation_id   uuid references public.invitations(id) on delete set null,
  recipient_email text not null,
  subject         text not null,
  status          text not null default 'queued' check (
    status in ('queued', 'sent', 'failed', 'skipped')
  ),
  error_message   text,
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists email_log_invitation_idx on public.email_log(invitation_id);
create index if not exists email_log_status_idx     on public.email_log(status);

alter table public.email_log enable row level security;

-- admins only
drop policy if exists "email_log_select" on public.email_log;
create policy "email_log_select" on public.email_log
  for select using (public.is_coordinator_or_admin());

drop policy if exists "email_log_insert" on public.email_log;
create policy "email_log_insert" on public.email_log
  for insert with check (public.is_coordinator_or_admin());

drop policy if exists "email_log_update" on public.email_log;
create policy "email_log_update" on public.email_log
  for update using (public.is_coordinator_or_admin());

-- ─────────────────────────────────────────────────────────────
-- 4) Helper: is_initiative_member (used in RLS)
-- ─────────────────────────────────────────────────────────────

create or replace function public.is_initiative_member(init_id uuid)
returns boolean as $$
  select (
    exists (
      select 1
      from public.initiative_members im
      where im.initiative_id = init_id
        and im.user_id = auth.uid()
        and im.invite_status = 'accepted'
    )
  );
$$ language sql security definer stable;

-- ─────────────────────────────────────────────────────────────
-- 5) Tighten initiatives select to use is_initiative_member
--    (drop the placeholder policy from 00024 if it existed)
-- ─────────────────────────────────────────────────────────────

-- The 00024 migration already creates an initiatives_select policy.
-- We re-create it here to also allow initiative leads to see their own initiative.
drop policy if exists "initiatives_select" on public.initiatives;
create policy "initiatives_select" on public.initiatives
  for select using (
    public.is_initiative_member(id)
    or exists (
      select 1 from public.invitations inv
      where inv.initiative_id = initiatives.id
        and inv.invitee_user_id = auth.uid()
        and inv.status = 'invited'
    )
    or public.is_coordinator_or_admin()
  );

-- ─────────────────────────────────────────────────────────────
-- 6) Notification trigger: auto-create notification when invite is inserted
-- ─────────────────────────────────────────────────────────────

create or replace function public.notify_on_invite()
returns trigger as $$
declare
  v_title    text;
  v_body     text;
  v_type     text := 'invite_received';
  v_link     text;
begin
  if new.scope = 'initiative' then
    v_title := 'You have been invited to an initiative';
    v_body  := 'You received an invitation to join an initiative as ' || new.invitee_role || '.';
    v_link  := '/app/notifications';
  else
    v_title := 'You have been invited to a congress';
    v_body  := 'You received an invitation to join a congress event as ' || new.invitee_role || '.';
    v_link  := '/app/notifications';
  end if;

  if new.invitee_user_id is not null then
    insert into public.notifications (user_id, type, title, body, is_read, link)
    values (new.invitee_user_id, v_type, v_title, v_body, false, v_link)
    on conflict do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_invitation_notify on public.invitations;
create trigger on_invitation_notify
  after insert on public.invitations
  for each row
  when (new.status = 'invited')
  execute function public.notify_on_invite();

-- ─────────────────────────────────────────────────────────────
-- 7) Add link column to notifications if missing
-- ─────────────────────────────────────────────────────────────

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'notifications'
      and column_name  = 'link'
  ) then
    alter table public.notifications add column link text;
  end if;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Done
-- ─────────────────────────────────────────────────────────────
notify pgrst, 'reload schema';
