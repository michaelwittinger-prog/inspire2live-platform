-- ============================================================
-- MIGRATION 00019: MODERATOR GOVERNANCE (COMMUNITY CONTENT)
--
-- Adds:
-- - user_roles: multi-role model (patient/advocate/moderator/board_member/admin)
-- - story_status_changes: audit trail for patient story status transitions
-- - Trigger to auto-log patient_stories.status changes
-- - RLS policies for governance enforcement
--
-- Notes:
-- - This is intentionally separate from `profiles.role` (platform access role)
--   because governance roles may differ from workspace roles.
-- - Moderators can govern stories but cannot self-escalate roles.
-- ============================================================

-- ============================================================
-- 1) Role schema
-- ============================================================

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('patient','advocate','moderator','board_member','admin')),
  congress_id uuid null references public.congress_events(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, role, congress_id)
);

create index if not exists idx_user_roles_user on public.user_roles(user_id);
create index if not exists idx_user_roles_role on public.user_roles(role);

alter table public.user_roles enable row level security;

create or replace function public.has_user_role(target_role text, target_congress_id uuid default null)
returns boolean as $$
  select exists(
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = target_role
      and (
        target_congress_id is null
        and ur.congress_id is null
        or ur.congress_id = target_congress_id
      )
  );
$$ language sql security definer stable;

-- Helper: is current user admin (governance)
create or replace function public.is_governance_admin()
returns boolean as $$
  select public.has_user_role('admin', null);
$$ language sql security definer stable;

-- Helper: is current user moderator (governance)
create or replace function public.is_moderator()
returns boolean as $$
  select public.has_user_role('moderator', null);
$$ language sql security definer stable;

-- RLS: user_roles
drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own on public.user_roles
  for select using (
    user_id = auth.uid()
  );

drop policy if exists user_roles_select_moderator on public.user_roles;
create policy user_roles_select_moderator on public.user_roles
  for select using (
    public.is_moderator() or public.is_governance_admin() or public.is_coordinator_or_admin()
  );

drop policy if exists user_roles_admin_write on public.user_roles;
create policy user_roles_admin_write on public.user_roles
  for all using (
    public.is_governance_admin() or public.current_user_role() = 'PlatformAdmin'
  )
  with check (
    public.is_governance_admin() or public.current_user_role() = 'PlatformAdmin'
  );

-- ============================================================
-- 2) Audit trail table
-- ============================================================

create table if not exists public.story_status_changes (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.patient_stories(id) on delete cascade,
  changed_by uuid references auth.users(id) on delete set null,
  previous_status text,
  new_status text not null,
  changed_at timestamptz not null default now()
);

create index if not exists idx_story_status_changes_story on public.story_status_changes(story_id, changed_at desc);

alter table public.story_status_changes enable row level security;

-- RLS: read own story audits; moderators/admins can read all
drop policy if exists story_status_changes_select on public.story_status_changes;
create policy story_status_changes_select on public.story_status_changes
  for select using (
    public.is_moderator()
    or public.is_governance_admin()
    or public.is_coordinator_or_admin()
    or exists (
      select 1 from public.patient_stories ps
      where ps.id = story_status_changes.story_id
        and ps.author_id = auth.uid()
    )
  );

-- Only moderator/admin can insert (trigger uses this)
drop policy if exists story_status_changes_insert on public.story_status_changes;
create policy story_status_changes_insert on public.story_status_changes
  for insert with check (
    changed_by = auth.uid()
    and (
      public.is_moderator() or public.is_governance_admin() or public.is_coordinator_or_admin()
    )
  );

-- Nobody updates/deletes audit rows (immutability)
drop policy if exists story_status_changes_no_update on public.story_status_changes;
create policy story_status_changes_no_update on public.story_status_changes
  for update using (false);

drop policy if exists story_status_changes_no_delete on public.story_status_changes;
create policy story_status_changes_no_delete on public.story_status_changes
  for delete using (false);

-- ============================================================
-- 3) Trigger: auto-log patient story status changes
-- ============================================================

create or replace function public.log_patient_story_status_change()
returns trigger as $$
begin
  if NEW.status is distinct from OLD.status then
    -- Only log governance transitions (moderator/admin/coordinator)
    if public.is_moderator() or public.is_governance_admin() or public.is_coordinator_or_admin() then
      insert into public.story_status_changes (story_id, changed_by, previous_status, new_status)
      values (NEW.id, auth.uid(), OLD.status, NEW.status);
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_patient_story_status_change on public.patient_stories;
create trigger on_patient_story_status_change
  after update of status on public.patient_stories
  for each row
  execute function public.log_patient_story_status_change();

-- ============================================================
-- 4) Moderator authority model on patient_stories
-- ============================================================

alter table public.patient_stories add column if not exists moderator_notes text;

-- Moderators should be able to see all stories (including drafts/submitted)
drop policy if exists patient_stories_select on public.patient_stories;
create policy patient_stories_select on public.patient_stories
  for select using (
    status = 'published'
    or author_id = auth.uid()
    or public.is_coordinator_or_admin()
    or public.is_moderator()
    or public.is_governance_admin()
  );

-- Moderators can update status + notes fields, but never author_id.
-- We implement this as an additional update policy; column-level enforcement is done
-- via a trigger below.
drop policy if exists patient_stories_update_moderator on public.patient_stories;
create policy patient_stories_update_moderator on public.patient_stories
  for update using (
    public.is_moderator() or public.is_governance_admin() or public.is_coordinator_or_admin()
  );

-- Enforce moderator field-level boundaries (status + notes only)
create or replace function public.enforce_moderator_patient_story_update()
returns trigger as $$
begin
  -- Moderators (not admins/coordinators) can only update governance fields.
  if public.is_moderator() and not (public.is_governance_admin() or public.is_coordinator_or_admin()) then
    if
      NEW.title is distinct from OLD.title or
      NEW.summary is distinct from OLD.summary or
      NEW.body is distinct from OLD.body or
      NEW.tags is distinct from OLD.tags or
      NEW.is_anonymous is distinct from OLD.is_anonymous or
      NEW.display_name is distinct from OLD.display_name or
      NEW.consent_to_publish is distinct from OLD.consent_to_publish or
      NEW.allow_contact is distinct from OLD.allow_contact
    then
      raise exception 'Moderator may only update status/notes fields';
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_patient_story_enforce_moderator_update on public.patient_stories;
create trigger on_patient_story_enforce_moderator_update
  before update on public.patient_stories
  for each row
  execute function public.enforce_moderator_patient_story_update();

-- Enforce who can change status:
-- - Author may only move to 'submitted' from specific states
-- - Moderators/admins/coordinators can change status freely
create or replace function public.enforce_patient_story_status_change()
returns trigger as $$
begin
  if NEW.status is distinct from OLD.status then
    if auth.uid() = OLD.author_id
      and NEW.status = 'submitted'
      and OLD.status in ('draft','needs_changes','rejected')
    then
      return NEW;
    end if;

    if public.is_moderator() or public.is_governance_admin() or public.is_coordinator_or_admin() then
      return NEW;
    end if;

    raise exception 'Not allowed to change story status';
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_patient_story_enforce_status_change on public.patient_stories;
create trigger on_patient_story_enforce_status_change
  before update of status on public.patient_stories
  for each row
  execute function public.enforce_patient_story_status_change();

-- Prevent changing author_id (even for moderators/admins) except PlatformAdmin.
create or replace function public.prevent_patient_story_author_change()
returns trigger as $$
begin
  if NEW.author_id is distinct from OLD.author_id then
    -- only PlatformAdmin (platform role) can reassign authorship
    if public.current_user_role() != 'PlatformAdmin' then
      raise exception 'Changing author_id is not allowed';
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_patient_story_prevent_author_change on public.patient_stories;
create trigger on_patient_story_prevent_author_change
  before update of author_id on public.patient_stories
  for each row
  execute function public.prevent_patient_story_author_change();

-- Moderators cannot delete stories: keep existing delete policies; do not add any.
