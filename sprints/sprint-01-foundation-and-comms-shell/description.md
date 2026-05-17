# Sprint 01 — Foundation & Comms Shell

**Weeks:** 1–2 of the Communications MVP
**Exit milestone:** M2 — Comms shell live
**Status:** Not Started

---

## Goal

Stand up the structural foundation for the Communications Workspace: the database tables that back the five sub-modules, the `/app/comms` route shell with navigation across all five sub-modules, and the `comms_team` profile flag that routes communications coordinators to the new landing view. No business logic yet — this sprint is about putting the skeleton in place so the next three sprints can fill it with behaviour.

## Rationale

The Concept Update (§6, §9, §11) introduces a new top-level module with five sub-modules and six new database tables that did not exist in the original Platform Design Document. None of the subsequent sprints can ship anything end-to-end until:

1. The migrations exist and apply cleanly on Supabase.
2. The route shell (`/app/comms` + five sub-routes) is reachable and respects RBAC.
3. The comms coordinator (Moderator role + `comms_team = true`) lands on the right view after login.

Doing this work upfront also de-risks the database design — getting the six tables right early avoids painful migration churn during Sprint 02–04 when business logic is being layered on top. The Concept Update §11 is the source for the schema; deviations must be captured in an ADR.

A parallel non-engineering task — applying for the WhatsApp Business API account — also belongs in this sprint because its approval lead time is unrelated to dev work and could block Phase 2 if started late.

## Acceptance criteria

- [ ] Supabase migration created for the six new tables (`intake_items`, `content_calendar`, `events`, `campus_sessions`, `campus_members`, `media_assets`) matching the schema in `docs/PLATFORM_CONCEPT_UPDATE_v1.md` §11. Migration applies cleanly on a fresh Supabase project.
- [ ] RLS policies added for each new table. Comms-team users (Moderator role + `comms_team = true`) have read/write access scoped to communications data. Platform Admin has full access. Other roles are denied by default.
- [ ] TypeScript DB types regenerated and committed.
- [ ] `comms_team` boolean column added to `public.profiles` with a default of `false`. Existing rows backfilled.
- [ ] `/app/comms` route exists with a layout that renders the five sub-module nav links: Intake, Calendar, Events, Campus Log, Media. Each sub-route renders an empty-state placeholder.
- [ ] Login redirect logic updated: a profile with `comms_team = true` lands on `/app/comms/intake` after sign-in instead of `/app/dashboard`.
- [ ] Side nav surfaces a "Communications" entry for users with `comms_team = true` or Platform Admin role.
- [ ] RBAC permission matrix in `docs/ROLE_PERMISSION_MODEL.md` (or equivalent doc) extended with the new comms permissions from Concept Update §9.
- [ ] Seed data: at least one demo profile with `comms_team = true` (Atefeh persona) added to the demo seed.
- [ ] WhatsApp Business API account application submitted (Meta Business Manager) — captured as a Notes entry in `tasks.md`.
- [ ] All new code passes `pnpm lint`, `pnpm typecheck`, `pnpm test`.

## Out of scope (deferred to later sprints)

- Any intake form or queue logic → Sprint 02.
- Any content calendar rendering or actions → Sprint 02.
- Any event pipeline or campus log behaviour → Sprint 03.
- Any media library upload or SharePoint linking → Sprint 04.
- WhatsApp Business API webhook implementation → Phase 2.
