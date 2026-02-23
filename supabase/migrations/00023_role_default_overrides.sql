-- ============================================================
-- MIGRATION 00023: ROLE DEFAULT OVERRIDES (Phase 2)
--
-- Adds:
-- - role_space_default_overrides: mutable overrides for role-space defaults
--
-- Notes:
-- - Static defaults remain in code (ROLE_SPACE_DEFAULTS)
-- - This table stores only override rows
-- - Effective default = static default overlaid by override row
-- ============================================================

create table if not exists public.role_space_default_overrides (
  role        text        not null,
  space       text        not null,
  access_level text       not null check (access_level in ('invisible', 'view', 'edit', 'manage')),
  updated_by  uuid        references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (role, space)
);

alter table public.role_space_default_overrides
  add constraint rsdo_role_check
  check (role in (
    'PatientAdvocate',
    'Clinician',
    'Researcher',
    'Moderator',
    'HubCoordinator',
    'IndustryPartner',
    'BoardMember',
    'PlatformAdmin'
  ));

alter table public.role_space_default_overrides
  add constraint rsdo_space_check
  check (space in (
    'dashboard','initiatives','tasks','congress','stories',
    'resources','partners','network','board','bureau',
    'notifications','profile','admin'
  ));

alter table public.role_space_default_overrides enable row level security;

drop policy if exists rsdo_select_admin on public.role_space_default_overrides;
create policy rsdo_select_admin on public.role_space_default_overrides
  for select using (public.current_user_role() = 'PlatformAdmin');

drop policy if exists rsdo_write_admin on public.role_space_default_overrides;
create policy rsdo_write_admin on public.role_space_default_overrides
  for all
  using (public.current_user_role() = 'PlatformAdmin')
  with check (public.current_user_role() = 'PlatformAdmin');

-- Reuse helper from 00022
drop trigger if exists rsdo_set_updated_at on public.role_space_default_overrides;
create trigger rsdo_set_updated_at
  before update on public.role_space_default_overrides
  for each row execute function public.set_updated_at();
