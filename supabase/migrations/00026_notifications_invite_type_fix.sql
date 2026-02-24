-- ============================================================
-- MIGRATION 00026: Allow invitation notifications in notifications.type
--
-- Fixes runtime error when invitation trigger inserts type 'invite_received'
-- but notifications_type_check does not include that value.
-- ============================================================

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (
    type in (
      'task_assigned',
      'task_completed',
      'milestone_approaching',
      'milestone_completed',
      'new_discussion',
      'mention',
      'decision_flagged',
      'partner_application',
      'inactivity_nudge',
      'initiative_joined',
      'congress_role_assigned',
      'invite_received'
    )
  );

notify pgrst, 'reload schema';