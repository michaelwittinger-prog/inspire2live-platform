# Sprint 01 — Tasks

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| S01-T01 | Write migration: create `intake_items` table per Concept Update §11 (with indexes on status, captured_at, is_peter_kapitein) | TBD | Not Started | — |
| S01-T02 | Write migration: create `content_calendar` table with FKs to `intake_items`, `initiatives`, `events` | TBD | Not Started | — |
| S01-T03 | Write migration: create `events` table with lifecycle stages and output checklist columns | TBD | Not Started | — |
| S01-T04 | Write migration: create `campus_sessions` table with hub/initiative/media references | TBD | Not Started | — |
| S01-T05 | Write migration: create `campus_members` table with country, organisation, Peter-welcomed flag | TBD | Not Started | — |
| S01-T06 | Write migration: create `media_assets` table with SharePoint URL and rights status | TBD | Not Started | — |
| S01-T07 | Write migration: add `comms_team boolean default false` column to `profiles`; backfill existing rows | TBD | Not Started | — |
| S01-T08 | Write RLS policies for all six new tables (Moderator+`comms_team` read/write; Admin full; others denied) | TBD | Not Started | — |
| S01-T09 | Regenerate `src/types/database.ts` and commit | TBD | Not Started | — |
| S01-T10 | Create `/app/comms/layout.tsx` with sub-module nav (Intake / Calendar / Events / Campus Log / Media) | TBD | Not Started | — |
| S01-T11 | Create placeholder pages for the five sub-routes (`/app/comms/intake`, `/calendar`, `/events`, `/campus-log`, `/media`) with empty-state copy | TBD | Not Started | — |
| S01-T12 | Update post-login redirect: profiles with `comms_team = true` land on `/app/comms/intake` | TBD | Not Started | Touch `auth/callback/route.ts` and middleware |
| S01-T13 | Surface "Communications" item in `SideNav` for `comms_team = true` users and Platform Admins | TBD | Not Started | — |
| S01-T14 | Extend `docs/ROLE_PERMISSION_MODEL.md` with the Concept Update §9 permission matrix rows | TBD | Not Started | — |
| S01-T15 | Add Atefeh demo persona to `supabase/seed-demo.sql` with `comms_team = true` | TBD | Not Started | — |
| S01-T16 | Unit tests: middleware routing for `comms_team` flag | TBD | Not Started | — |
| S01-T17 | Apply for WhatsApp Business API account via Meta Business Manager | TBD | Not Started | Non-engineering; long lead time |
| S01-T18 | Update `docs/TRACEABILITY.md` with new REQ-COMMS-001 through REQ-COMMS-00X entries | TBD | Not Started | — |
| S01-T19 | Author ADR documenting the Communications Workspace module decision and the six new tables | TBD | Not Started | New `docs/ADR/0006-communications-workspace.md` |
