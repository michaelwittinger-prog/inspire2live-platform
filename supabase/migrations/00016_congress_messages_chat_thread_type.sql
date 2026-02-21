-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 00016: Allow chat thread_type in congress_messages
-- Adds support for a dedicated Team Chat stream inside Congress Workspace
-- while continuing to use the same congress_messages table.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.congress_messages
  DROP CONSTRAINT IF EXISTS congress_messages_type_check;

ALTER TABLE public.congress_messages
  ADD CONSTRAINT congress_messages_type_check
  CHECK (thread_type IN ('update','action_required','decision','fyi','chat'));
