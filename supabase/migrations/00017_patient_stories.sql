-- ============================================================
-- MIGRATION 00017: PATIENT STORIES
-- Adds lived-experience narratives with governance workflow
-- ============================================================

-- ============================================================
-- patient_stories
-- ============================================================

create table if not exists public.patient_stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,

  title text not null,
  summary text,
  body text not null,

  -- Workflow state:
  -- draft -> submitted -> in_review -> needs_changes -> submitted ...
  -- approved -> published -> archived
  -- rejected can optionally be edited (policy) and resubmitted.
  status text not null default 'draft' check (status in (
    'draft',
    'submitted',
    'in_review',
    'needs_changes',
    'approved',
    'published',
    'archived',
    'rejected'
  )),

  -- Public URL slug (set at publish time). Multiple NULLs allowed.
  slug text unique,

  tags text[] not null default '{}',

  -- Consent + positioning
  is_anonymous boolean not null default false,
  display_name text,
  consent_to_publish boolean not null default false,
  allow_contact boolean not null default false,

  -- Review metadata
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewer_notes text,
  rejection_reason text,

  submitted_at timestamptz,
  reviewed_at timestamptz,
  approved_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_patient_stories_author on public.patient_stories(author_id);
create index if not exists idx_patient_stories_status on public.patient_stories(status);
create index if not exists idx_patient_stories_published_at on public.patient_stories(published_at desc);

create trigger set_updated_at before update on public.patient_stories
  for each row execute function public.set_updated_at();

-- ============================================================
-- patient_story_events (audit trail + review feedback)
-- ============================================================

create table if not exists public.patient_story_events (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.patient_stories(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  action text not null check (action in (
    'created',
    'updated',
    'submitted',
    'start_review',
    'request_changes',
    'approved',
    'rejected',
    'published',
    'archived',
    'comment'
  )),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_patient_story_events_story on public.patient_story_events(story_id, created_at desc);

-- ============================================================
-- RLS
-- ============================================================

alter table public.patient_stories enable row level security;
alter table public.patient_story_events enable row level security;

-- PATIENT STORIES: read own + coordinators; public read published
drop policy if exists patient_stories_select on public.patient_stories;
create policy patient_stories_select on public.patient_stories
  for select using (
    status = 'published'
    or author_id = auth.uid()
    or public.is_coordinator_or_admin()
  );

-- Authors can create their own stories (PatientAdvocate only)
drop policy if exists patient_stories_insert on public.patient_stories;
create policy patient_stories_insert on public.patient_stories
  for insert with check (
    author_id = auth.uid()
    and public.current_user_role() = 'PatientAdvocate'
  );

-- Authors can edit only while draft/needs_changes/rejected; coordinators/admins can edit anything
drop policy if exists patient_stories_update_author on public.patient_stories;
create policy patient_stories_update_author on public.patient_stories
  for update using (
    author_id = auth.uid()
    and status in ('draft', 'needs_changes', 'rejected')
  );

drop policy if exists patient_stories_update_coordinator on public.patient_stories;
create policy patient_stories_update_coordinator on public.patient_stories
  for update using (
    public.is_coordinator_or_admin()
  );

-- Allow delete of draft/rejected by author; coordinators/admins can delete any
drop policy if exists patient_stories_delete_author on public.patient_stories;
create policy patient_stories_delete_author on public.patient_stories
  for delete using (
    author_id = auth.uid()
    and status in ('draft', 'rejected')
  );

drop policy if exists patient_stories_delete_coordinator on public.patient_stories;
create policy patient_stories_delete_coordinator on public.patient_stories
  for delete using (public.is_coordinator_or_admin());

-- EVENTS: author can read events for own stories; coordinators/admins can read all
drop policy if exists patient_story_events_select on public.patient_story_events;
create policy patient_story_events_select on public.patient_story_events
  for select using (
    public.is_coordinator_or_admin()
    or exists (
      select 1 from public.patient_stories ps
      where ps.id = patient_story_events.story_id
        and ps.author_id = auth.uid()
    )
  );

-- EVENTS: author or coordinator can write events (actor must be current user)
drop policy if exists patient_story_events_insert on public.patient_story_events;
create policy patient_story_events_insert on public.patient_story_events
  for insert with check (
    actor_id = auth.uid()
    and (
      public.is_coordinator_or_admin()
      or exists (
        select 1 from public.patient_stories ps
        where ps.id = patient_story_events.story_id
          and ps.author_id = auth.uid()
      )
    )
  );
