-- ============================================================
-- MIGRATION 00001: INITIAL SCHEMA
-- All core tables for the Inspire2Live Platform
-- ============================================================

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in (
    'PatientAdvocate', 'Clinician', 'Researcher', 'HubCoordinator',
    'IndustryPartner', 'BoardMember', 'PlatformAdmin'
  )),
  organization text,
  country text not null,
  city text,
  timezone text not null default 'UTC',
  expertise_tags text[] default '{}',
  bio text,
  avatar_url text,
  hero_of_cancer_year int,
  language text not null default 'en',
  onboarding_completed boolean not null default false,
  notification_prefs jsonb not null default '{
    "emailDigestFrequency": "weekly",
    "digestDeliveryTime": "09:00",
    "mentionAlwaysNotify": true,
    "initiativeLevels": {}
  }'::jsonb,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on public.profiles(role);
create index idx_profiles_country on public.profiles(country);
create index idx_profiles_last_active on public.profiles(last_active_at);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, country)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'PatientAdvocate'),
    coalesce(new.raw_user_meta_data->>'country', 'NL')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- INITIATIVES
-- ============================================================
create table public.initiatives (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  status text not null default 'draft' check (status in (
    'draft', 'active', 'paused', 'completed', 'archived'
  )),
  phase text not null default 'planning' check (phase in (
    'planning', 'execution', 'evaluation', 'scaling'
  )),
  pillar text not null check (pillar in (
    'inspire2live', 'inspire2go', 'world_campus'
  )),
  lead_id uuid not null references public.profiles(id),
  cancer_types text[] default '{}',
  countries text[] default '{}',
  objectives jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_initiatives_status on public.initiatives(status);
create index idx_initiatives_slug on public.initiatives(slug);
create index idx_initiatives_lead on public.initiatives(lead_id);

-- ============================================================
-- INITIATIVE MEMBERS
-- ============================================================
create table public.initiative_members (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references public.initiatives(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'contributor' check (role in (
    'lead', 'contributor', 'reviewer', 'partner'
  )),
  joined_at timestamptz not null default now(),
  unique(initiative_id, user_id)
);

create index idx_initiative_members_user on public.initiative_members(user_id);
create index idx_initiative_members_initiative on public.initiative_members(initiative_id);

-- ============================================================
-- MILESTONES
-- ============================================================
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references public.initiatives(id) on delete cascade,
  title text not null,
  description text default '',
  target_date date not null,
  completed_date date,
  status text not null default 'upcoming' check (status in (
    'upcoming', 'in_progress', 'completed', 'overdue'
  )),
  evidence_required boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_milestones_initiative on public.milestones(initiative_id);
create index idx_milestones_status on public.milestones(status);
create index idx_milestones_target_date on public.milestones(target_date);

-- ============================================================
-- CONGRESS EVENTS (needed before tasks due to FK)
-- ============================================================
create table public.congress_events (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  theme text not null,
  start_date date not null,
  end_date date not null,
  location text not null,
  registration_url text,
  status text not null default 'upcoming' check (status in (
    'upcoming', 'active', 'completed'
  )),
  created_at timestamptz not null default now()
);

-- ============================================================
-- CONGRESS TOPICS
-- ============================================================
create table public.congress_topics (
  id uuid primary key default gen_random_uuid(),
  congress_id uuid not null references public.congress_events(id) on delete cascade,
  submitter_id uuid not null references public.profiles(id),
  title text not null,
  description text not null,
  related_initiative_id uuid references public.initiatives(id),
  proposed_format text check (proposed_format in (
    'presentation', 'workshop', 'rapid_fire', 'panel'
  )),
  vote_count int not null default 0,
  status text not null default 'submitted' check (status in (
    'submitted', 'under_review', 'accepted', 'not_this_year'
  )),
  created_at timestamptz not null default now()
);

-- ============================================================
-- CONGRESS SESSIONS
-- ============================================================
create table public.congress_sessions (
  id uuid primary key default gen_random_uuid(),
  congress_id uuid not null references public.congress_events(id) on delete cascade,
  topic_id uuid references public.congress_topics(id),
  title text not null,
  description text default '',
  start_time timestamptz not null,
  end_time timestamptz not null,
  room text,
  session_lead_id uuid references public.profiles(id),
  note_taker_id uuid references public.profiles(id),
  decision_capture_id uuid references public.profiles(id),
  notes_structured jsonb default '{
    "keyPoints": [],
    "questionsRaised": [],
    "proposedActions": []
  }'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- CONGRESS DECISIONS (no tasks FK yet — added after tasks table)
-- ============================================================
create table public.congress_decisions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.congress_sessions(id) on delete cascade,
  description text not null,
  proposed_by text not null,
  owner_id uuid references public.profiles(id),
  deadline date,
  initiative_id uuid references public.initiatives(id),
  converted_to_task_id uuid, -- FK added after tasks table below
  conversion_status text not null default 'pending' check (conversion_status in (
    'pending', 'converted', 'needs_clarification'
  )),
  captured_at timestamptz not null default now()
);

create index idx_congress_decisions_session on public.congress_decisions(session_id);
create index idx_congress_decisions_conversion on public.congress_decisions(conversion_status);

-- ============================================================
-- TASKS (references congress_decisions)
-- ============================================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references public.initiatives(id) on delete cascade,
  milestone_id uuid references public.milestones(id) on delete set null,
  title text not null,
  description text default '',
  assignee_id uuid not null references public.profiles(id),
  reporter_id uuid not null references public.profiles(id),
  status text not null default 'todo' check (status in (
    'todo', 'in_progress', 'review', 'done', 'blocked'
  )),
  priority text not null default 'medium' check (priority in (
    'low', 'medium', 'high', 'urgent'
  )),
  due_date date,
  created_from text not null default 'initiative_work' check (created_from in (
    'congress_decision', 'bureau_assignment', 'initiative_work'
  )),
  congress_decision_id uuid references public.congress_decisions(id),
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tasks_initiative on public.tasks(initiative_id);
create index idx_tasks_assignee on public.tasks(assignee_id);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_milestone on public.tasks(milestone_id);
create index idx_tasks_due_date on public.tasks(due_date);

-- Now add the FK from congress_decisions back to tasks
alter table public.congress_decisions
  add constraint fk_congress_decisions_task
  foreign key (converted_to_task_id) references public.tasks(id);

-- ============================================================
-- TASK COMMENTS
-- ============================================================
create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  content text not null,
  mentions uuid[] default '{}',
  created_at timestamptz not null default now()
);

create index idx_task_comments_task on public.task_comments(task_id);

-- ============================================================
-- RESOURCES (Evidence Repository)
-- ============================================================
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in (
    'document', 'data', 'link', 'recording', 'template', 'report'
  )),
  initiative_id uuid references public.initiatives(id) on delete set null,
  uploaded_by_id uuid not null references public.profiles(id),
  file_url text,
  external_url text,
  storage_path text,
  file_size_bytes bigint,
  mime_type text,
  version int not null default 1,
  language text not null default 'en',
  translation_status text not null default 'original' check (translation_status in (
    'original', 'translated', 'needs_translation'
  )),
  cancer_types text[] default '{}',
  countries text[] default '{}',
  tags text[] default '{}',
  supersedes_id uuid references public.resources(id),
  is_partner_contribution boolean not null default false,
  partner_organization text,
  created_at timestamptz not null default now()
);

create index idx_resources_initiative on public.resources(initiative_id);
create index idx_resources_type on public.resources(type);
create index idx_resources_uploaded_by on public.resources(uploaded_by_id);

-- Full text search on resources
-- Using a trigger (not generated column) because array_to_string is STABLE not IMMUTABLE
alter table public.resources add column fts tsvector;
create index idx_resources_fts on public.resources using gin(fts);

create or replace function public.resources_fts_update()
returns trigger as $$
begin
  NEW.fts :=
    setweight(to_tsvector('english'::regconfig, coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(array_to_string(NEW.tags, ' '), '')), 'B');
  return NEW;
end;
$$ language plpgsql;

create trigger resources_fts_trigger
  before insert or update on public.resources
  for each row execute function public.resources_fts_update();

-- ============================================================
-- DISCUSSIONS
-- ============================================================
create table public.discussions (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references public.initiatives(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  title text not null,
  content text not null,
  thread_type text not null default 'general' check (thread_type in (
    'general', 'decision', 'question', 'blocker', 'idea'
  )),
  decision_summary text,
  decision_made_by uuid references public.profiles(id),
  decision_date timestamptz,
  is_pinned boolean not null default false,
  reply_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_discussions_initiative on public.discussions(initiative_id);

-- ============================================================
-- DISCUSSION REPLIES
-- ============================================================
create table public.discussion_replies (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  content text not null,
  mentions uuid[] default '{}',
  created_at timestamptz not null default now()
);

-- Trigger to update reply_count
create or replace function public.update_reply_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.discussions set reply_count = reply_count + 1
    where id = NEW.discussion_id;
  elsif TG_OP = 'DELETE' then
    update public.discussions set reply_count = reply_count - 1
    where id = OLD.discussion_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_reply_change
  after insert or delete on public.discussion_replies
  for each row execute function public.update_reply_count();

-- ============================================================
-- HUBS
-- ============================================================
create table public.hubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  region text,
  coordinator_id uuid not null references public.profiles(id),
  status text not null default 'forming' check (status in (
    'active', 'forming', 'inactive'
  )),
  description text default '',
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  timezone text not null default 'UTC',
  established_date date,
  created_at timestamptz not null default now()
);

-- ============================================================
-- HUB MEMBERS
-- ============================================================
create table public.hub_members (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(hub_id, user_id)
);

-- ============================================================
-- HUB INITIATIVES
-- ============================================================
create table public.hub_initiatives (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs(id) on delete cascade,
  initiative_id uuid not null references public.initiatives(id) on delete cascade,
  local_status text default 'active',
  local_notes text,
  unique(hub_id, initiative_id)
);

-- ============================================================
-- WORLD CAMPUS SESSIONS
-- ============================================================
create table public.world_campus_sessions (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid references public.hubs(id),
  title text not null,
  description text default '',
  scheduled_date timestamptz not null,
  timezone text not null default 'UTC',
  agenda text default '',
  recording_url text,
  materials_urls text[] default '{}',
  status text not null default 'scheduled' check (status in (
    'scheduled', 'in_progress', 'completed', 'cancelled'
  )),
  created_at timestamptz not null default now()
);

-- ============================================================
-- SESSION ATTENDEES
-- ============================================================
create table public.session_attendees (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.world_campus_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  attended boolean not null default false,
  unique(session_id, user_id)
);

-- ============================================================
-- PARTNER ENGAGEMENTS
-- ============================================================
create table public.partner_engagements (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id),
  initiative_id uuid not null references public.initiatives(id),
  scope_description text not null,
  contribution_type text not null,
  neutrality_declared boolean not null default false,
  neutrality_date timestamptz,
  status text not null default 'applied' check (status in (
    'applied', 'under_review', 'approved', 'active', 'completed', 'declined'
  )),
  reviewer_id uuid references public.profiles(id),
  reviewed_date timestamptz,
  reviewer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_partner_engagements_initiative on public.partner_engagements(initiative_id);
create index idx_partner_engagements_partner on public.partner_engagements(partner_id);

-- ============================================================
-- PARTNER AUDIT TRAIL
-- ============================================================
create table public.partner_audit_entries (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.partner_engagements(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TOPIC VOTES
-- ============================================================
create table public.topic_votes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.congress_topics(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(topic_id, user_id)
);

-- Trigger to update vote_count
create or replace function public.update_vote_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.congress_topics set vote_count = vote_count + 1
    where id = NEW.topic_id;
  elsif TG_OP = 'DELETE' then
    update public.congress_topics set vote_count = vote_count - 1
    where id = OLD.topic_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_vote_change
  after insert or delete on public.topic_votes
  for each row execute function public.update_vote_count();

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'task_assigned', 'task_completed', 'milestone_approaching',
    'milestone_completed', 'new_discussion', 'mention',
    'decision_flagged', 'partner_application', 'inactivity_nudge',
    'initiative_joined', 'congress_role_assigned'
  )),
  title text not null,
  body text not null,
  initiative_id uuid references public.initiatives(id),
  link_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id, is_read);
create index idx_notifications_created on public.notifications(created_at desc);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id),
  initiative_id uuid references public.initiatives(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_activity_initiative on public.activity_log(initiative_id, created_at desc);
create index idx_activity_actor on public.activity_log(actor_id, created_at desc);

-- ============================================================
-- UPDATED_AT TRIGGER (reusable function)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.initiatives
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.milestones
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.discussions
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.partner_engagements
  for each row execute function public.set_updated_at();

-- ============================================================
-- MILESTONE AUTO-OVERDUE FUNCTION
-- ============================================================
create or replace function public.check_milestone_overdue()
returns trigger as $$
begin
  update public.milestones
  set status = 'overdue'
  where status in ('upcoming', 'in_progress')
    and target_date < current_date;
  return null;
end;
$$ language plpgsql security definer;
