-- ============================================================
-- MIGRATION 00004: VIEWS
-- Computed views for bureau dashboard and reporting
-- ============================================================

-- ============================================================
-- INITIATIVE HEALTH VIEW
-- Used by the bureau dashboard to show RAG status at-a-glance
-- RAG computation happens in application code (lib/rag.ts)
-- This view provides the raw data needed for that computation
-- ============================================================
create or replace view public.initiative_health as
select
  i.id,
  i.title,
  i.status,
  i.phase,
  i.pillar,
  i.lead_id,
  p.name as lead_name,
  p.avatar_url as lead_avatar_url,
  p.country as lead_country,
  -- Task counts
  count(distinct t.id) filter (where t.status != 'done') as open_tasks,
  count(distinct t.id) filter (where t.status = 'blocked') as blocked_tasks,
  count(distinct t.id) filter (where t.status = 'done') as completed_tasks,
  count(distinct t.id) as total_tasks,
  -- Milestone counts
  count(distinct m.id) filter (where m.status = 'overdue') as overdue_milestones,
  count(distinct m.id) filter (
    where m.status = 'in_progress'
    and m.target_date <= current_date + interval '7 days'
    and m.target_date > current_date
  ) as approaching_milestones,
  count(distinct m.id) filter (where m.status = 'completed') as completed_milestones,
  count(distinct m.id) as total_milestones,
  -- Member count
  count(distinct im.user_id) as member_count,
  -- Last activity
  max(al.created_at) as last_activity_at,
  -- Next upcoming milestone
  (
    select jsonb_build_object(
      'id', mm.id,
      'title', mm.title,
      'target_date', mm.target_date,
      'status', mm.status
    )
    from public.milestones mm
    where mm.initiative_id = i.id
      and mm.status in ('upcoming', 'in_progress')
    order by mm.target_date asc
    limit 1
  ) as next_milestone,
  -- Countries and cancer types
  i.countries,
  i.cancer_types,
  i.created_at,
  i.updated_at
from public.initiatives i
left join public.profiles p on p.id = i.lead_id
left join public.tasks t on t.initiative_id = i.id
left join public.milestones m on m.initiative_id = i.id
left join public.initiative_members im on im.initiative_id = i.id
left join public.activity_log al on al.initiative_id = i.id
where i.status = 'active'
group by
  i.id, i.title, i.status, i.phase, i.pillar,
  i.lead_id, p.name, p.avatar_url, p.country,
  i.countries, i.cancer_types, i.created_at, i.updated_at;

-- ============================================================
-- MEMBER ACTIVITY SUMMARY VIEW
-- Used by bureau to identify inactive members / nudge candidates
-- ============================================================
create or replace view public.member_activity_summary as
select
  pr.id as user_id,
  pr.name,
  pr.email,
  pr.role,
  pr.country,
  pr.last_active_at,
  pr.onboarding_completed,
  -- Initiatives they're part of
  count(distinct im.initiative_id) as initiative_count,
  -- Tasks assigned to them
  count(distinct t.id) filter (where t.status not in ('done')) as open_task_count,
  count(distinct t.id) filter (where t.status = 'blocked') as blocked_task_count,
  -- Tasks overdue
  count(distinct t.id) filter (
    where t.status not in ('done') and t.due_date < current_date
  ) as overdue_task_count,
  -- Last action taken
  max(al.created_at) as last_action_at,
  -- Days since last activity
  extract(day from now() - max(al.created_at))::int as days_since_activity
from public.profiles pr
left join public.initiative_members im on im.user_id = pr.id
left join public.tasks t on t.assignee_id = pr.id
left join public.activity_log al on al.actor_id = pr.id
group by pr.id, pr.name, pr.email, pr.role, pr.country,
         pr.last_active_at, pr.onboarding_completed;

-- ============================================================
-- CONGRESS DECISION PIPELINE VIEW
-- Shows decisions that need to be converted to tasks
-- ============================================================
create or replace view public.decision_pipeline as
select
  cd.id as decision_id,
  cd.description,
  cd.proposed_by,
  cd.deadline,
  cd.conversion_status,
  cd.captured_at,
  -- Session info
  cs.title as session_title,
  cs.start_time as session_time,
  -- Congress info
  ce.year as congress_year,
  ce.theme as congress_theme,
  -- Owner info
  p.name as owner_name,
  p.email as owner_email,
  -- Initiative info
  i.title as initiative_title,
  i.id as initiative_id,
  -- Linked task (if converted)
  t.id as task_id,
  t.title as task_title,
  t.status as task_status
from public.congress_decisions cd
left join public.congress_sessions cs on cs.id = cd.session_id
left join public.congress_events ce on ce.id = cs.congress_id
left join public.profiles p on p.id = cd.owner_id
left join public.initiatives i on i.id = cd.initiative_id
left join public.tasks t on t.id = cd.converted_to_task_id
order by cd.captured_at desc;

-- ============================================================
-- RESOURCE LIBRARY VIEW
-- Enriched resource view with uploader info for the evidence repository
-- ============================================================
create or replace view public.resource_library as
select
  r.id,
  r.title,
  r.type,
  r.version,
  r.language,
  r.translation_status,
  r.file_url,
  r.external_url,
  r.file_size_bytes,
  r.mime_type,
  r.is_partner_contribution,
  r.partner_organization,
  r.cancer_types,
  r.countries,
  r.tags,
  r.created_at,
  -- Initiative info
  i.id as initiative_id,
  i.title as initiative_title,
  i.pillar as initiative_pillar,
  -- Uploader info
  p.id as uploader_id,
  p.name as uploader_name,
  p.avatar_url as uploader_avatar_url,
  p.role as uploader_role,
  p.organization as uploader_organization,
  -- Previous version info
  r.supersedes_id
from public.resources r
left join public.initiatives i on i.id = r.initiative_id
left join public.profiles p on p.id = r.uploaded_by_id
order by r.created_at desc;
