-- ============================================================
-- MIGRATION 00020: MULTI-ROLE SUPPORT + ACTIVE CONTEXT
--
-- Implements:
-- - Multi-role helper functions:
--   * get_active_roles(user_id uuid) returns setof text
--   * has_role(role_name text) returns boolean
-- - Active role context via `user_role_context` (DB-backed session state)
-- - Precedence model:
--     admin > moderator > board_member > advocate > patient
--
-- Design notes:
-- - RLS should NEVER rely on the chosen active role to grant extra powers.
--   Active role is only for UI context / narrowing visibility.
-- - True permissions are always checked against `user_roles` membership.
-- ============================================================

-- Ensure table exists (from 00019). If 00019 wasn't applied, create minimal table.
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('patient','advocate','moderator','board_member','admin')),
  congress_id uuid null references public.congress_events(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, role, congress_id)
);

alter table public.user_roles enable row level security;

-- ============================================================
-- Active role context
-- ============================================================

create table if not exists public.user_role_context (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_role text not null check (active_role in ('patient','advocate','moderator','board_member','admin')),
  active_congress_id uuid null references public.congress_events(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.user_role_context enable row level security;

create index if not exists idx_user_role_context_active_role on public.user_role_context(active_role);

-- Allow users to read their own context.
drop policy if exists user_role_context_select_own on public.user_role_context;
create policy user_role_context_select_own on public.user_role_context
  for select using (user_id = auth.uid());

-- Allow users to upsert their own context BUT only to roles they actually hold.
drop policy if exists user_role_context_upsert_own on public.user_role_context;
create policy user_role_context_upsert_own on public.user_role_context
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = user_role_context.active_role
        and (
          user_role_context.active_congress_id is null
          and ur.congress_id is null
          or ur.congress_id = user_role_context.active_congress_id
        )
    )
  );

drop policy if exists user_role_context_update_own on public.user_role_context;
create policy user_role_context_update_own on public.user_role_context
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = user_role_context.active_role
        and (
          user_role_context.active_congress_id is null
          and ur.congress_id is null
          or ur.congress_id = user_role_context.active_congress_id
        )
    )
  );

-- Keep updated_at fresh
create or replace function public.set_user_role_context_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists set_user_role_context_updated_at on public.user_role_context;
create trigger set_user_role_context_updated_at
  before update on public.user_role_context
  for each row execute function public.set_user_role_context_updated_at();

-- ============================================================
-- Helper functions
-- ============================================================

-- Role precedence ranking
create or replace function public.role_precedence(role_name text)
returns int as $$
  select case role_name
    when 'admin' then 100
    when 'moderator' then 80
    when 'board_member' then 60
    when 'advocate' then 40
    when 'patient' then 20
    else 0
  end;
$$ language sql immutable;

-- Get active roles for a user.
-- If the user has selected an active context in `user_role_context`, return that one.
-- Otherwise, return all roles assigned.
create or replace function public.get_active_roles(target_user_id uuid)
returns setof text as $$
  select ctx.active_role
  from public.user_role_context ctx
  where ctx.user_id = target_user_id

  union

  select ur.role
  from public.user_roles ur
  where ur.user_id = target_user_id
    and not exists (select 1 from public.user_role_context ctx2 where ctx2.user_id = target_user_id);
$$ language sql security definer stable;

-- has_role(role_name): checks true permissions (never based on active context)
create or replace function public.has_role(role_name text)
returns boolean as $$
  select exists(
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = role_name
  );
$$ language sql security definer stable;

-- Optional: current_active_role() for UI narrowing
create or replace function public.current_active_role()
returns text as $$
  select ctx.active_role
  from public.user_role_context ctx
  where ctx.user_id = auth.uid();
$$ language sql security definer stable;

-- Optional: compute highest role by precedence (useful for UI defaults)
create or replace function public.highest_role(target_user_id uuid)
returns text as $$
  select ur.role
  from public.user_roles ur
  where ur.user_id = target_user_id
  order by public.role_precedence(ur.role) desc
  limit 1;
$$ language sql security definer stable;

-- ============================================================
-- RLS example patterns
-- ============================================================
-- NOTE: You still define policies per-table.
-- Example moderator-only policy style:
--
--   using (
--     exists (
--       select 1 from public.user_roles
--       where user_id = auth.uid()
--         and role = 'moderator'
--     )
--   )
--
-- Or with helper:
--   using (public.has_role('moderator'))
