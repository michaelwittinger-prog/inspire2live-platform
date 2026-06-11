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
| **Overview** | Dashboard | `dashboard` | one href for all roles, see §5.2 |
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

- **Comms** — Dashboard · Planner · Campus · WhatsApp · CRM · Annual Congress ·
  Podcast · All events · Library (+ whatever community spaces its permissions
  allow). Today's menu, unchanged in structure.
- **PlatformAdmin** — the Comms view *plus* Initiatives, Board, Resources,
  User Management. ("Extended with further menu items.")
- **PatientAdvocate / Clinician / Researcher** — Dashboard · Initiatives ·
  Congress · Network · Stories · Resources. Same sections, comms items absent
  because the `comms` space is `invisible` for them.
- **Moderator** — gains the actual comms sub-items (Planner, Campus, …) instead of
  today's single opaque "Communications" link, because its access to the `comms`
  space now drives item visibility directly.

(No role shows a Profile, Tasks, Bureau, or Partners item — those are removed from
the nav entirely per §3.)

## 5. Decision points

### 5.1 Labels (recommendation: neutralize)
Current per-role labels ("My Initiatives" vs "All Initiatives", "Board Overview")
only exist because menus were per-role. With one tree we use neutral labels
("Initiatives", "Stories", "Dashboard"). If product wants possessive labels back, a
small optional `labelOverrides[role]` map can be layered on later — but the default
is one label per item.

### 5.2 Hrefs (recommendation: one canonical href, role-aware pages)
Two items currently point to different targets per role:

- Dashboard: `/app/dashboard` vs `/app/comms/dashboard`
- Congress: `/app/congress/workspace` vs `/app/congress`

"No separate workspaces, just different views" should apply to pages too: each item
gets **one** canonical href (`/app/dashboard`, `/app/congress`), and the *page*
decides which view to render (or redirects) based on the user's role/permissions.
This keeps the nav definition role-free. Interim fallback if page work is deferred:
a tiny href-resolver, but it should be treated as temporary.

### 5.3 Comms sidebar gets slightly longer
Under derived visibility, the Comms role will also see Community items its
permissions allow (e.g. Network, Stories) — today those are hidden behind
"Other sections via profile menu". Recommendation: accept this (it is the
consistency being asked for) and drop the footer note. Alternative: set those
spaces to `invisible` in `ROLE_SPACE_DEFAULTS` for Comms — a data decision, not a
menu-code decision, which is exactly the point of the model. (Profile is no longer
a sidebar concern — it lives only in the top-right account menu.)

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
5. **Pages** (per §5.2) — make `/app/dashboard` and `/app/congress` role-aware
   (render the appropriate view or redirect), then retire the per-role hrefs.
6. **Tests** — per-role snapshot of derived sections (Comms unchanged, Admin =
   superset, advocate roles = no comms items); DB-override case (granting `comms:
   view` to a non-Comms user reveals the comms items).
7. **Docs** — update `docs/ROLE_PERMISSION_MODEL.md` (nav is now derived from the
   matrix) and `docs/DESIGN_CHANGELOG.md`.

## 7. Out of scope

- Page-content redesign per role (only entry-view routing in §5.2).
- Changes to the permission matrix semantics or DB schema — the concept
  deliberately reuses `effectiveSpaces` as-is.
