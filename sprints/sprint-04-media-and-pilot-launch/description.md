# Sprint 04 — Media Library, Integration Stubs & Pilot Launch

**Weeks:** 7–8 of the Communications MVP
**Exit milestone:** M5 — Pilot live
**Status:** Not Started

---

## Goal

Close the last gap in the routing story (Media Library with SharePoint reference linking and Media Recovery action items), connect all five sub-modules with integration stubs that are ready for Phase 2 API work, and **launch the pilot with the communications team**. By the end of this sprint, Atefeh and her team are using the platform for their real daily workflow, and we have one week of qualitative + quantitative feedback to drive Phase 2 planning.

## Rationale

The Concept Update §6.5 specifies Phase 1 SharePoint integration as a reference-link model: the coordinator uploads to SharePoint as usual and pastes the URL into a media library record. This is intentional — it avoids SharePoint Graph API auth complexity while delivering 80% of the value (searchable, taggable, linked media records). Sprint 04 implements that.

The Media Recovery Request flow (Type-5) is the missing piece of the routing story. Atefeh's own "Congress Photos" question is a real example from the channel; resolving it via tracked offers and a pasted SharePoint URL closes the loop on a workflow that previously had no tracking at all.

Integration stubs (WordPress, LinkedIn, Mailchimp, SharePoint, Teams) live in this sprint as feature-flag-gated connector interfaces — no actual API calls in Phase 1, but the contract is defined so Phase 2 only needs to swap the implementation.

The pilot launch is the real point of this sprint. Everything before it is preparation. Success is measured against the four metrics from `docs/MVP_SCOPE_AND_ROADMAP.md` §6, not against feature completeness.

## Acceptance criteria

- [ ] `/app/comms/media` lists `media_assets` with search, asset-type filter (photo / video / recording / slides / document / report), event/session filter, and tags filter.
- [ ] Media asset detail view displays all Concept Update §6.5 fields: title, type, event/session source, initiative linkage, contributor, SharePoint URL, tags, rights status, usage log.
- [ ] Create media asset form: title, type, SharePoint URL paste, event/session selector, initiative selector, tags, rights status (internal_only / approved_for_publication / needs_clearance).
- [ ] Rights status badge displayed on every asset in list and detail views.
- [ ] Usage log: when a content calendar entry references a media asset, the asset's `usage_count` increments and the calendar entry is linked back from the asset detail.
- [ ] Media Recovery Request flow:
  - [ ] Type-5 intake items create a "Media Recovery" action item visible in `/app/comms/media`.
  - [ ] Subsequent intake messages offering media for the same recovery request are linked as "offers" on the recovery item.
  - [ ] Coordinator resolves the recovery by pasting a SharePoint URL and marking it resolved; the SharePoint URL becomes a new media_assets row.
  - [ ] Notification fires to the coordinator when a new offer is linked to an open recovery request.
- [ ] Integration stubs (feature-flag-gated, no external calls in Phase 1):
  - [ ] WordPress publish stub on content calendar (button visible to Admin only, calls a no-op handler).
  - [ ] LinkedIn schedule stub on content calendar.
  - [ ] Mailchimp newsletter draft stub on content calendar.
  - [ ] SharePoint browse stub on media library "+ from SharePoint" button.
  - [ ] Teams meeting link stub on event detail and campus session detail.
  - [ ] Each stub is documented in `docs/PLATFORM_CONCEPT_UPDATE_v1.md` §12 reference table, ready for Phase 2 swap.
- [ ] Pilot prep:
  - [ ] Three comms team members onboarded (real Supabase accounts, `comms_team = true` set).
  - [ ] Daily intake digest scheduled for each pilot user at their preferred time.
  - [ ] Pilot kickoff session held; taxonomy and routing demoed with seeded data.
- [ ] Pilot week run:
  - [ ] At least one newsletter issue planned end-to-end in the content calendar.
  - [ ] At least 5 event reports captured, routed, and linked to media library assets.
  - [ ] At least 10 member introductions logged in the World Campus log.
  - [ ] Coordinator self-reports reduced WhatsApp monitoring time in a written retro.
- [ ] Pilot feedback collected (structured form or 1-on-1 notes) and filed under `sprints/sprint-04-media-and-pilot-launch/feedback.md`.
- [ ] Phase 2 sprint backlog draft created in `sprints/` (placeholder folders + initial task lists) based on pilot feedback and the deferred items from Concept Update §10 Phase 2.
- [ ] All new code passes `pnpm lint`, `pnpm typecheck`, `pnpm test`. E2E happy path covers: login as comms coordinator → submit intake → route to calendar → publish.

## Out of scope (deferred to Phase 2)

- Actual WhatsApp Business API webhook (manual intake remains the capture mechanism throughout the pilot).
- Actual WordPress / LinkedIn / Mailchimp publish API calls.
- Actual SharePoint Graph API.
- AI-assisted classification or draft generation (Phase 3).
- Polishing the initiative workspace, bureau, or congress slice (those remain available but unchanged).
