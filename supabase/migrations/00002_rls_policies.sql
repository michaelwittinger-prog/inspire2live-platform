-- ============================================================
-- MIGRATION 00002: ROW-LEVEL SECURITY POLICIES
-- Database-level access control for all tables
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.initiatives enable row level security;
alter table public.initiative_members enable row level security;
alter table public.milestones enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.resources enable row level security;
alter table public.discussions enable row level security;
alter table public.discussion_replies enable row level security;
alter table public.hubs enable row level security;
alter table public.hub_members enable row level security;
alter table public.hub_initiatives enable row level security;
alter table public.world_campus_sessions enable row level security;
alter table public.session_attendees enable row level security;
alter table public.partner_engagements enable row level security;
alter table public.partner_audit_entries enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_log enable row level security;
alter table public.congress_events enable row level security;
alter table public.congress_topics enable row level security;
alter table public.congress_sessions enable row level security;
alter table public.congress_decisions enable row level security;
alter table public.topic_votes enable row level security;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get current user's role
create or replace function public.current_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- Check if user is member of an initiative
create or replace function public.is_initiative_member(init_id uuid)
returns boolean as $$
  select exists(
    select 1 from public.initiative_members
    where initiative_id = init_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Check if user is lead of an initiative
create or replace function public.is_initiative_lead(init_id uuid)
returns boolean as $$
  select exists(
    select 1 from public.initiative_members
    where initiative_id = init_id
      and user_id = auth.uid()
      and role = 'lead'
  );
$$ language sql security definer stable;

-- Check if user is admin or coordinator
create or replace function public.is_coordinator_or_admin()
returns boolean as $$
  select public.current_user_role() in ('HubCoordinator', 'PlatformAdmin');
$$ language sql security definer stable;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

-- Everyone can read profiles (needed for team rosters, avatars)
create policy "profiles_select" on public.profiles
  for select using (true);

-- Users can update their own profile
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- Admins can update any profile
create policy "profiles_update_admin" on public.profiles
  for update using (public.current_user_role() = 'PlatformAdmin');

-- ============================================================
-- INITIATIVES POLICIES
-- ============================================================

-- Public initiatives visible to all authenticated users
create policy "initiatives_select" on public.initiatives
  for select using (
    status in ('active', 'completed') or
    public.is_initiative_member(id) or
    public.is_coordinator_or_admin()
  );

-- Coordinators and admins can create initiatives
create policy "initiatives_insert" on public.initiatives
  for insert with check (public.is_coordinator_or_admin());

-- Lead, coordinator, or admin can update initiative
create policy "initiatives_update" on public.initiatives
  for update using (
    lead_id = auth.uid() or
    public.is_initiative_lead(id) or
    public.is_coordinator_or_admin()
  );

-- ============================================================
-- INITIATIVE MEMBERS POLICIES
-- ============================================================

create policy "initiative_members_select" on public.initiative_members
  for select using (
    public.is_initiative_member(initiative_id) or
    public.is_coordinator_or_admin()
  );

create policy "initiative_members_insert" on public.initiative_members
  for insert with check (
    public.is_initiative_lead(initiative_id) or
    public.is_coordinator_or_admin()
  );

create policy "initiative_members_delete" on public.initiative_members
  for delete using (
    public.is_initiative_lead(initiative_id) or
    public.is_coordinator_or_admin()
  );

-- ============================================================
-- MILESTONES POLICIES
-- ============================================================

create policy "milestones_select" on public.milestones
  for select using (
    public.is_initiative_member(initiative_id) or
    public.is_coordinator_or_admin()
  );

create policy "milestones_insert" on public.milestones
  for insert with check (
    public.is_initiative_lead(initiative_id) or
    public.is_coordinator_or_admin()
  );

create policy "milestones_update" on public.milestones
  for update using (
    public.is_initiative_lead(initiative_id) or
    public.is_coordinator_or_admin()
  );

-- ============================================================
-- TASKS POLICIES
-- ============================================================

-- Initiative members can see tasks in their initiatives
create policy "tasks_select" on public.tasks
  for select using (
    public.is_initiative_member(initiative_id) or
    public.is_coordinator_or_admin()
  );

-- Initiative members can create tasks (except IndustryPartner)
create policy "tasks_insert" on public.tasks
  for insert with check (
    public.is_initiative_member(initiative_id) and
    public.current_user_role() != 'IndustryPartner'
  );

-- Assignee can update their own tasks; coordinators can update any
create policy "tasks_update" on public.tasks
  for update using (
    assignee_id = auth.uid() or
    reporter_id = auth.uid() or
    public.is_initiative_lead(initiative_id) or
    public.is_coordinator_or_admin()
  );

-- ============================================================
-- TASK COMMENTS POLICIES
-- ============================================================

create policy "task_comments_select" on public.task_comments
  for select using (
    exists(
      select 1 from public.tasks t
      where t.id = task_id and public.is_initiative_member(t.initiative_id)
    ) or public.is_coordinator_or_admin()
  );

create policy "task_comments_insert" on public.task_comments
  for insert with check (
    author_id = auth.uid() and
    exists(
      select 1 from public.tasks t
      where t.id = task_id and public.is_initiative_member(t.initiative_id)
    )
  );

-- ============================================================
-- RESOURCES POLICIES
-- ============================================================

-- Initiative members can see resources; public initiatives' resources visible to all
create policy "resources_select" on public.resources
  for select using (
    initiative_id is null or
    public.is_initiative_member(initiative_id) or
    public.is_coordinator_or_admin() or
    exists(
      select 1 from public.initiatives
      where id = resources.initiative_id and status = 'active'
    )
  );

-- Members can upload to their initiatives
create policy "resources_insert" on public.resources
  for insert with check (
    uploaded_by_id = auth.uid() and (
      initiative_id is null or
      public.is_initiative_member(initiative_id)
    )
  );

create policy "resources_delete" on public.resources
  for delete using (
    uploaded_by_id = auth.uid() or
    public.is_coordinator_or_admin()
  );

-- ============================================================
-- DISCUSSIONS POLICIES
-- ============================================================

create policy "discussions_select" on public.discussions
  for select using (
    public.is_initiative_member(initiative_id) or
    public.is_coordinator_or_admin()
  );

create policy "discussions_insert" on public.discussions
  for insert with check (
    author_id = auth.uid() and
    public.is_initiative_member(initiative_id) and
    public.current_user_role() != 'IndustryPartner'
  );

create policy "discussions_update" on public.discussions
  for update using (
    author_id = auth.uid() or
    public.is_initiative_lead(initiative_id) or
    public.is_coordinator_or_admin()
  );

-- ============================================================
-- DISCUSSION REPLIES POLICIES
-- ============================================================

create policy "discussion_replies_select" on public.discussion_replies
  for select using (
    exists(
      select 1 from public.discussions d
      where d.id = discussion_id and public.is_initiative_member(d.initiative_id)
    ) or public.is_coordinator_or_admin()
  );

create policy "discussion_replies_insert" on public.discussion_replies
  for insert with check (
    author_id = auth.uid() and
    exists(
      select 1 from public.discussions d
      where d.id = discussion_id and public.is_initiative_member(d.initiative_id)
    )
  );

-- ============================================================
-- HUBS POLICIES
-- ============================================================

create policy "hubs_select" on public.hubs
  for select using (true); -- public hub directory

create policy "hubs_insert" on public.hubs
  for insert with check (public.is_coordinator_or_admin());

create policy "hubs_update" on public.hubs
  for update using (
    coordinator_id = auth.uid() or
    public.is_coordinator_or_admin()
  );

-- ============================================================
-- HUB MEMBERS POLICIES
-- ============================================================

create policy "hub_members_select" on public.hub_members
  for select using (true);

create policy "hub_members_insert" on public.hub_members
  for insert with check (
    user_id = auth.uid() or
    public.is_coordinator_or_admin()
  );

create policy "hub_members_delete" on public.hub_members
  for delete using (
    user_id = auth.uid() or
    public.is_coordinator_or_admin()
  );

-- ============================================================
-- HUB INITIATIVES POLICIES
-- ============================================================

create policy "hub_initiatives_select" on public.hub_initiatives
  for select using (true);

create policy "hub_initiatives_insert" on public.hub_initiatives
  for insert with check (public.is_coordinator_or_admin());

-- ============================================================
-- WORLD CAMPUS SESSIONS POLICIES
-- ============================================================

create policy "world_campus_sessions_select" on public.world_campus_sessions
  for select using (true);

create policy "world_campus_sessions_insert" on public.world_campus_sessions
  for insert with check (public.is_coordinator_or_admin());

create policy "world_campus_sessions_update" on public.world_campus_sessions
  for update using (public.is_coordinator_or_admin());

-- ============================================================
-- SESSION ATTENDEES POLICIES
-- ============================================================

create policy "session_attendees_select" on public.session_attendees
  for select using (true);

create policy "session_attendees_insert" on public.session_attendees
  for insert with check (user_id = auth.uid() or public.is_coordinator_or_admin());

-- ============================================================
-- PARTNER ENGAGEMENTS POLICIES
-- ============================================================

-- Partners see their own; coordinators/admins see all
create policy "partner_engagements_select" on public.partner_engagements
  for select using (
    partner_id = auth.uid() or
    public.is_initiative_lead(initiative_id) or
    public.is_coordinator_or_admin() or
    public.current_user_role() = 'BoardMember'
  );

-- Partners can apply
create policy "partner_engagements_insert" on public.partner_engagements
  for insert with check (
    partner_id = auth.uid() and
    public.current_user_role() = 'IndustryPartner'
  );

-- Coordinators/admins review
create policy "partner_engagements_update" on public.partner_engagements
  for update using (
    public.is_initiative_lead(initiative_id) or
    public.is_coordinator_or_admin()
  );

-- ============================================================
-- PARTNER AUDIT ENTRIES POLICIES
-- ============================================================

create policy "partner_audit_select" on public.partner_audit_entries
  for select using (
    exists(
      select 1 from public.partner_engagements pe
      where pe.id = engagement_id and (
        pe.partner_id = auth.uid() or
        public.is_coordinator_or_admin() or
        public.current_user_role() = 'BoardMember'
      )
    )
  );

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================

-- Users can only see their own notifications
create policy "notifications_select" on public.notifications
  for select using (user_id = auth.uid());

-- Users can mark their own notifications as read
create policy "notifications_update" on public.notifications
  for update using (user_id = auth.uid());

-- ============================================================
-- ACTIVITY LOG POLICIES
-- ============================================================

-- Members can see activity for their initiatives; coordinators see all
create policy "activity_log_select" on public.activity_log
  for select using (
    initiative_id is null or
    public.is_initiative_member(initiative_id) or
    public.is_coordinator_or_admin() or
    public.current_user_role() = 'BoardMember'
  );

-- ============================================================
-- CONGRESS EVENTS POLICIES
-- ============================================================

create policy "congress_events_select" on public.congress_events
  for select using (true); -- public

create policy "congress_events_insert" on public.congress_events
  for insert with check (public.is_coordinator_or_admin());

create policy "congress_events_update" on public.congress_events
  for update using (public.is_coordinator_or_admin());

-- ============================================================
-- CONGRESS TOPICS POLICIES
-- ============================================================

create policy "congress_topics_select" on public.congress_topics
  for select using (true); -- public voting requires visibility

create policy "congress_topics_insert" on public.congress_topics
  for insert with check (auth.uid() is not null); -- any logged-in user can submit

create policy "congress_topics_update" on public.congress_topics
  for update using (
    submitter_id = auth.uid() or
    public.is_coordinator_or_admin()
  );

-- ============================================================
-- CONGRESS SESSIONS POLICIES
-- ============================================================

create policy "congress_sessions_select" on public.congress_sessions
  for select using (true);

create policy "congress_sessions_insert" on public.congress_sessions
  for insert with check (public.is_coordinator_or_admin());

create policy "congress_sessions_update" on public.congress_sessions
  for update using (
    session_lead_id = auth.uid() or
    note_taker_id = auth.uid() or
    decision_capture_id = auth.uid() or
    public.is_coordinator_or_admin()
  );

-- ============================================================
-- CONGRESS DECISIONS POLICIES
-- ============================================================

create policy "congress_decisions_select" on public.congress_decisions
  for select using (true);

create policy "congress_decisions_insert" on public.congress_decisions
  for insert with check (
    public.is_coordinator_or_admin() or
    exists(
      select 1 from public.congress_sessions cs
      where cs.id = session_id and (
        cs.decision_capture_id = auth.uid() or
        cs.note_taker_id = auth.uid()
      )
    )
  );

create policy "congress_decisions_update" on public.congress_decisions
  for update using (public.is_coordinator_or_admin());

-- ============================================================
-- TOPIC VOTES POLICIES
-- ============================================================

create policy "topic_votes_select" on public.topic_votes
  for select using (true);

create policy "topic_votes_insert" on public.topic_votes
  for insert with check (user_id = auth.uid() and auth.uid() is not null);

create policy "topic_votes_delete" on public.topic_votes
  for delete using (user_id = auth.uid());
