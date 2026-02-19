# Inspire2Live Platform — MVP Scope & Roadmap

**Status:** Updated 2026-02-19 — aligned to `PLATFORM_DESIGN_DOCUMENT.md` v2.0  
**Benchmark:** `Inspire2Live_PLATFORM_DESIGN_DOCUMENT.md` (v2.0) is the authoritative source of truth.  
**Engineering reference:** `docs/IMPLEMENTATION_GUIDE.md` (compressed execution layer)

---

## 1) Strategic Framing

The MVP is not a feature list. It is a **functional proof** of three structural outcomes articulated in the Platform Design Document:

| Outcome | Design Doc Reference | MVP Proof |
|---|---|---|
| Action continuity replaces symbolic momentum | §1, §5.2, §5.3 | Initiative workspace + task tracking persists between events |
| Institutional knowledge compounds | §3 Principle 4, §5.9 | Resource library with provenance + decision→task traceability |
| Patient voice structurally equal | §3 Principle 3, §8.3 | Role-based access that grants equal workspace rights, not observer status |

The MVP is a **prototype-with-production-shape**: real workflows, real Supabase data, real personas — no marketing mockups. Backend is live (Supabase); data is seeded with realistic Inspire2Live content.

---

## 2) Non-Negotiable Design Principles (from §3 of Design Doc)

These govern every implementation decision in the MVP. Violations require an ADR.

1. **Patient voice structurally equal** — no patient-lite access tier. PatientAdvocate role has full workspace rights within their initiatives.
2. **Neutrality by architecture** — industry partner scope is structurally enforced (scoped DB access + audit trail), not just policy text.
3. **Institutional memory as compounding asset** — every action creates a traceable, attributable, searchable record.
4. **Global-first UX** — timezone-aware, localization-ready, low-bandwidth conscious from day one.
5. **Structured enough to govern, light enough to use** — governance lives in the system; it surfaces only when relevant to the user's action.
6. **Momentum over ceremony** — default views show what needs attention now, not achievement summaries.

---

## 3) MVP Capability Layers

Scope is organized into four layers from core to extended, each with a clear output assertion.

### L1 — Core Continuity (Must ship in MVP)
*"Initiative tasks tracked; contributors active between meetings." — Design Doc §9, Phase 1 success criterion*

| Capability | Design Doc Ref | Key Behaviour |
|---|---|---|
| Auth + session | §5.5, §8.1 | Magic-link OTP, auth callback, session persistence |
| Route protection + onboarding gate | §6 Flow 1, §8.3 | Middleware enforces auth; `onboarding_completed` gates `/app/**` |
| Onboarding wizard (4 steps) | §5.5 | Welcome → role selection → profile setup → first initiative |
| Initiative workspace (all 6 tabs) | §5.2 | Overview, Milestones, Tasks (kanban), Evidence, Team, Discussions |
| Role-based dashboards | §4.2, §5.6 | Coordinator (Sophie), Advocate (Maria), Board-lite (Peter) |
| Member profile + contribution timeline | §5.5 | Timeline of tasks, evidence, decisions, congress participation |
| Platform entry page | §1 | Clear website/platform positioning; links to `www.inspire2live.com` |

### L2 — Governance Layer (Must ship in MVP)
*"Neutrality by architecture, not policy alone." — Design Doc §3 Principle 5*

| Capability | Design Doc Ref | Key Behaviour |
|---|---|---|
| Friday Morning Bureau view | §5.6 | RAG status grid, inline blocker drill-down, inactivity alerts |
| RAG status logic | §5.6 | Green/Amber/Red rules: milestone freshness, blocked tasks, inactivity |
| Weekly summary generation | §5.6 | Structured output from live data; coordinator-editable before send |
| Partner application + governance review | §5.7, §6 Flow 3 | Apply → review → approve/decline with scope document |
| Scoped partner workspace access | §5.7, §8.3 | Partner sees only their designated initiative sections |
| Partner audit trail | §5.7 | Every partner action logged and visible to governance stakeholders |

### L3 — Institutional Memory (Must ship in MVP)
*"When Breast Without Spot succeeds in Lagos, its model becomes a replicable template." — Design Doc §1*

| Capability | Design Doc Ref | Key Behaviour |
|---|---|---|
| Global resource library | §5.9 | Search by initiative, cancer type, country, type, language, date |
| Resource versioning | §5.9 | Previous versions preserved; superseded = not deleted |
| Translation status badges | §5.9 | Original / Translated / Needs Translation visible on every resource |
| Partner contribution badges | §5.7, §5.9 | "Partner Contribution — [Org]" tag on all partner-uploaded resources |
| Decision→task provenance | §5.3, §8.2 | Tasks trace back to congress decision or bureau assignment origin |

### L4 — Congress Continuity (MVP slice — demonstrable, not full featured)
*"Congress action items convert to tracked tasks within 48 hours." — Design Doc §5.3, §9 Phase 2 criterion*

| Capability | Design Doc Ref | Key Behaviour |
|---|---|---|
| Congress topic submission + voting | §5.3 | Submit topic, vote, sort by vote count |
| Decision pipeline view | §5.3 | All captured decisions with conversion status |
| Decision→task conversion dashboard | §5.3, §6 Flow 4 | 48h target, progress bar, one-click conversion |

*Full congress cycle features (live session capture, role assignment, post-congress workspace persistence) ship in Phase 2.*

---

## 4) Out of Scope for MVP — Deferred, Not Discarded

| Feature | Design Doc Ref | Trigger for Phase |
|---|---|---|
| Full hub network operations | §5.4 | Phase 3 — requires hub onboarding pipeline |
| Interactive hub map | §5.4 | Phase 3 — with real hub data |
| World Campus session management | §5.4 | Phase 3 |
| Initiative template replication engine | §5.9 | Phase 3 — after ≥1 successful initiative completes |
| Full PDF board report export | §5.8 | Phase 2 — after board dashboard V1 |
| Advanced impact analytics + forecasting | §5.8 | Phase 3 |
| Offline-capable PWA mode | §6, §11 | Phase 3 — low-bandwidth hardening |
| Full multilingual workflow automation (FR, ES) | §10 | Phase 3 — after English and Dutch baseline |
| Command palette (Cmd+K) | §7.2 | Phase 2 — power-user feature after MVP validation |
| Weekly digest email automation | §5.10 | Phase 2 |
| @Mention notification system (real-time) | §5.10 | Phase 2 |
| Full admin console | §4.1 | Phase 3 |

---

## 5) MVP Demo Narrative

The MVP must be demonstrable as a complete persona walkthrough in under 30 minutes:

1. **Entry:** Public visitor sees platform entry with clear `www.inspire2live.com` relationship.
2. **Auth:** Login via magic link. New user enters 4-step onboarding → lands on role-specific dashboard.
3. **Advocate (Maria):** Dashboard shows her tasks, initiative cards with milestone progress. Opens Molecular Diagnostics workspace. Reviews assigned task. Uploads annotated evidence. Contribution appears in timeline.
4. **Coordinator (Sophie):** Bureau view shows 12 initiatives with RAG. Two Amber, one Red. Drills into Red (Breast Without Spot). Assigns urgent task. Generates weekly summary from live data.
5. **Partner (Hiroshi):** Applies to contribute market access analysis. Sophie reviews and approves with scoped note. Hiroshi sees only designated sections of the initiative.
6. **Board (Peter):** Top-line metrics snapshot, initiative portfolio health, milestone completion rate.
7. **Resource:** Global library search for "early detection sub-Saharan Africa" returns versioned resources with translation and partner badges.
8. **Congress:** Decision pipeline showing 34 congress decisions, conversion progress bar at 79%, one-click remaining conversions.

---

## 6) MVP Success Metrics (Design-Derived)

| Metric | Target | Design Doc Source |
|---|---|---|
| Congress decisions converted to tasks in 48h | ≥ 95% in demo | §5.3, §6 Flow 4 |
| Initiative workspaces with current RAG status | 100% (seeded data) | §5.6 |
| Contributor actions traceable to decision/initiative | 100% (no orphan actions) | §3 Principle 4 |
| Resources with translation status populated | 100% (seeded) | §5.9 |
| Partner contributions structurally separated | 100% (badge + audit) | §5.7 |
| Persona walkthrough completable without coordinator assistance | Pass | §3 Principle 2 |

---

## 7) Implementation Roadmap

### Phase 0 — Foundation ✅ (Complete)

- Supabase schema (profiles, initiatives, milestones, tasks, congress, hubs, resources, discussions, partners, notifications, activity_log)
- RLS policies for all tables
- Storage buckets (avatars, resources, congress assets)
- DB views (initiative health, portfolio overview)
- Seed data baseline
- TypeScript DB types generated
- Supabase server + browser clients
- Governance docs (IMPLEMENTATION_GUIDE, TRACEABILITY, ADR template, PR template)
- Platform entry page + login + onboarding scaffold

---

### Phase 1 — MVP Build (6 Weeks)

**Exit criterion:** Full MVP demo narrative completable; all L1–L4 capabilities demonstrable with seeded data.

#### Week 1 — Auth Hardening + Onboarding Completion
- Auth callback + middleware finalized and tested
- Onboarding wizard: all 4 steps (welcome, role-select, profile-setup, first-initiative)
- Profile persistence to `profiles` table on completion
- `onboarding_completed` gate verified end-to-end

*REQ-UX-001, REQ-UX-003 → done*

#### Week 2 — App Shell + Role Dashboards + Profile
- Platform layout (TopNav, SideNav, role-aware routes) — production-ready
- Coordinator dashboard: RAG initiative health table, inactivity alerts
- Advocate dashboard: my tasks, my initiative cards with milestone progress
- Board-lite dashboard: top metrics snapshot
- Profile page: avatar, Hero of Cancer badge, expertise tags, contribution timeline from activity_log

*REQ-UX-004, REQ-UX-005 → done*

#### Week 3 — Initiative Workspace Core
- Initiative header (title, status, phase, lead, quick stats)
- Tab navigation: Overview | Milestones | Tasks | Evidence | Team | Discussions
- Overview tab: description, objectives, recent activity feed, status card, mini milestone timeline
- Milestones tab: horizontal timeline with status nodes, expandable detail
- Tasks tab: kanban (To Do / In Progress / In Review / Done / Blocked), filter bar, list-view toggle
- Evidence tab: grid/list, type icons, contributor, version, language, translation badge, partner badge
- Team tab: roster with role badges, activity indicators
- Discussions tab: threaded posts tagged as General / Decision / Question / Blocker / Idea
- Seed: 3 initiatives (Multi-Cancer Early Detection, Molecular Diagnostics, Breast Without Spot) with realistic milestones, tasks, evidence, team members

*REQ-UX-002 → done*

#### Week 4 — Bureau + Congress Slice + Notifications
- Friday Morning Bureau: initiative status grid (all columns per design doc), inline expand, quick-action buttons
- RAG logic implementation (green/amber/red rules)
- Weekly summary generator (structured, data-pulled, editable)
- Inactivity alert side panel (14-day threshold, one-click nudge)
- Congress decision pipeline view with conversion status
- Decision→task conversion dashboard (progress bar, one-click conversion)
- In-app notification center: bell, grouped by initiative, all event types per §5.10

*REQ-OPS-001, REQ-CONGRESS-001 → done*

#### Week 5 — Resource Library + Partner Portal
- Resource library: global search, filters (initiative, type, language, cancer type, date range), grid/list view
- Resource upload with metadata, drag-and-drop zone
- Version history dropdown (previous versions preserved, marked superseded)
- Translation status system (original / translated / needs_translation)
- Partner application form (scope, compliance upload, neutrality declaration)
- Governance review: approve / request clarification / decline with justification
- Scoped partner workspace within initiative (read-only advocacy sections, read/write partner section)
- Audit trail visibility for governance stakeholders

*REQ-RES-001, REQ-PARTNER-001 → done*

#### Week 6 — Polish, Responsive, Accessibility, Demo Hardening
- Full responsive pass: 375px / 768px / 1024px / 1440px
- Accessibility audit: keyboard nav, ARIA, color contrast (WCAG 2.1 AA), alt text
- Empty states for all views (motivating, action-oriented per §10)
- Loading skeletons for all async-loaded content
- Error handling: clear, never-blaming copy per §10
- Demo script finalized; persona seed data polished
- Deployment to Vercel (preview + production URLs)

---

### Phase 2 — Congress Cycle Integration (Weeks 7–16)

**Exit criterion:** "Congress action items convert to tracked tasks within 48 hours" — demonstrable with live congress event data.

- Pre-congress: full topic submission + voting + agenda page + role assignment
- During-congress: live session documentation interface + decision capture widget + initiative pipeline tagging
- Post-congress: automatic contributor workspace connection + congress archive
- Board dashboard V1: executive layout, portfolio health chart, quarterly milestone trend, hub activity map
- PDF board report export
- Resource library template section (initiative templates from successful completions)
- Partner embeddable widget for ESG reporting
- Weekly digest email (automated, timezone-aware)
- @Mention system with real-time notification
- Command palette (Cmd+K)

---

### Phase 3 — Hub Network + Institutional Memory Scaling (Weeks 17–30)

**Exit criterion:** "Cross-country replication of at least one initiative model" — hub coordinator in Nigeria can use a template from Kenya hub.

- Hub directory with interactive global map
- Hub workspace pages (per-hub dashboard, local initiative tracking, session management)
- Cross-hub template system: initiative structure, milestone checklist, evidence framework
- World Campus session scheduling, recording storage, session→initiative linking
- Offline-capable essential views for hub coordinators (PWA)
- Low-bandwidth optimization (target: first meaningful paint < 3s on 3G)
- French and Spanish localization (francophone Africa hubs + Costa Rica)
- Full admin console (user management, role management, platform settings)
- Inactivity detection + automated nudge emails
- Contribution heatmap calendar on profile pages
- Advanced impact analytics + trend forecasting
- Full accessibility audit (WCAG 2.1 AA certification pass)

---

## 8) Phase Milestones and Gates

| Milestone | Criteria | Target |
|---|---|---|
| M0 — Foundation complete | Schema, RLS, types, governance docs in place | ✅ Done |
| M1 — Auth + Onboarding | User can login, complete onboarding, land on role dashboard | Week 1 |
| M2 — Initiative Workspace | All 6 tabs functional with seeded data; kanban, evidence, discussions working | Week 3 |
| M3 — Governance Demonstrated | Bureau RAG, blocker workflow, partner flow end-to-end, audit trail visible | Week 5 |
| M4 — Institutional Memory | Resource library searchable with version history, translation badges, partner tags | Week 5 |
| M5 — Demo Ready | Full persona walkthrough; responsive; WCAG AA; deployed to Vercel | Week 6 |
| M6 — Congress Live | Full before/during/after congress cycle with real decision→task conversion | Week 16 |
| M7 — Hub Replication | At least one initiative template replicated cross-country via hub system | Week 30 |

---

## 9) Delivery Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Scope creep in weeks 3–5 | High | High | Freeze non-L1–L4 asks; maintain this document as gate |
| Partner governance complexity balloons | Medium | High | MVP implements strict workflow only (apply/review/approve/scope) |
| Resource library becomes a full DAM | Medium | Medium | MVP: metadata + filter/search + version display only |
| Role permission gaps cause data leaks | Medium | High | RLS enforced in DB (not just UI); each role tested with seeded persona |
| Contributors don't update task status | Medium | Medium | Lightweight one-click updates; inactivity nudges; RAG social pressure |
| Low-bandwidth users excluded | High | Medium | Phase 3; SSR first-load; image lazy-loading from Week 1 |

---

## 10) Immediate Next Steps

1. Complete Week 1: auth hardening + full onboarding wizard (4 steps) with profile persistence.
2. Update `docs/TRACEABILITY.md` with new REQ-IDs for all L1–L4 capabilities.
3. Build 3-initiative seed pack with realistic data: milestones, tasks, team, evidence.
4. Review and finalize design token implementation in `globals.css` against §7.1 palette.
