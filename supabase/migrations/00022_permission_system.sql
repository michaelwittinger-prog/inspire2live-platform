-- ============================================================
-- MIGRATION 00022: PERMISSION SYSTEM (Phase 2)
--
-- Adds:
-- - user_space_permissions: per-user access-level overrides per space/scope
-- - permission_audit_log:   immutable audit trail for all permission changes
--
-- Design principles:
-- - PlatformAdmin always has manage everywhere (enforced in app layer, not here)
-- - This table stores EXCEPTIONS to role-based defaults only
-- - Scopes: global | congress (congress_id) | initiative (initiative_id)
-- - Access levels: invisible < view < edit < manage
-- - Audit log is append-only (no update/delete policies)
-- ============================================================

-- ============================================================
-- 1) Space permission overrides
-- ============================================================

create table if not exists public.user_space_permissions (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  space       text        not null check (space in (
                'dashboard','initiatives','tasks','congress','stories',
                'resources','partners','network','board','bureau',
                'notifications','profile','admin'
              )),
  access_level text       not null check (access_level in ('invisible','view','edit','manage')),
  scope_type  text        not null default 'global' check (scope_type in ('global','congress','initiative')),
  scope_id    uuid,
  granted_by  uuid        references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Unique constraint: one override per (user, space, scope)
-- COALESCE handles NULL scope_id for global permissions
create unique index if not exists user_space_permissions_unique
  on public.user_space_permissions (user_id, space, scope_type, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid));

create index if not exists idx_usp_user_id on public.user_space_permissions (user_id);
create index if not exists idx_usp_space   on public.user_space_permissions (space);

alter table public.user_space_permissions enable row level security;

-- Users can read their own permission overrides (used by client-side UI)
drop policy if exists usp_select_own on public.user_space_permissions;
create policy usp_select_own on public.user_space_permissions
  for select using (user_id = auth.uid());

-- PlatformAdmin can read all (for the admin management UI)
drop policy if exists usp_select_admin on public.user_space_permissions;
create policy usp_select_admin on public.user_space_permissions
  for select using (public.current_user_role() = 'PlatformAdmin');

-- Only PlatformAdmin can create / update / delete permission overrides
drop policy if exists usp_write_admin on public.user_space_permissions;
create policy usp_write_admin on public.user_space_permissions
  for all
  using  (public.current_user_role() = 'PlatformAdmin')
  with check (public.current_user_role() = 'PlatformAdmin');

-- ============================================================
-- 2) Permission audit log (append-only)
-- ============================================================

create table if not exists public.permission_audit_log (
  id              uuid        primary key default gen_random_uuid(),
  target_user_id  uuid        not null,
  changed_by      uuid        not null references auth.users(id) on delete restrict,
  change_type     text        not null check (change_type in (
                    'role_change',
                    'permission_override',
                    'assignment_change'
                  )),
  previous_value  jsonb,
  new_value       jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_pal_target    on public.permission_audit_log (target_user_id, created_at desc);
create index if not exists idx_pal_changed_by on public.permission_audit_log (changed_by, created_at desc);

alter table public.permission_audit_log enable row level security;

-- Users can read their own audit entries
drop policy if exists pal_select_own on public.permission_audit_log;
create policy pal_select_own on public.permission_audit_log
  for select using (target_user_id = auth.uid());

-- PlatformAdmin can read all audit entries
drop policy if exists pal_select_admin on public.permission_audit_log;
create policy pal_select_admin on public.permission_audit_log
  for select using (public.current_user_role() = 'PlatformAdmin');

-- Only PlatformAdmin can insert audit entries (app writes these on every permission change)
drop policy if exists pal_insert_admin on public.permission_audit_log;
create policy pal_insert_admin on public.permission_audit_log
  for insert with check (
    changed_by = auth.uid()
    and public.current_user_role() = 'PlatformAdmin'
  );

-- Immutable: no updates or deletes allowed on audit rows
drop policy if exists pal_no_update on public.permission_audit_log;
create policy pal_no_update on public.permission_audit_log for update using (false);

drop policy if exists pal_no_delete on public.permission_audit_log;
create policy pal_no_delete on public.permission_audit_log for delete using (false);

-- ============================================================
-- 3) updated_at trigger for user_space_permissions
-- ============================================================

-- Reuse set_updated_at() if it already exists from another migration, else create it.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists usp_set_updated_at on public.user_space_permissions;
create trigger usp_set_updated_at
  before update on public.user_space_permissions
  for each row execute function public.set_updated_at();
