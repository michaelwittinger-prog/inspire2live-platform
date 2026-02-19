-- ─────────────────────────────────────────────────────────────────────────────
-- 00010: Schema Reconciliation
-- Fixes column mismatches between 00001 initial schema and later migrations
-- (00007, 00008) where CREATE TABLE IF NOT EXISTS was a no-op because
-- the table already existed from 00001 with different column names.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── congress_decisions: add title + body columns if missing ──────────────────
-- 00001 defined: description text (NOT NULL)
-- 00007 expected: title text (NOT NULL), body text (nullable)
-- Page code (congress/page.tsx) queries: title, body, captured_at
ALTER TABLE congress_decisions ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE congress_decisions ADD COLUMN IF NOT EXISTS body text;

-- Backfill: copy description → title where title is null
UPDATE congress_decisions SET title = description WHERE title IS NULL AND description IS NOT NULL;

-- Set NOT NULL on title now that it's backfilled
-- (Only if column exists and has no nulls)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'congress_decisions' AND column_name = 'title'
  ) THEN
    EXECUTE 'ALTER TABLE congress_decisions ALTER COLUMN title SET NOT NULL';
  END IF;
END $$;

-- ── congress_decisions: add conversion tracking columns if missing ───────────
ALTER TABLE congress_decisions ADD COLUMN IF NOT EXISTS session_date date;
ALTER TABLE congress_decisions ADD COLUMN IF NOT EXISTS captured_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE congress_decisions ADD COLUMN IF NOT EXISTS converted_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL;
ALTER TABLE congress_decisions ADD COLUMN IF NOT EXISTS converted_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE congress_decisions ADD COLUMN IF NOT EXISTS converted_at timestamptz;

-- ── congress_topics: add submitted_by column if missing ─────────────────────
-- 00001 defined: submitter_id uuid REFERENCES profiles(id)
-- 00007 expected: submitted_by uuid REFERENCES profiles(id)
-- Page code queries FK: congress_topics_submitted_by_fkey
ALTER TABLE congress_topics ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE congress_topics ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE congress_topics ADD COLUMN IF NOT EXISTS session_date date;
ALTER TABLE congress_topics ADD COLUMN IF NOT EXISTS resolution text;

-- Backfill: copy submitter_id → submitted_by where submitted_by is null
UPDATE congress_topics SET submitted_by = submitter_id WHERE submitted_by IS NULL AND submitter_id IS NOT NULL;

-- Backfill: copy description → title where title is null
UPDATE congress_topics SET title = description WHERE title IS NULL AND description IS NOT NULL;

-- ── congress_topics: update status CHECK constraint to include all values ────
-- 00001 defined: submitted | under_review | accepted | not_this_year
-- 00007 expected: submitted | approved | rejected | discussing | resolved
-- We drop the old constraint and add a unified one
ALTER TABLE congress_topics DROP CONSTRAINT IF EXISTS congress_topics_status_check;
ALTER TABLE congress_topics ADD CONSTRAINT congress_topics_status_check CHECK (
  status IN ('submitted', 'under_review', 'accepted', 'not_this_year', 'approved', 'rejected', 'discussing', 'resolved')
);

-- ── congress_decisions: update conversion_status CHECK to include 'declined' ─
ALTER TABLE congress_decisions DROP CONSTRAINT IF EXISTS congress_decisions_conversion_status_check;
ALTER TABLE congress_decisions ADD CONSTRAINT congress_decisions_conversion_status_check CHECK (
  conversion_status IN ('pending', 'converted', 'needs_clarification', 'declined')
);

-- ── resources: add columns from 00008 if missing ────────────────────────────
ALTER TABLE resources ADD COLUMN IF NOT EXISTS cancer_type text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS partner_org text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS superseded boolean NOT NULL DEFAULT false;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_url text;

-- ── Remove redundant RLS policy from 00009 ──────────────────────────────────
-- 00002 already defines profiles_select with USING(true) allowing all reads
-- 00009's admin_can_read_all_profiles is redundant
DROP POLICY IF EXISTS "admin_can_read_all_profiles" ON profiles;
-- 00009's admin_can_update_any_profile overlaps with 00002's profiles_update_admin
DROP POLICY IF EXISTS "admin_can_update_any_profile" ON profiles;

-- ── Create indexes for new columns ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS congress_decisions_title_idx ON congress_decisions(title);
CREATE INDEX IF NOT EXISTS congress_topics_submitted_by_idx ON congress_topics(submitted_by);
CREATE INDEX IF NOT EXISTS resources_cancer_type_idx ON resources(cancer_type);
