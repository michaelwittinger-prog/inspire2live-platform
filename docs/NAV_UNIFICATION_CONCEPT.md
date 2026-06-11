# Concept: Unified Navigation — One Menu Tree, Permission-Driven Views

**Status:** Concept (not implemented)
**Date:** 2026-06-11
**Supersedes:** the per-role menu trees (`NAV_SECTIONS_BY_ROLE`) introduced on branch `claude/sweet-bell-25l6lv`

## 1. Problem

Today the platform effectively has *two* navigation systems that were recently made to
look alike, but still follow different logic:

- The **Comms workspace menu**: a hand-curated, sectioned tree
  (Overview / Workspace / Events / Content) pointing into `/app/comms/*`.
- **Per-role menus**: nine separate trees in `NAV_SECTIONS_BY_ROLE`, one per
  `PlatformRole`, each duplicating largely the same items with small label/href
  variations.

This duplicates structure nine times, makes the Comms space a "separate workspace"
rather than a part of the platform, and means adding one menu item requires touching
up to nine definitions. It also under-uses the permission system: the menus are
curated by role instead of *derived* from access.

## 2. Target principle

> There is exactly **one** navigation tree. The Communications structure is the
> blueprint and stays as-is. Roles do not get their own menus — they get a
> **filtered view** of the master tree, driven by the existing permission matrix
> (`ROLE_SPACE_DEFAULTS` + per-user DB overrides = `effectiveSpaces`).

Consequences:

- The Comms role sees the tree minus everything its permissions hide — which yields
  exactly today's Comms menu.
- The Admin role sees the same tree with *more* items visible (Bureau, Board,
  User Management, …) — i.e. "the Comms menu, extended".
- A Patient Advocate sees the same tree with the comms-only items hidden.
- Granting a user access to a space via a DB override automatically reveals the
  corresponding menu items. No menu code changes.

## 3. The master tree

One definition, `MASTER_NAV`, in `src/lib/role-access.ts`. Every item carries the
`PlatformSpace` that gates it (and optionally a minimum access level):

| Section | Item | Gating space | Notes |
|---|---|---|---|
| **Overview** | Dashboard | `dashboard` | single canonical `/app/dashboard` for all roles + landing page, see §5.5 |
| **Workspace** | Planner | `comms` | |
| | Campus | `comms` | live badge (intake count) |
| | WhatsApp | `comms` | |
| | CRM | `comms` | |
| | Initiatives | `initiatives` | |
| | Board | `board` | |
| **Events** | Annual Congress | `congress` | `priority` accent (orange) |
| | Podcast | `comms` | |
| | All events | `comms` | |
| **Community** | Network | `network` | |
| | Stories | `stories` | |
| **Content** | Library | `comms` | |
| | Resources | `resources` | |
| **Account** | User Management | `admin` | min level `manage` |

**Deliberately *not* in the sidebar** (per product decision — these remain
reachable, just not as top-level nav items):

- **Profile** — already accessible from the avatar/account menu top-right; a
  duplicate sidebar entry is removed entirely.
- **Tasks** (`/app/tasks`), **Bureau** (`/app/bureau`), **Partners**
  (`/app/partners`) — removed as standalone nav items. The pages and their
  permission spaces still exist; they are surfaced contextually (e.g. tasks
  within an initiative, partners within the relevant workspace) rather than via a
  dedicated sidebar link. The `tasks` / `bureau` / `partners` spaces are no longer
  referenced by `MASTER_NAV`.

Rendering pipeline (identical for sidebar and mobile drawer):

```
MASTER_NAV
  → filter items: canAccess(effectiveSpaces[item.space], item.minLevel ?? 'view')
  → drop empty sections
  → render (dark #202133 sidebar, uppercase section labels, badge/priority styling)
```

`NAV_SECTIONS_BY_ROLE`, `NAV_BY_ROLE`, `getSideNavItems`, and the
`showCommsWorkspace` / `showCommsNav` flags are deleted. The role only matters
indirectly, as input to the permission resolver.

## 4. Resulting views (derived, not defined)

These are computed from `ROLE_SPACE_DEFAULTS`, not authored per role:

- **Comms** (`comms: edit`, `initiatives: view`, `stories: manage`, `network:
  view`, `resources: view`, `board/admin: invisible`) — Dashboard · Planner ·
  Campus · WhatsApp · CRM · Initiatives · Annual Congress · Podcast · All events ·
  Network · Stories · Library · Resources. The comms workspace structure is intact;
  the menu now *also* surfaces the other spaces Comms can already reach (Initiatives,
  Network, Stories, Resources). This is the "different views, one tree" outcome — see
  §5.3.
- **PlatformAdmin** (`manage` everywhere) — the Comms view *plus* Board and User
  Management. ("Extended with further menu items.")
- **PatientAdvocate / Clinician / Researcher** — Dashboard · Initiatives ·
  Congress · Network · Stories · Resources. Comms items absent because the `comms`
  space is `invisible` for them.
- **Moderator** (`comms: invisible`) — Dashboard · Initiatives · Congress · Network
  · Stories · Resources. No comms sub-items, since the `comms` space is invisible —
  this replaces today's single opaque "Communications" link.

(No role shows a Profile, Tasks, Bureau, or Partners item — those are removed from
the nav entirely per §3.)

## 5. Decision points

### 5.1 Labels (recommendation: neutralize)
Current per-role labels ("My Initiatives" vs "All Initiatives", "Board Overview")
only exist because menus were per-role. With one tree we use neutral labels
("Initiatives", "Stories", "Dashboard"). If product wants possessive labels back, a
small optional `labelOverrides[role]` map can be layered on later — but the default
is one label per item.

### 5.2 Hrefs (decided: one canonical href)
Items currently point to different targets per role:

- Dashboard: `/app/dashboard` vs `/app/comms/dashboard` → **resolved in §5.5**
- Congress: `/app/congress/workspace` vs `/app/congress` → **single href
  `/app/congress`**. The `/app/congress` overview page already links into the
  operational workspace (`/app/congress/workspace`, see its in-page nav), so one
  canonical entry point needs no per-role redirect logic — everyone lands on the
  congress overview and enters the workspace from there.

### 5.5 One dashboard only (decided)
There must be a **single** dashboard, reached via the menu's `Dashboard` item, and
it is the landing page on entering the app. Today there are two:

- `/app/dashboard` — the real, shared, role-aware dashboard. Login already lands
  here (`login/page.tsx`, `middleware.ts`). It **already renders the Comms personal
  panel** for the Comms role (`showCommsBlocks = role === 'Comms'`). **This is the
  one we keep.**
- `/app/comms/dashboard` — a second "Communications dashboard" (events pipeline,
  agenda board, team-activity "team" view, with a personal/team toggle). In the
  Comms sidebar the `Dashboard` item points *here*, so the menu opens this
  congress/events-heavy view instead of the real dashboard. **This page is
  removed.**

Decisions:

1. **`MASTER_NAV` Dashboard → `/app/dashboard` for every role** (no more
   `/app/comms/dashboard` target). One dashboard, reached through the menu, and it
   is the landing route (already true for login).
2. **Delete the `/app/comms/dashboard` route** (`page.tsx` + `comms-dashboard-toggle`).
   The Comms *personal* view survives because `/app/dashboard` already shows it.
3. **The Comms *team* view** (events pipeline, weekly agenda, team activity) lives
   only on the deleted page. Per "the other dashboard can go", it is dropped. The
   weekly-agenda feature goes with it (it had no home outside the team dashboard).
   *Optional follow-up (not default):* if those widgets later prove valuable, fold
   them into `/app/dashboard` for the Comms role — a separate decision.
4. **Delete the whole team-dashboard cluster** (no relocation needed — it is
   self-contained). Tracing imports shows these are used *only* by the deleted page:
   `comms/dashboard/page.tsx`, `comms/dashboard/actions.ts`,
   `components/comms/team-dashboard.tsx`, `components/comms/team-feed.tsx`,
   `components/comms/comms-dashboard-toggle.tsx`,
   `components/comms/agenda-add-form.tsx`,
   `components/comms/agenda-status-control.tsx`, the data lib
   `lib/comms-dashboard-data.ts`, and its test `comms-dashboard-data.test.ts`.
   The *personal* dashboard pieces (`comms-personal-dashboard.tsx`,
   `comms-personal-dashboard-data.ts`) are **kept** — `/app/dashboard` uses them.
   The `comms_weekly_agenda_items` table/migration is left untouched (DB-only, no
   code references after the cluster is removed).

### 5.3 Comms sidebar gets longer (decided: accept)
Under derived visibility the Comms role also sees the spaces it can already reach —
Initiatives (`view`), Network (`view`), Stories (`manage`), Resources (`view`) —
which today are hidden behind "Other sections via profile menu". **Decision: accept
this and drop the footer note.** It is precisely the consistency being asked for
("no separate workspaces, just different views"). If product later wants the Comms
menu trimmed, that is a *data* change (set the space to `invisible` for Comms in
`ROLE_SPACE_DEFAULTS`), not a menu-code change — which is the whole point of the
model. (Profile is no longer a sidebar concern — it lives only in the top-right
account menu.)

### 5.4 Finer granularity inside a space (future)
All comms sub-items are currently gated by the single `comms` space. If individual
features (e.g. WhatsApp) ever need separate gating, items can carry an optional
`minLevel` (already supported by the model: `view`/`edit`/`manage`) or, later, a
feature-level space. No structural change required.

## 6. Implementation plan (when approved)

1. **`src/lib/role-access.ts`** — replace `NAV_SECTIONS_BY_ROLE` with `MASTER_NAV`
   (`{ id, label, href, space, minLevel?, badge?, priority? }`); rewrite
   `getSideNavSections(effectiveSpaces)` as the pure filter described in §3;
   delete `NAV_BY_ROLE` / `getSideNavItems` and migrate their tests.
2. **`src/components/layouts/side-nav.tsx`** — drop the `role` prop; render from
   `getSideNavSections(effectiveSpaces)`. Visual blueprint unchanged.
3. **`src/components/layouts/top-nav.tsx`** — pass `effectiveSpaces` from the
   server layout into `TopNav` so the mobile drawer uses the same filtered tree
   (today it re-derives from role defaults client-side and misses DB overrides).
4. **`src/app/app/layout.tsx`** — remove `showCommsWorkspace` branching; compute
   the campus badge whenever the user can view `comms` (not only for the Comms
   role); thread `effectiveSpaces` to both navs.
5. **Single dashboard** (per §5.5) — point `MASTER_NAV` Dashboard at
   `/app/dashboard`; delete the self-contained team-dashboard cluster listed in
   §5.5.4; confirm `/app/dashboard` is the landing (already true via login +
   middleware) and still renders the Comms personal panel.
6. **Congress href** (per §5.2) — `MASTER_NAV` Congress → `/app/congress` for all
   roles. No page changes (the overview already links into the workspace).
7. **Tests** — per-role snapshot of derived sections (Comms unchanged, Admin =
   superset, advocate roles = no comms items); DB-override case (granting `comms:
   view` to a non-Comms user reveals the comms items); dashboard consolidation
   (Comms `Dashboard` link resolves to `/app/dashboard`; agenda actions still wired
   after relocation).
7. **Docs** — update `docs/ROLE_PERMISSION_MODEL.md` (nav is now derived from the
   matrix) and `docs/DESIGN_CHANGELOG.md`.

## 7. Out of scope

- Page-content redesign per role (only entry-view routing in §5.2).
- Changes to the permission matrix semantics or DB schema — the concept
  deliberately reuses `effectiveSpaces` as-is.
