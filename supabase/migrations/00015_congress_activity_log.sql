-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 00015: Congress activity log + assignment display names
-- Adds:
--   1) congress_activity_log: audit-style stream for the workspace overview
--   2) congress_assignments.display_name: human-readable name for team roster
--
-- RLS model:
--   - authenticated users can read activity
--   - coordinators/admins can insert activity
--   - (no client writes expected)
--
-- NOTE: activity rows are written by server actions in
--   src/app/app/congress/workspace/actions.ts
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1) Activity log ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.congress_activity_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  congress_id  uuid NOT NULL REFERENCES public.congress_events(id) ON DELETE CASCADE,
  actor_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action       text NOT NULL,
  entity_type  text,
  entity_id    uuid,
  entity_title text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS congress_activity_log_congress_idx ON public.congress_activity_log(congress_id);
CREATE INDEX IF NOT EXISTS congress_activity_log_created_idx  ON public.congress_activity_log(created_at DESC);

ALTER TABLE public.congress_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_congress_activity" ON public.congress_activity_log;
CREATE POLICY "auth_read_congress_activity" ON public.congress_activity_log
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "coord_insert_congress_activity" ON public.congress_activity_log;
CREATE POLICY "coord_insert_congress_activity" ON public.congress_activity_log
  FOR INSERT
  WITH CHECK (public.is_coordinator_or_admin());

-- ── 2) Assignment display names ─────────────────────────────────────────────

ALTER TABLE public.congress_assignments
  ADD COLUMN IF NOT EXISTS display_name text;

-- Best-effort backfill for local environments.
UPDATE public.congress_assignments ca
SET display_name = COALESCE(ca.display_name, p.name, split_part(p.email, '@', 1))
FROM public.profiles p
WHERE p.id = ca.user_id
  AND ca.display_name IS NULL;
