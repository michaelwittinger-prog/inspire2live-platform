-- ============================================================
-- MIGRATION 00006: WP-3 INITIATIVE SEED PACK
-- 3 realistic initiatives with full workspace data
-- Uses fixed UUIDs; safe to re-run (ON CONFLICT DO NOTHING)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- PERSONA UUIDs (also referenced in 00005_seed_data.sql)
-- Aligned with demo persona set: Sophie, Maria, Peter, Kai, Nadia
-- ────────────────────────────────────────────────────────────
do $$
declare
  -- Personas
  sophie  uuid := 'a0000001-0000-0000-0000-000000000001';
  maria   uuid := 'a0000001-0000-0000-0000-000000000002';
  peter   uuid := 'a0000001-0000-0000-0000-000000000003';
  kai     uuid := 'a0000001-0000-0000-0000-000000000004';
  nadia   uuid := 'a0000001-0000-0000-0000-000000000005';

  -- Initiative IDs: preferred UUIDs for the INSERT; ON CONFLICT (slug) handles
  -- the case where production already has these slugs with different UUIDs.
  -- After each insert we resolve the actual DB UUID (ours or existing).
  init_mced  uuid := 'b0000001-0000-0000-0000-000000000001';
  init_mdx   uuid := 'b0000001-0000-0000-0000-000000000002';
  init_prom  uuid := 'b0000001-0000-0000-0000-000000000003';

begin

-- ────────────────────────────────────────────────────────────
-- AUTH USERS (local dev only; skip if already exist)
-- ────────────────────────────────────────────────────────────
insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
values
  (sophie, 'sophie@inspire2live.org',  '{"name":"Sophie van der Berg","role":"HubCoordinator","country":"NL"}'::jsonb, now(), now()),
  (maria,  'maria@inspire2live.org',   '{"name":"Maria Hofer","role":"PatientAdvocate","country":"AT"}'::jsonb,       now(), now()),
  (peter,  'peter@inspire2live.org',   '{"name":"Peter Lindqvist","role":"BoardMember","country":"SE"}'::jsonb,       now(), now()),
  (kai,    'kai@inspire2live.org',     '{"name":"Dr. Kai Bergmann","role":"Researcher","country":"DE"}'::jsonb,       now(), now()),
  (nadia,  'nadia@inspire2live.org',   '{"name":"Dr. Nadia Rousseau","role":"Clinician","country":"FR"}'::jsonb,      now(), now())
on conflict (id) do nothing;

-- Profiles are auto-created by trigger on_auth_user_created
-- But enrich them manually to ensure completeness
update public.profiles set
  name = 'Sophie van der Berg',
  role = 'HubCoordinator',
  organization = 'Inspire2Live Foundation',
  country = 'NL',
  city = 'Amsterdam',
  expertise_tags = ARRAY['coordination','patient-engagement','research-translation'],
  bio = 'Hub Coordinator for the Netherlands. Passionate about connecting patients with researchers.',
  onboarding_completed = true,
  last_active_at = now() - interval '1 day'
where id = sophie;

update public.profiles set
  name = 'Maria Hofer',
  role = 'PatientAdvocate',
  organization = 'Austrian Cancer Aid',
  country = 'AT',
  city = 'Vienna',
  expertise_tags = ARRAY['breast-cancer','patient-voice','advocacy'],
  bio = 'Patient advocate with 8 years experience in breast cancer communities.',
  onboarding_completed = true,
  last_active_at = now() - interval '3 days'
where id = maria;

update public.profiles set
  name = 'Peter Lindqvist',
  role = 'BoardMember',
  organization = 'Nordic Oncology Foundation',
  country = 'SE',
  city = 'Stockholm',
  expertise_tags = ARRAY['governance','funding','strategy'],
  bio = 'Board member focused on sustainable funding for patient-led research.',
  onboarding_completed = true,
  last_active_at = now() - interval '10 days'
where id = peter;

update public.profiles set
  name = 'Dr. Kai Bergmann',
  role = 'Researcher',
  organization = 'Charité Berlin',
  country = 'DE',
  city = 'Berlin',
  expertise_tags = ARRAY['molecular-diagnostics','liquid-biopsy','MCED'],
  bio = 'Translational researcher specialising in multi-cancer early detection technologies.',
  onboarding_completed = true,
  last_active_at = now() - interval '2 days'
where id = kai;

update public.profiles set
  name = 'Dr. Nadia Rousseau',
  role = 'Clinician',
  organization = 'Institut Gustave Roussy',
  country = 'FR',
  city = 'Paris',
  expertise_tags = ARRAY['clinical-trials','outcomes-research','breast-cancer'],
  bio = 'Oncologist and clinical trialist with focus on patient-reported outcomes.',
  onboarding_completed = true,
  last_active_at = now() - interval '1 day'
where id = nadia;

-- ────────────────────────────────────────────────────────────
-- INITIATIVE 1: Multi-Cancer Early Detection
-- ────────────────────────────────────────────────────────────
insert into public.initiatives
  (id, title, slug, description, status, phase, pillar, lead_id, cancer_types, countries, objectives)
values (
  init_mced,
  'Multi-Cancer Early Detection',
  'multi-cancer-early-detection',
  'Accelerating patient access to MCED blood tests across Europe by connecting patient advocates, researchers, and policymakers. We evaluate existing MCED technologies, build evidence dossiers, and advocate for equitable reimbursement frameworks.',
  'active',
  'execution',
  'inspire2live',
  kai,
  ARRAY['breast','colorectal','lung','pancreatic','ovarian'],
  ARRAY['NL','DE','FR','AT','BE'],
  '["Evaluate top-5 MCED assays against patient-centred criteria","Build a pan-European evidence dossier by Q3 2026","Engage 3 national HTA bodies with a unified patient position","Publish open-access policy brief on equitable reimbursement"]'::jsonb
) on conflict (slug) do nothing;
-- Resolve actual UUID (handles case where slug existed with a different UUID)
init_mced := (select id from public.initiatives where slug = 'multi-cancer-early-detection');

-- Members
insert into public.initiative_members (initiative_id, user_id, role)
values
  (init_mced, kai,    'lead'),
  (init_mced, sophie, 'contributor'),
  (init_mced, maria,  'contributor'),
  (init_mced, peter,  'reviewer')
on conflict (initiative_id, user_id) do nothing;

-- Milestones
insert into public.milestones
  (id, initiative_id, title, description, status, target_date, completed_date, evidence_required, sort_order)
values
  ('c1000001-0000-0000-0000-000000000001', init_mced,
   'Landscape review of MCED assays',
   'Systematic review of commercially available MCED assays: sensitivity, specificity, cancer-type coverage, CE mark status.',
   'completed', '2025-09-30', '2025-09-28', true, 1),
  ('c1000001-0000-0000-0000-000000000002', init_mced,
   'Patient preference survey — 500 respondents',
   'Pan-European online survey on patient priorities for MCED: accessibility, cost sensitivity, result turnaround.',
   'completed', '2025-12-15', '2025-12-12', true, 2),
  ('c1000001-0000-0000-0000-000000000003', init_mced,
   'HTA engagement — NL, DE, FR',
   'Formal submissions to Dutch ZIN, German IQWiG, and French HAS with consolidated patient position paper.',
   'in_progress', '2026-04-30', null, true, 3),
  ('c1000001-0000-0000-0000-000000000004', init_mced,
   'Open-access policy brief published',
   'Peer-reviewed policy brief on equitable MCED reimbursement submitted to Health Policy journal.',
   'upcoming', '2026-07-31', null, false, 4)
on conflict (id) do nothing;

-- Tasks
insert into public.tasks
  (id, initiative_id, milestone_id, title, status, priority, assignee_id, reporter_id, due_date)
values
  ('d1000001-0000-0000-0000-000000000001', init_mced, 'c1000001-0000-0000-0000-000000000003',
   'Draft NL patient position paper for ZIN submission', 'in_progress', 'high', kai, sophie, '2026-03-15'),
  ('d1000001-0000-0000-0000-000000000002', init_mced, 'c1000001-0000-0000-0000-000000000003',
   'Translate position paper to German for IQWiG', 'todo', 'medium', nadia, kai, '2026-03-28'),
  ('d1000001-0000-0000-0000-000000000003', init_mced, 'c1000001-0000-0000-0000-000000000003',
   'Schedule HTA liaison meeting — French HAS', 'blocked', 'urgent', sophie, kai, '2026-03-01'),
  ('d1000001-0000-0000-0000-000000000004', init_mced, 'c1000001-0000-0000-0000-000000000004',
   'Write policy brief introduction and methodology', 'todo', 'medium', kai, kai, '2026-05-10'),
  ('d1000001-0000-0000-0000-000000000005', init_mced, null,
   'Update initiative website with survey results', 'done', 'low', maria, sophie, '2026-01-20')
on conflict (id) do nothing;

-- Resources
insert into public.resources
  (id, title, type, initiative_id, uploaded_by_id, version, language, translation_status, cancer_types, is_partner_contribution)
values
  ('e1000001-0000-0000-0000-000000000001',
   'MCED Landscape Review 2025 — Full Report', 'report', init_mced, kai, 2, 'en', 'original',
   ARRAY['breast','colorectal','lung','pancreatic'], false),
  ('e1000001-0000-0000-0000-000000000002',
   'Patient Preference Survey — Raw Data (n=512)', 'data', init_mced, sophie, 1, 'en', 'original',
   ARRAY['breast','colorectal','lung','pancreatic','ovarian'], false),
  ('e1000001-0000-0000-0000-000000000003',
   'HTA Submission Template — EU Harmonised', 'template', init_mced, nadia, 1, 'en', 'needs_translation',
   ARRAY[]::text[], false)
on conflict (id) do nothing;

-- Discussions
insert into public.discussions
  (id, initiative_id, author_id, title, content, thread_type, is_pinned, reply_count)
values
  ('f1000001-0000-0000-0000-000000000001', init_mced, kai,
   'Decision: Prioritise ZIN engagement first — rationale',
   'After reviewing the HTA landscape, we agreed to prioritise the Dutch ZIN submission first because the Netherlands has the most advanced MCED pilot programme (NELSON trial legacy) and a clear reimbursement pathway. Germany and France follow in Q2. This sequencing was approved by the team on 2026-01-15. Please confirm your agreement in replies.',
   'decision', true, 3),
  ('f1000001-0000-0000-0000-000000000002', init_mced, sophie,
   'Blocker: HAS liaison contact has not responded — need escalation',
   'We sent the meeting request to our HAS contact (Marie-Claire Dubois) on 2026-02-03 and have had no response. The ZIN meeting is booked but the French track is stalled. Does anyone have a secondary contact at HAS? This is blocking Milestone 3. Escalating.',
   'blocker', false, 1),
  ('f1000001-0000-0000-0000-000000000003', init_mced, maria,
   'Idea: Add patient testimonial videos to the policy brief',
   'We could include 2-3 short patient testimonial clips (90 seconds each) as supplementary material to the policy brief. This would make the HTA submissions more patient-centric and harder to dismiss. I can coordinate with the 3 patients who participated in the preference survey. Thoughts?',
   'idea', false, 2)
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────
-- INITIATIVE 2: Molecular Diagnostics Access EU
-- ────────────────────────────────────────────────────────────
insert into public.initiatives
  (id, title, slug, description, status, phase, pillar, lead_id, cancer_types, countries, objectives)
values (
  init_mdx,
  'Molecular Diagnostics Access EU',
  'molecular-diagnostics-access-eu',
  'Closing the access gap for molecular diagnostic testing (NGS, liquid biopsy) for cancer patients across Central and Eastern Europe. We map availability, cost-barriers, and lab capacity, then co-design a policy toolkit with patient advocates and healthcare systems.',
  'active',
  'planning',
  'inspire2live',
  nadia,
  ARRAY['lung','colorectal','breast','haematological'],
  ARRAY['PL','CZ','HU','RO','SK'],
  '["Map molecular diagnostics availability across 5 CEE countries","Identify top-3 systemic barriers per country through patient and clinician interviews","Co-design a policy toolkit with 15 patient and clinical stakeholders","Submit toolkit to European Cancer Organisation by end 2026"]'::jsonb
) on conflict (slug) do nothing;
-- Resolve actual UUID
init_mdx := (select id from public.initiatives where slug = 'molecular-diagnostics-access-eu');

-- Members
insert into public.initiative_members (initiative_id, user_id, role)
values
  (init_mdx, nadia,  'lead'),
  (init_mdx, kai,    'contributor'),
  (init_mdx, sophie, 'reviewer'),
  (init_mdx, maria,  'contributor')
on conflict (initiative_id, user_id) do nothing;

-- Milestones
insert into public.milestones
  (id, initiative_id, title, description, status, target_date, completed_date, evidence_required, sort_order)
values
  ('c2000001-0000-0000-0000-000000000001', init_mdx,
   'Country mapping baseline — 5 CEE countries',
   'Structured data collection on NGS/liquid biopsy availability, reimbursement status, average patient wait time, and lab capacity per country.',
   'in_progress', '2026-05-31', null, true, 1),
  ('c2000001-0000-0000-0000-000000000002', init_mdx,
   'Stakeholder interview programme — 30 interviews',
   '15 patients and 15 clinicians across 5 countries. Semi-structured interviews on access barriers and workarounds.',
   'upcoming', '2026-07-31', null, true, 2),
  ('c2000001-0000-0000-0000-000000000003', init_mdx,
   'Policy toolkit v1.0 draft',
   'Co-designed with advisory group. Includes country profiles, barrier analysis, model policy recommendations, and patient case studies.',
   'upcoming', '2026-10-31', null, false, 3),
  ('c2000001-0000-0000-0000-000000000004', init_mdx,
   'ECO submission and publication',
   'Formal submission to European Cancer Organisation and open-access publication on initiative website.',
   'upcoming', '2026-12-15', null, false, 4)
on conflict (id) do nothing;

-- Tasks
insert into public.tasks
  (id, initiative_id, milestone_id, title, status, priority, assignee_id, reporter_id, due_date)
values
  ('d2000001-0000-0000-0000-000000000001', init_mdx, 'c2000001-0000-0000-0000-000000000001',
   'Design country mapping data collection template', 'done', 'high', nadia, nadia, '2026-02-01'),
  ('d2000001-0000-0000-0000-000000000002', init_mdx, 'c2000001-0000-0000-0000-000000000001',
   'Collect Poland and Czech Republic baseline data', 'in_progress', 'urgent', kai, nadia, '2026-03-31'),
  ('d2000001-0000-0000-0000-000000000003', init_mdx, 'c2000001-0000-0000-0000-000000000001',
   'Collect Hungary, Romania, Slovakia baseline data', 'todo', 'high', nadia, nadia, '2026-04-30'),
  ('d2000001-0000-0000-0000-000000000004', init_mdx, 'c2000001-0000-0000-0000-000000000002',
   'Recruit patient interviewees — Poland (3 patients)', 'todo', 'medium', maria, nadia, '2026-05-15'),
  ('d2000001-0000-0000-0000-000000000005', init_mdx, null,
   'Set up shared project workspace on platform', 'done', 'low', sophie, nadia, '2026-01-31')
on conflict (id) do nothing;

-- Resources
insert into public.resources
  (id, title, type, initiative_id, uploaded_by_id, version, language, translation_status, cancer_types, is_partner_contribution)
values
  ('e2000001-0000-0000-0000-000000000001',
   'Country Mapping Template v2 — Data Collection Form', 'template', init_mdx, nadia, 2, 'en', 'needs_translation',
   ARRAY[]::text[], false),
  ('e2000001-0000-0000-0000-000000000002',
   'Poland NGS Reimbursement Status — Desk Research', 'document', init_mdx, kai, 1, 'en', 'original',
   ARRAY['lung','colorectal'], false)
on conflict (id) do nothing;

-- Discussions
insert into public.discussions
  (id, initiative_id, author_id, title, content, thread_type, is_pinned, reply_count)
values
  ('f2000001-0000-0000-0000-000000000001', init_mdx, nadia,
   'Question: Should we include liquid biopsy separately from NGS in the mapping?',
   'The current template treats NGS and liquid biopsy as one category under "molecular diagnostics". However, reimbursement and availability can differ significantly — some countries reimburse tissue NGS but not ctDNA liquid biopsy. I propose we split these into two rows per country. Feedback welcome before we finalise the template this week.',
   'question', true, 4),
  ('f2000001-0000-0000-0000-000000000002', init_mdx, kai,
   'Idea: Partner with ESMO patient working group for interviewee recruitment',
   'ESMO has an active patient working group with members across CEE. If we approach them as a co-recruitment partner for the interview programme, we could reach high-quality respondents much faster and add legitimacy to the project. I have a contact at ESMO from the MCED initiative — happy to make the intro.',
   'idea', false, 2),
  ('f2000001-0000-0000-0000-000000000003', init_mdx, maria,
   'General: Timeline check — are we on track for milestone 1?',
   'Quick check-in: we are 6 weeks into the initiative. The Poland and Czech Republic data collection is in progress (Kai is leading) but Hungary/Romania/Slovakia have not started. Given the May target date, should we consider parallel workstreams or bring in an additional contributor?',
   'general', false, 1)
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────
-- INITIATIVE 3: Patient-Reported Outcome Measures in Oncology
-- ────────────────────────────────────────────────────────────
insert into public.initiatives
  (id, title, slug, description, status, phase, pillar, lead_id, cancer_types, countries, objectives)
values (
  init_prom,
  'Patient-Reported Outcome Measures in Oncology',
  'patient-reported-outcome-measures',
  'Ensuring patient-reported outcomes (PROMs) are routinely collected, analysed, and used to improve clinical decisions in European oncology centres. We co-develop a minimum PROM dataset with patients and clinicians, pilot it in 4 centres, and publish implementation guidance.',
  'active',
  'execution',
  'world_campus',
  nadia,
  ARRAY['breast','lung','haematological','colorectal'],
  ARRAY['FR','NL','DE','IT'],
  '["Co-develop a minimum PROM dataset validated by at least 20 patients and 10 clinicians","Pilot the dataset in 4 oncology centres across 4 countries","Analyse 6-month pilot data and publish implementation guidance","Present findings at European Congress 2026"]'::jsonb
) on conflict (slug) do nothing;
-- Resolve actual UUID
init_prom := (select id from public.initiatives where slug = 'patient-reported-outcome-measures');

-- Members
insert into public.initiative_members (initiative_id, user_id, role)
values
  (init_prom, nadia,  'lead'),
  (init_prom, maria,  'contributor'),
  (init_prom, sophie, 'contributor'),
  (init_prom, peter,  'reviewer'),
  (init_prom, kai,    'contributor')
on conflict (initiative_id, user_id) do nothing;

-- Milestones
insert into public.milestones
  (id, initiative_id, title, description, status, target_date, completed_date, evidence_required, sort_order)
values
  ('c3000001-0000-0000-0000-000000000001', init_prom,
   'Co-design workshops — minimum PROM dataset',
   'Two online co-design workshops with 20 patient advocates and 10 oncologists to agree on a core 12-item PROM dataset.',
   'completed', '2025-11-30', '2025-11-25', true, 1),
  ('c3000001-0000-0000-0000-000000000002', init_prom,
   'Digital PROM tool configured and validated',
   'REDCap-based PROM collection tool built, translated into FR/NL/DE/IT, and validated by user testing with 5 patients per site.',
   'completed', '2026-01-31', '2026-01-29', true, 2),
  ('c3000001-0000-0000-0000-000000000003', init_prom,
   '4-centre pilot launch',
   'Live PROM collection at Gustave Roussy (FR), NKI (NL), Charité (DE), and IEO Milan (IT).',
   'in_progress', '2026-02-28', null, false, 3),
  ('c3000001-0000-0000-0000-000000000004', init_prom,
   '6-month pilot analysis and guidance publication',
   'Statistical analysis of PROM data, qualitative thematic analysis of implementation barriers, publication of guidance document.',
   'upcoming', '2026-08-31', null, true, 4),
  ('c3000001-0000-0000-0000-000000000005', init_prom,
   'European Congress 2026 presentation',
   'Oral presentation of pilot findings at ESMO Congress 2026, Berlin.',
   'upcoming', '2026-09-15', null, false, 5)
on conflict (id) do nothing;

-- Tasks
insert into public.tasks
  (id, initiative_id, milestone_id, title, status, priority, assignee_id, reporter_id, due_date)
values
  ('d3000001-0000-0000-0000-000000000001', init_prom, 'c3000001-0000-0000-0000-000000000003',
   'Confirm patient coordinator contacts at all 4 pilot sites', 'done', 'urgent', nadia, nadia, '2026-02-10'),
  ('d3000001-0000-0000-0000-000000000002', init_prom, 'c3000001-0000-0000-0000-000000000003',
   'Train site staff on REDCap PROM tool — NL and DE', 'in_progress', 'high', sophie, nadia, '2026-02-28'),
  ('d3000001-0000-0000-0000-000000000003', init_prom, 'c3000001-0000-0000-0000-000000000003',
   'Train site staff on REDCap PROM tool — FR and IT', 'in_progress', 'high', nadia, nadia, '2026-02-28'),
  ('d3000001-0000-0000-0000-000000000004', init_prom, 'c3000001-0000-0000-0000-000000000003',
   'First data quality check — 30-day mark', 'todo', 'medium', kai, nadia, '2026-03-28'),
  ('d3000001-0000-0000-0000-000000000005', init_prom, 'c3000001-0000-0000-0000-000000000004',
   'Develop statistical analysis plan for pilot data', 'review', 'medium', kai, nadia, '2026-04-15'),
  ('d3000001-0000-0000-0000-000000000006', init_prom, null,
   'Submit ESMO Congress abstract by deadline', 'todo', 'urgent', nadia, peter, '2026-03-01')
on conflict (id) do nothing;

-- Resources
insert into public.resources
  (id, title, type, initiative_id, uploaded_by_id, version, language, translation_status, cancer_types, is_partner_contribution, partner_organization)
values
  ('e3000001-0000-0000-0000-000000000001',
   'Minimum PROM Dataset — Final 12-Item Instrument', 'document', init_prom, nadia, 3, 'en', 'original',
   ARRAY['breast','lung','haematological','colorectal'], false, null),
  ('e3000001-0000-0000-0000-000000000002',
   'PROM Instrument — French Translation (validated)', 'document', init_prom, nadia, 1, 'fr', 'translated',
   ARRAY['breast','lung','haematological','colorectal'], false, null),
  ('e3000001-0000-0000-0000-000000000003',
   'REDCap Training Recording — Site Onboarding Session', 'recording', init_prom, sophie, 1, 'en', 'original',
   ARRAY[]::text[], false, null),
  ('e3000001-0000-0000-0000-000000000004',
   'Patient Advisory Group Meeting Notes — Co-design Workshop 2', 'document', init_prom, maria, 1, 'en', 'needs_translation',
   ARRAY[]::text[], false, null),
  ('e3000001-0000-0000-0000-000000000005',
   'REDCap PROM Module — Configuration Export', 'data', init_prom, kai, 2, 'en', 'original',
   ARRAY[]::text[], true, 'REDCap Foundation')
on conflict (id) do nothing;

-- Discussions
insert into public.discussions
  (id, initiative_id, author_id, title, content, thread_type, is_pinned, reply_count)
values
  ('f3000001-0000-0000-0000-000000000001', init_prom, nadia,
   'Decision: Charité delayed start — adjusted timeline approved',
   'The Charité Berlin site had an ethics committee re-review request that delayed their pilot start by 3 weeks. After discussion with the full team and Peter as reviewer, we have approved a revised timeline: Charité starts 21 Feb instead of 3 Feb. All other sites remain on track. The 6-month analysis milestone (Aug 31) is unchanged.',
   'decision', true, 5),
  ('f3000001-0000-0000-0000-000000000002', init_prom, maria,
   'Question: How do we handle patients who decline PROM after consenting?',
   'We have had 2 cases at NKI (NL) where patients consented to PROM collection but then declined to complete at the first timepoint. Should these be marked as withdrawn, missing, or non-evaluable? This affects the analysis plan. We need a protocol clarification before the 30-day quality check.',
   'question', false, 3),
  ('f3000001-0000-0000-0000-000000000003', init_prom, kai,
   'General: Statistical analysis plan draft ready for review',
   'I have uploaded the draft SAP (Statistical Analysis Plan) for the 6-month pilot analysis to the Evidence tab. It covers primary and secondary PROM endpoints, missing data strategy (MICE), and patient subgroup analyses. Please review by 25 April — particularly Maria for the patient perspective on meaningful change thresholds.',
   'general', false, 2)
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────
-- ACTIVITY LOG: seed realistic activity for all 3 initiatives
-- ────────────────────────────────────────────────────────────
insert into public.activity_log (actor_id, initiative_id, action, entity_type, entity_id, metadata)
values
  (kai,    init_mced, 'milestone_completed', 'milestone', 'c1000001-0000-0000-0000-000000000001', '{"title":"Landscape review completed"}'),
  (sophie, init_mced, 'task_assigned',       'task',      'd1000001-0000-0000-0000-000000000001', '{"assignee":"Dr. Kai Bergmann"}'),
  (kai,    init_mced, 'resource_uploaded',   'resource',  'e1000001-0000-0000-0000-000000000001', '{"title":"MCED Landscape Review 2025"}'),
  (kai,    init_mced, 'discussion_started',  'discussion','f1000001-0000-0000-0000-000000000001', '{"thread_type":"decision"}'),
  (nadia,  init_mdx,  'initiative_joined',   'initiative', init_mdx, '{"role":"lead"}'),
  (kai,    init_mdx,  'task_updated',        'task',      'd2000001-0000-0000-0000-000000000002', '{"status":"in_progress"}'),
  (nadia,  init_prom, 'milestone_completed', 'milestone', 'c3000001-0000-0000-0000-000000000001', '{"title":"Co-design workshops completed"}'),
  (nadia,  init_prom, 'milestone_completed', 'milestone', 'c3000001-0000-0000-0000-000000000002', '{"title":"Digital PROM tool validated"}'),
  (sophie, init_prom, 'task_updated',        'task',      'd3000001-0000-0000-0000-000000000002', '{"status":"in_progress"}')
on conflict do nothing;

end $$;
