# Inspire2Live Platform — MVP Scope & Roadmap

**Status:** Updated 2026-05-17 — aligned to `PLATFORM_CONCEPT_UPDATE_v1.md` v1.0 (extends `PLATFORM_DESIGN_DOCUMENT.md` v2.0)
**Benchmarks:**
- `Inspire2Live_PLATFORM_DESIGN_DOCUMENT.md` (v2.0) — original platform spec, still authoritative for personas, RBAC, data models, and the initiative/bureau/congress feature set.
- `docs/PLATFORM_CONCEPT_UPDATE_v1.md` (v1.0) — **revised Phase 1 scope**: Communications Workspace + World Campus Channel Intake as the pilot.
**Engineering reference:** `docs/IMPLEMENTATION_GUIDE.md`
**Sprint execution:** `sprints/` — all active delivery work is tracked here.

---

## 0) MVP Pivot — May 2026

The MVP definition has changed. The original Phase 1 (initiative workspace + bureau) shipped in WP-0 through WP-5 as a prototype-with-production-shape. With the **Concept Update v1.0**, the **lean MVP** is now redefined as:

> *The Communications team can run their full publication workflow from the platform: capture World Campus channel content via a structured intake, route it to a content calendar, event pipeline, World Campus log, or media library — without monitoring WhatsApp continuously.*

**Rationale (see Concept Update §1):**
1. Communications has a concrete, bounded, daily problem (WhatsApp triage burden).
2. Their tool stack (WordPress, LinkedIn, SharePoint, Teams, WhatsApp) is fixed and known.
3. They are the right pilot group — small, technically capable, with daily contact across the whole organisation.

The previously-built initiative workspace, bureau, congress slice, resource library, and partner portal remain **valid and in place**. They are reclassified as **Phase 2 scope** rather than MVP scope. No code is being removed.

---

## 1) Strategic Framing

The MVP is a **functional proof** that the platform turns unstructured stakeholder activity into structured, routable, publishable signal — starting with the communications team.

| Outcome | Reference | MVP Proof |
|---|---|---|
| Structural triage replaces ad-hoc monitoring | Concept Update §4–§7 | Intake queue processes the World Campus WhatsApp stream into typed, routable items |
| Connect, don't migrate | Concept Update §1, §12 | SharePoint / WordPress / LinkedIn / Newsletter live as reference links in Phase 1; APIs in Phase 2 |
| Institutional memory compounds | Design Doc §3 Principle 4, §5.9 | World Campus Log replaces buried WhatsApp threads as the system of record |
| Patient voice structurally equal | Design Doc §3 Principle 3, §8.3 | Communications surfaces patient-advocate events and contributions on equal footing |

The MVP is a **prototype-with-production-shape**: real workflows, real Supabase data, real personas — Atefeh (Comms Coordinator) and Peter Kapitein (Founder signal layer) drive the demo.

---

## 2) Non-Negotiable Design Principles

These govern every implementation decision in the MVP. Violations require an ADR. Carried forward from the original document and extended by the Concept Update:

1. **Patient voice structurally equal** — no patient-lite access tier.
2. **Neutrality by architecture** — partner scope structurally enforced.
3. **Institutional memory as compounding asset** — every action traceable, attributable, searchable.
4. **Global-first UX** — timezone-aware, localization-ready, low-bandwidth conscious.
5. **Structured enough to govern, light enough to use.**
6. **Momentum over ceremony.**
7. **Connect, don't migrate** *(elevated to Phase 1 per Concept Update §1)* — never force the team off WhatsApp, SharePoint, WordPress, or Teams. The platform adds a structured layer alongside.
8. **Humans in the loop for classification accuracy** *(Concept Update §7.2)* — Phase 1 uses manual capture before any automation; the structured form trains the team in the taxonomy.

---

## 3) MVP Capability Layers (Revised — Communications-First)

Scope is organized into four layers. Each layer's output is the deliverable that proves it.

### L1 — Comms Shell + Intake (Must ship in MVP)
*"The communications team operates a curated queue, not a chat monitor."*

| Capability | Reference | Key Behaviour |
|---|---|---|
| `/app/comms` workspace shell with 5 sub-modules | Concept Update §6 | Authenticated landing for comms team; nav across intake / calendar / events / campus-log / media |
| `comms_team` profile flag + role-aware landing | Concept Update §9 | Comms coordinator (existing Moderator role) lands on `/app/comms/intake` |
| Manual intake form (Phase 1 capture) | Concept Update §7.2 | Structured form: sender, content type (taxonomy), summary, source URL, media attachment |
| Intake queue UI with type badges + routing | Concept Update §7.3 | Email-inbox-style triage; Route / Edit classification / Dismiss actions |
| Content taxonomy enforced | Concept Update §5 | 5 signal types + noise; type drives routing destination |
| Peter Kapitein signal layer | Concept Update §8 | Founder badge, elevated confidence, dedicated filter |

### L2 — Content Calendar + Event Pipeline (Must ship in MVP)
*"Captured signal becomes scheduled content."*

| Capability | Reference | Key Behaviour |
|---|---|---|
| Content calendar (monthly + list views) | Concept Update §6.2 | Channel-colour-coded entries; status pipeline draft → in_review → scheduled → published |
| Promote-from-intake action | Concept Update §6.2 | One-click conversion of an intake item to a calendar draft |
| Event pipeline with lifecycle stages | Concept Update §6.3 | announced → attending → in_progress → post_event → archived |
| Event output checklist | Concept Update §6.3 | report drafted / LinkedIn published / newsletter mentioned / media stored |
| Intake → event auto-link | Concept Update §6.3, §7.5 | Event Report intake items create or update event records |

### L3 — World Campus Log + Media Library (Must ship in MVP)
*"The system of record replaces the WhatsApp scroll."*

| Capability | Reference | Key Behaviour |
|---|---|---|
| World Campus session log | Concept Update §6.4 | Session date, theme, hubs, summary, action items, linked media |
| Member log (lightweight CRM layer) | Concept Update §6.4 | Name, country, organisation, date welcomed, Peter-welcomed flag, last activity |
| Media library with SharePoint reference link | Concept Update §6.5 | Title, type, event/session linkage, rights status, tags, usage log |
| Media recovery action item flow | Concept Update §6.5, §7.5 | Type-5 intake items become tracked recovery requests with offer-collection |

### L4 — Pilot Launch + Feedback Loop (Must ship in MVP)
*"The comms team uses it for real, and we learn from it."*

| Capability | Reference | Key Behaviour |
|---|---|---|
| Daily intake digest email | Concept Update §7.4 | 08:00 coordinator timezone summary; counts by type; high-confidence approvals |
| Routing destination connections | Concept Update §7.5 | All 5 signal types route to their primary destination end-to-end |
| Comms team pilot launch | Concept Update §10 Week 7–8 | 3–6 users; feedback collection; one iteration sprint |
| Pilot success metrics tracked | Concept Update §10 | ≥1 newsletter planned end-to-end; ≥5 event reports captured/routed/linked; ≥10 member entries logged |

---

## 4) Out of Scope for MVP — Deferred to Phase 2 / Phase 3

The following are valuable but explicitly **not** required for MVP completion. Most of them already exist in the codebase from WP-0 through WP-5 and remain available behind the existing routes (`/app/dashboard`, `/app/initiatives`, `/app/bureau`, `/app/congress`, `/app/resources`, `/app/partners`). They simply are not the pilot's success criterion.

| Feature | Reference | Trigger for Phase |
|---|---|---|
| WhatsApp Business API webhook + auto-classification | Concept Update §7.2 Phase 2 | Phase 2 — after manual intake validates the taxonomy |
| AI-assisted classification + draft generation | Concept Update §7.2 Phase 3 | Phase 3 — Anthropic API integration |
| WordPress / LinkedIn / Mailchimp publish APIs | Concept Update §12 | Phase 2 |
| SharePoint Graph API browse-and-link | Concept Update §12 | Phase 2 |
| Initiative workspace as primary daily tool | Design Doc §5.2 | Already built (WP-3); Phase 2 promotes it to coordinator-facing primary |
| Bureau Friday Morning as live operational view | Design Doc §5.6 | Already built (WP-4); Phase 2 polish |
| Full congress cycle (live capture, role assignment, post-congress persistence) | Design Doc §5.3 | Phase 2 |
| Hub network, interactive hub map, World Campus session management as standalone module | Design Doc §5.4 | Phase 3 |
| Initiative template replication engine | Design Doc §5.9 | Phase 3 |
| Offline-capable PWA mode | Design Doc §11 | Phase 3 |
| Full FR / ES multilingual workflow | Design Doc §10 | Phase 3 |
| Command palette (Cmd+K) | Design Doc §7.2 | Phase 2 |
| Weekly digest email automation (initiative scope) | Design Doc §5.10 | Phase 2 |
| Full admin console | Design Doc §4.1 | Phase 3 |

---

## 5) MVP Demo Narrative (Revised)

The MVP must be demonstrable as a complete communications-team walkthrough in under 20 minutes:

1. **Entry:** Atefeh logs in via magic link. Lands on `/app/comms/intake` because `comms_team = true` on her profile.
2. **Morning digest:** She skims the daily digest email — "8 items captured: 2 event reports, 3 article shares, 1 member intro, 1 media request, 1 noise (Peter birthday)."
3. **Intake triage:** She opens the queue. A Type-1 Event Report from Stephen Rowley (GUIDE.MRD General Assembly photos) appears with an attached image and a "Suggested destination: Event Pipeline + Media Library" hint.
4. **Routing:** One click → an event record is created in `/app/comms/events` with stage `post_event`, and a Media Library item is opened for SharePoint URL paste.
5. **Calendar promotion:** A Type-2 article share (Tempus precision medicine link) routes to the content calendar as a newsletter candidate draft.
6. **Peter signal:** A Peter Kapitein welcome message for "Michael from Austria" is auto-classified Type-3 with founder badge → routes to World Campus Log as a new member entry.
7. **Media recovery:** Atefeh's own past WhatsApp question ("does anyone have Congress Photos?") was captured as Type-5; Jeff Waldron's offer is logged as a follow-up. She marks it resolved when she pastes the SharePoint folder URL.
8. **End-of-day:** The intake queue is empty. The content calendar has 3 new drafts. The event pipeline has 1 new event with media linked. The World Campus log has a new member.

---

## 6) MVP Success Metrics

| Metric | Target | Reference |
|---|---|---|
| Newsletter issue planned end-to-end in `/app/comms/calendar` | ≥ 1 during pilot | Concept Update §10 |
| Event reports captured, routed, and linked to media in one week | ≥ 5 | Concept Update §10 |
| Member introductions logged in the World Campus log | ≥ 10 | Concept Update §10 |
| Comms coordinator reports reduced WhatsApp monitoring time | Yes (qualitative pilot feedback) | Concept Update §10 |
| Signal-to-noise of items reaching the queue (post-dismissal) | ≥ 70% routed (not dismissed) | Concept Update §13 |
| All five signal types routable end-to-end with seeded test data | 100% | Concept Update §7.5 |

---

## 7) Implementation Roadmap (Revised)

### Phase 0 — Foundation ✅ Complete (was WP-0)
- Supabase schema, RLS, storage, types, server/browser clients, seed baseline.
- Platform entry, login, onboarding wizard.

### Phase 1a — Original platform prototype ✅ Complete (was WP-1 through WP-5)
*Built ahead of the May 2026 concept pivot; remains in the codebase as Phase 2 surface area.*
- Auth + onboarding (WP-1)
- App shell + role dashboards + profile (WP-2)
- Initiative workspace — 6 tabs (WP-3)
- Bureau + congress slice + notifications (WP-4 / WP-4b)
- Resource library + partner portal (WP-5)

### Phase 1b — Communications MVP ❌ In planning → Sprints 1–4
*Tracked in `sprints/`. Pilot users: Communications team (3–6 people). Goal: comms team operates publication workflow from the platform.*

| Sprint | Weeks | Theme | Reference |
|---|---|---|---|
| Sprint 01 | 1–2 | Comms shell + DB foundation | Concept Update §6, §9, §11 |
| Sprint 02 | 3–4 | Intake queue + Content calendar | Concept Update §6.2, §7 |
| Sprint 03 | 5–6 | Event pipeline + World Campus log + Peter signal layer | Concept Update §6.3, §6.4, §8 |
| Sprint 04 | 7–8 | Media library + integration stubs + pilot launch | Concept Update §6.5, §10, §12 |

Sprint definitions, tasks, and acceptance criteria live in `sprints/sprint-0X-name/`.

**Phase 1b exit criterion:** Pilot demo narrative (§5) completable; all four success metrics achievable with seeded data plus one real week of comms team use.

### Phase 2 — Initiative + Bureau Promotion + WhatsApp Automation (Weeks 9–20)
- Re-promote initiative workspace, bureau, and congress slice to primary stakeholder-facing roles.
- WhatsApp Business API webhook + rule-based classifier (replaces manual intake form for captured items).
- WordPress REST API direct publish from content calendar.
- LinkedIn API scheduled post.
- SharePoint Graph API browse-and-link.
- Polish + responsive + accessibility (was WP-6).
- Full congress cycle: live capture, role assignment, post-congress workspace.
- Board dashboard V1 + PDF export.

### Phase 3 — Hub Network + AI-Assisted Intake (Weeks 21–34)
- Hub directory + interactive map + per-hub workspaces.
- World Campus session scheduling and recording storage as a standalone module.
- Cross-hub initiative template replication.
- AI-assisted intake classification (Anthropic API): higher-accuracy classification + draft newsletter / LinkedIn caption generation.
- Offline PWA, French/Spanish, full admin console.

---

## 8) Phase Milestones and Gates (Revised)

| Milestone | Criteria | Target |
|---|---|---|
| M0 — Foundation | Schema, RLS, types, governance docs | ✅ Done |
| M1 — Original prototype | WP-1 through WP-5 done | ✅ Done |
| M2 — Comms shell live | `/app/comms` shell + DB tables + `comms_team` flag deployed | Sprint 01 end |
| M3 — Intake usable | Manual intake form + queue + routing to content calendar | Sprint 02 end |
| M4 — Full routing | All 5 signal types route to their destinations end-to-end | Sprint 03 end |
| M5 — Pilot live | Comms team uses platform for one full week; metrics tracked | Sprint 04 end |
| M6 — Phase 2 gates | WhatsApp webhook + classifier; initiative promoted | Weeks 9–20 |
| M7 — Hub replication | Cross-country initiative template replication | Weeks 21–34 |

---

## 9) Delivery Risks and Mitigations (Revised)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Comms team resists new workflow | Low | High | Pilot reduces their workload; show time saved in week 1 (Concept Update §13). |
| Over-classification floods queue | Medium | Medium | Conservative manual taxonomy; prefer false negatives in Phase 1 (Concept Update §13). |
| WhatsApp Business API approval delays | Medium | High | Phase 1 uses manual capture — no API dependency. Account application starts during Sprint 01. |
| Privacy concerns capturing WhatsApp content | Medium | High | Phase 1: only publishable content captured; full filter on webhook in Phase 2 (Concept Update §13). |
| Phase 1a features (initiative/bureau) atrophy from neglect | Medium | Low | They remain available; Phase 2 re-promotes them. No deletion during pilot. |
| Scope creep into already-built initiative features | Medium | High | Sprints are scoped to comms only. Initiative/bureau changes deferred unless required to support comms workflow. |
| Content calendar becomes a backlog sink | Medium | Medium | Weekly stale-draft archive ritual; >14-day inactivity → archive (Concept Update §13). |

---

## 10) Immediate Next Steps

1. Kick off **Sprint 01** (`sprints/sprint-01-foundation-and-comms-shell/`): DB migration for the six new tables (intake_items, content_calendar, events, campus_sessions, campus_members, media_assets), `/app/comms` shell, `comms_team` profile flag.
2. Apply for WhatsApp Business API account in parallel — required for Phase 2, lead time is unrelated to Sprint 01 dev work.
3. Update `docs/TRACEABILITY.md` with new REQ-COMMS-NNN IDs for each capability in §3 above.
4. Schedule a 30-minute discovery session with Atefeh and the comms team before Sprint 02 starts, to validate the taxonomy in §5 of the Concept Update against current channel content.
