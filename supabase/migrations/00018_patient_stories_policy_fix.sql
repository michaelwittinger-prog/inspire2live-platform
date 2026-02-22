-- ============================================================
-- MIGRATION 00018: PATIENT STORIES POLICY FIX
--
-- Motivation:
-- - Early environments may not yet have a dedicated PatientAdvocate user.
-- - PlatformAdmin / HubCoordinator should be able to create draft stories
--   (e.g., for demos / support / bootstrapping).
--
-- This migration broadens the insert policy while still enforcing:
-- - author_id must be the current authenticated user
-- ============================================================

-- Allow PatientAdvocate OR coordinator/admin to create their own stories
drop policy if exists patient_stories_insert on public.patient_stories;
create policy patient_stories_insert on public.patient_stories
  for insert with check (
    author_id = auth.uid()
    and (
      public.current_user_role() = 'PatientAdvocate'
      or public.is_coordinator_or_admin()
    )
  );
