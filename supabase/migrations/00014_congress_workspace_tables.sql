-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 00014: Congress Workspace operational tables
-- Adds persistent backing for all workspace tabs:
--   workstreams · milestones · tasks · RAID · live-ops · follow-up · messages · approvals
-- ─────────────────────────────────────────────────────────────────────────────

-- ── congress_workstreams ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.congress_workstreams (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  congress_id  uuid NOT NULL REFERENCES public.congress_events(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  owner_role   text,
  health       text NOT NULL DEFAULT 'on_track',
  progress_pct integer NOT NULL DEFAULT 0,
  next_milestone text,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT congress_workstreams_health_check CHECK (health IN ('on_track','at_risk','blocked')),
  CONSTRAINT congress_workstreams_progress_check CHECK (progress_pct >= 0 AND progress_pct <= 100)
);
CREATE INDEX IF NOT EXISTS congress_workstreams_congress_idx ON public.congress_workstreams(congress_id);

-- ── congress_milestones ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.congress_milestones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  congress_id     uuid NOT NULL REFERENCES public.congress_events(id) ON DELETE CASCADE,
  workstream_id   uuid REFERENCES public.congress_workstreams(id) ON DELETE SET NULL,
  title           text NOT NULL,
  description     text,
  milestone_date  date NOT NULL,
  status          text NOT NULL DEFAULT 'upcoming',
  owner_id        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT congress_milestones_status_check CHECK (status IN ('upcoming','in_progress','completed','cancelled'))
);
CREATE INDEX IF NOT EXISTS congress_milestones_congress_idx  ON public.congress_milestones(congress_id);
CREATE INDEX IF NOT EXISTS congress_milestones_date_idx      ON public.congress_milestones(milestone_date);

-- ── congress_tasks ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.congress_tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  congress_id     uuid NOT NULL REFERENCES public.congress_events(id) ON DELETE CASCADE,
  workstream_id   uuid REFERENCES public.congress_workstreams(id) ON DELETE SET NULL,
  title           text NOT NULL,
  description     text,
  status          text NOT NULL DEFAULT 'todo',
  priority        text NOT NULL DEFAULT 'medium',
  lane            text NOT NULL DEFAULT 'next',
  due_date        date,
  owner_id        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  owner_name      text,  -- denormalised for demo/pre-profile scenario
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT congress_tasks_status_check   CHECK (status   IN ('todo','in_progress','blocked','done')),
  CONSTRAINT congress_tasks_priority_check CHECK (priority IN ('low','medium','high','urgent')),
  CONSTRAINT congress_tasks_lane_check     CHECK (lane     IN ('now','next','later'))
);
CREATE INDEX IF NOT EXISTS congress_tasks_congress_idx    ON public.congress_tasks(congress_id);
CREATE INDEX IF NOT EXISTS congress_tasks_workstream_idx  ON public.congress_tasks(workstream_id);
CREATE INDEX IF NOT EXISTS congress_tasks_status_idx      ON public.congress_tasks(status);

-- ── congress_task_dependencies ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.congress_task_dependencies (
  task_id         uuid NOT NULL REFERENCES public.congress_tasks(id) ON DELETE CASCADE,
  depends_on_id   uuid NOT NULL REFERENCES public.congress_tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, depends_on_id)
);

-- ── congress_raid_items ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.congress_raid_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  congress_id  uuid NOT NULL REFERENCES public.congress_events(id) ON DELETE CASCADE,
  type         text NOT NULL DEFAULT 'risk',
  title        text NOT NULL,
  description  text,
  status       text NOT NULL DEFAULT 'open',
  priority     text NOT NULL DEFAULT 'medium',
  owner_role   text,
  owner_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT congress_raid_type_check     CHECK (type     IN ('risk','assumption','issue','decision')),
  CONSTRAINT congress_raid_status_check   CHECK (status   IN ('open','mitigating','resolved')),
  CONSTRAINT congress_raid_priority_check CHECK (priority IN ('low','medium','high'))
);
CREATE INDEX IF NOT EXISTS congress_raid_congress_idx ON public.congress_raid_items(congress_id);

-- ── congress_live_ops_updates ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.congress_live_ops_updates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  congress_id  uuid NOT NULL REFERENCES public.congress_events(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  status       text NOT NULL DEFAULT 'open',
  severity     text NOT NULL DEFAULT 'sev3',
  owner_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT congress_live_ops_status_check   CHECK (status   IN ('open','monitoring','resolved')),
  CONSTRAINT congress_live_ops_severity_check CHECK (severity IN ('sev1','sev2','sev3'))
);
CREATE INDEX IF NOT EXISTS congress_live_ops_congress_idx ON public.congress_live_ops_updates(congress_id);

-- ── congress_follow_up_actions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.congress_follow_up_actions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  congress_id   uuid NOT NULL REFERENCES public.congress_events(id) ON DELETE CASCADE,
  decision_id   uuid REFERENCES public.congress_decisions(id) ON DELETE SET NULL,
  title         text NOT NULL,
  description   text,
  status        text NOT NULL DEFAULT 'todo',
  priority      text NOT NULL DEFAULT 'medium',
  owner_id      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  owner_name    text,
  due_date      date,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT congress_follow_up_status_check   CHECK (status   IN ('todo','in_progress','done','cancelled')),
  CONSTRAINT congress_follow_up_priority_check CHECK (priority IN ('low','medium','high','urgent'))
);
CREATE INDEX IF NOT EXISTS congress_follow_up_congress_idx ON public.congress_follow_up_actions(congress_id);

-- ── congress_messages ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.congress_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  congress_id  uuid NOT NULL REFERENCES public.congress_events(id) ON DELETE CASCADE,
  thread_type  text NOT NULL DEFAULT 'update',
  subject      text NOT NULL,
  body         text NOT NULL,
  author_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name  text,
  labels       text[] NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT congress_messages_type_check CHECK (thread_type IN ('update','action_required','decision','fyi'))
);
CREATE INDEX IF NOT EXISTS congress_messages_congress_idx ON public.congress_messages(congress_id);
CREATE INDEX IF NOT EXISTS congress_messages_created_idx  ON public.congress_messages(created_at DESC);

-- ── congress_approval_requests ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.congress_approval_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  congress_id      uuid NOT NULL REFERENCES public.congress_events(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  status           text NOT NULL DEFAULT 'submitted',
  requested_by_id  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  requested_by_name text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT congress_approval_status_check CHECK (status IN ('submitted','in_review','approved','rejected'))
);
CREATE INDEX IF NOT EXISTS congress_approval_congress_idx ON public.congress_approval_requests(congress_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.congress_workstreams         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.congress_milestones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.congress_tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.congress_task_dependencies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.congress_raid_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.congress_live_ops_updates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.congress_follow_up_actions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.congress_messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.congress_approval_requests   ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "auth_read_workstreams"      ON public.congress_workstreams        FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_milestones"       ON public.congress_milestones          FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_tasks"            ON public.congress_tasks               FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_task_deps"        ON public.congress_task_dependencies   FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_raid"             ON public.congress_raid_items          FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_live_ops"         ON public.congress_live_ops_updates    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_follow_up"        ON public.congress_follow_up_actions   FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_messages"         ON public.congress_messages            FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_approvals"        ON public.congress_approval_requests   FOR SELECT USING (auth.uid() IS NOT NULL);

-- Coordinators/admins can do everything
CREATE POLICY "coord_manage_workstreams"   ON public.congress_workstreams        FOR ALL USING (public.is_coordinator_or_admin());
CREATE POLICY "coord_manage_milestones"    ON public.congress_milestones          FOR ALL USING (public.is_coordinator_or_admin());
CREATE POLICY "coord_manage_tasks"         ON public.congress_tasks               FOR ALL USING (public.is_coordinator_or_admin());
CREATE POLICY "coord_manage_task_deps"     ON public.congress_task_dependencies   FOR ALL USING (public.is_coordinator_or_admin());
CREATE POLICY "coord_manage_raid"          ON public.congress_raid_items          FOR ALL USING (public.is_coordinator_or_admin());
CREATE POLICY "coord_manage_live_ops"      ON public.congress_live_ops_updates    FOR ALL USING (public.is_coordinator_or_admin());
CREATE POLICY "coord_manage_follow_up"     ON public.congress_follow_up_actions   FOR ALL USING (public.is_coordinator_or_admin());
CREATE POLICY "coord_manage_messages"      ON public.congress_messages            FOR ALL USING (public.is_coordinator_or_admin());
CREATE POLICY "coord_manage_approvals"     ON public.congress_approval_requests   FOR ALL USING (public.is_coordinator_or_admin());

-- ── Seed: workstreams for 2026 ────────────────────────────────────────────────
INSERT INTO public.congress_workstreams (id, congress_id, title, description, owner_role, health, progress_pct, next_milestone, sort_order)
VALUES
  (
    '00000000-ws01-0000-0000-000000000001',
    '00000000-c003-0000-0000-000000000003',
    'Programme & Agenda',
    'Owns the full scientific and session programme from topic call to finalised agenda.',
    'Congress Lead', 'on_track', 62,
    'Agenda draft v0.3 published',
    1
  ),
  (
    '00000000-ws02-0000-0000-000000000002',
    '00000000-c003-0000-0000-000000000003',
    'Operations & Logistics',
    'Venue, AV, catering, transport, and day-of execution runbook.',
    'Ops Lead', 'at_risk', 48,
    'Venue runbook signed off',
    2
  ),
  (
    '00000000-ws03-0000-0000-000000000003',
    '00000000-c003-0000-0000-000000000003',
    'Comms & Community',
    'External messaging, topic call campaign, social, and attendee communications.',
    'Comms Lead', 'on_track', 55,
    'Launch topic call campaign',
    3
  ),
  (
    '00000000-ws04-0000-0000-000000000004',
    '00000000-c003-0000-0000-000000000003',
    'Compliance & Neutrality',
    'Sponsor neutrality review, regulatory compliance, and documentation sign-off.',
    'Compliance Reviewer', 'blocked', 20,
    'Sponsor neutrality review complete',
    4
  )
ON CONFLICT DO NOTHING;

-- ── Seed: milestones for 2026 ─────────────────────────────────────────────────
INSERT INTO public.congress_milestones (id, congress_id, workstream_id, title, milestone_date, status, sort_order)
VALUES
  ('00000000-ml01-0000-0000-000000000001', '00000000-c003-0000-0000-000000000003', '00000000-ws03-0000-0000-000000000003', 'Call for topics opens', '2026-07-01', 'completed', 1),
  ('00000000-ml02-0000-0000-000000000002', '00000000-c003-0000-0000-000000000003', '00000000-ws03-0000-0000-000000000003', 'Call for topics closes', '2026-08-31', 'upcoming', 2),
  ('00000000-ml03-0000-0000-000000000003', '00000000-c003-0000-0000-000000000003', '00000000-ws01-0000-0000-000000000001', 'Agenda draft v0.3 published', '2026-09-15', 'upcoming', 3),
  ('00000000-ml04-0000-0000-000000000004', '00000000-c003-0000-0000-000000000003', '00000000-ws04-0000-0000-000000000004', 'Sponsor neutrality review complete', '2026-09-30', 'upcoming', 4),
  ('00000000-ml05-0000-0000-000000000005', '00000000-c003-0000-0000-000000000003', '00000000-ws01-0000-0000-000000000001', 'Final agenda published', '2026-10-15', 'upcoming', 5),
  ('00000000-ml06-0000-0000-000000000006', '00000000-c003-0000-0000-000000000003', '00000000-ws02-0000-0000-000000000002', 'Venue runbook signed off', '2026-10-31', 'upcoming', 6),
  ('00000000-ml07-0000-0000-000000000007', '00000000-c003-0000-0000-000000000003', NULL, 'Congress Day 1', '2026-11-13', 'upcoming', 7),
  ('00000000-ml08-0000-0000-000000000008', '00000000-c003-0000-0000-000000000003', NULL, 'Congress Day 2 + Decisions captured', '2026-11-14', 'upcoming', 8),
  ('00000000-ml09-0000-0000-000000000009', '00000000-c003-0000-0000-000000000003', NULL, '48h decision conversion deadline', '2026-11-16', 'upcoming', 9)
ON CONFLICT DO NOTHING;

-- ── Seed: tasks for 2026 ──────────────────────────────────────────────────────
INSERT INTO public.congress_tasks (id, congress_id, workstream_id, title, status, priority, lane, due_date, owner_name)
VALUES
  (
    '00000000-ct01-0000-0000-000000000001',
    '00000000-c003-0000-0000-000000000003',
    '00000000-ws02-0000-0000-000000000002',
    'Confirm venue contract addendum',
    'in_progress', 'urgent', 'now',
    (current_date + 2)::date,
    'Sophie van der Berg'
  ),
  (
    '00000000-ct02-0000-0000-000000000002',
    '00000000-c003-0000-0000-000000000003',
    '00000000-ws01-0000-0000-000000000001',
    'Draft agenda v0.3 (session order + leads)',
    'todo', 'high', 'now',
    (current_date + 5)::date,
    'Peter de Groot'
  ),
  (
    '00000000-ct03-0000-0000-000000000003',
    '00000000-c003-0000-0000-000000000003',
    '00000000-ws03-0000-0000-000000000003',
    'Publish "Call for topics" landing update',
    'todo', 'medium', 'next',
    (current_date + 8)::date,
    'Maria Santos'
  ),
  (
    '00000000-ct04-0000-0000-000000000004',
    '00000000-c003-0000-0000-000000000003',
    '00000000-ws04-0000-0000-000000000004',
    'Neutrality review for sponsor pack (draft)',
    'blocked', 'urgent', 'now',
    (current_date + 3)::date,
    'Nadia Al-Rashid'
  ),
  (
    '00000000-ct05-0000-0000-000000000005',
    '00000000-c003-0000-0000-000000000003',
    '00000000-ws01-0000-0000-000000000001',
    'Collect session proposals shortlist',
    'in_progress', 'high', 'now',
    (current_date + 4)::date,
    NULL
  ),
  (
    '00000000-ct06-0000-0000-000000000006',
    '00000000-c003-0000-0000-000000000003',
    '00000000-ws04-0000-0000-000000000004',
    'Sponsor deck v1 from partners team',
    'todo', 'high', 'next',
    (current_date + 6)::date,
    NULL
  )
ON CONFLICT DO NOTHING;

-- Task dependencies
INSERT INTO public.congress_task_dependencies (task_id, depends_on_id) VALUES
  ('00000000-ct02-0000-0000-000000000002', '00000000-ct05-0000-0000-000000000005'),
  ('00000000-ct04-0000-0000-000000000004', '00000000-ct06-0000-0000-000000000006')
ON CONFLICT DO NOTHING;

-- ── Seed: RAID items for 2026 ─────────────────────────────────────────────────
INSERT INTO public.congress_raid_items (id, congress_id, type, title, description, status, priority, owner_role)
VALUES
  (
    '00000000-rd01-0000-0000-000000000001',
    '00000000-c003-0000-0000-000000000003',
    'risk',
    'Venue AV provider availability for day 2',
    'Secondary AV provider has not confirmed availability for the afternoon sessions on day 2. Need confirmation by end of month.',
    'mitigating', 'high', 'Ops Lead'
  ),
  (
    '00000000-rd02-0000-0000-000000000002',
    '00000000-c003-0000-0000-000000000003',
    'issue',
    'Sponsor neutrality review pending (legal)',
    'Compliance review cannot start until the sponsor deck v1 is delivered. Currently blocked.',
    'open', 'high', 'Compliance Reviewer'
  ),
  (
    '00000000-rd03-0000-0000-000000000003',
    '00000000-c003-0000-0000-000000000003',
    'assumption',
    'Keynote speaker will confirm by end of month',
    'We have assumed acceptance from the keynote speaker. If this falls through, a replacement must be found in <2 weeks.',
    'open', 'medium', 'Congress Lead'
  )
ON CONFLICT DO NOTHING;

-- ── Seed: live-ops updates for 2026 ──────────────────────────────────────────
INSERT INTO public.congress_live_ops_updates (id, congress_id, title, description, status, severity)
VALUES
  (
    '00000000-lo01-0000-0000-000000000001',
    '00000000-c003-0000-0000-000000000003',
    'Registration form intermittent 500 errors',
    'The registration form returns 500 errors for ~5% of submissions. Root cause under investigation. Workaround: manual registration via admin.',
    'monitoring', 'sev2'
  )
ON CONFLICT DO NOTHING;

-- ── Seed: follow-up actions for 2026 (from 2025 congress decisions) ───────────
INSERT INTO public.congress_follow_up_actions (id, congress_id, title, description, status, priority, owner_name, due_date)
VALUES
  (
    '00000000-fu01-0000-0000-000000000001',
    '00000000-c003-0000-0000-000000000003',
    'Publish 2025 congress decisions summary report',
    'The formal report summarising all 2025 congress decisions and their current status. Due before 2026 congress opens.',
    'in_progress', 'high',
    'Sophie van der Berg',
    '2026-10-01'
  ),
  (
    '00000000-fu02-0000-0000-000000000002',
    '00000000-c003-0000-0000-000000000003',
    'Validate 2025 initiative outcomes against congress commitments',
    'Cross-reference all 2025 congress decisions with initiative progress reports to identify fulfilled vs. outstanding commitments.',
    'todo', 'medium',
    NULL,
    '2026-10-15'
  ),
  (
    '00000000-fu03-0000-0000-000000000003',
    '00000000-c003-0000-0000-000000000003',
    'Update equitable access working group terms of reference',
    'Refresh the ToR based on 2025 congress feedback. Requires input from patient advocate network leads.',
    'todo', 'medium',
    'Nadia Al-Rashid',
    '2026-09-30'
  )
ON CONFLICT DO NOTHING;

-- ── Seed: messages / communications for 2026 ─────────────────────────────────
INSERT INTO public.congress_messages (id, congress_id, thread_type, subject, body, author_name, labels)
VALUES
  (
    '00000000-cm01-0000-0000-000000000001',
    '00000000-c003-0000-0000-000000000003',
    'update',
    'Venue contract addendum — status update',
    'The venue has sent the addendum. Legal is reviewing. Expected sign-off by Friday. No blockers at this stage.',
    'Sophie van der Berg',
    ARRAY['ops', 'venue']
  ),
  (
    '00000000-cm02-0000-0000-000000000002',
    '00000000-c003-0000-0000-000000000003',
    'action_required',
    'Compliance review blocked — sponsor deck needed',
    'We cannot proceed with the neutrality review until the sponsor deck v1 is delivered. Please prioritise this before the end of the week.',
    'Nadia Al-Rashid',
    ARRAY['compliance', 'sponsor', 'blocked']
  ),
  (
    '00000000-cm03-0000-0000-000000000003',
    '00000000-c003-0000-0000-000000000003',
    'fyi',
    'Comms campaign outline ready for review',
    'The outline for the topic call campaign is ready. Please review and share feedback by Monday. Key messages are aligned with the 2026 congress theme.',
    'Maria Santos',
    ARRAY['comms']
  )
ON CONFLICT DO NOTHING;

-- ── Seed: approval requests for 2026 ─────────────────────────────────────────
INSERT INTO public.congress_approval_requests (id, congress_id, title, description, status, requested_by_name)
VALUES
  (
    '00000000-ap01-0000-0000-000000000001',
    '00000000-c003-0000-0000-000000000003',
    'Approve agenda v0.3 for public preview',
    'Agenda v0.3 includes all confirmed session leads and time slots. Requesting approval to publish the public preview page.',
    'in_review',
    'Peter de Groot'
  )
ON CONFLICT DO NOTHING;
