# Inspire2Live Platform — Health Audit Report

**Date:** 2026-02-19  
**Commit:** `dc92ff0` (feat(wp6): admin user management + perspective switcher)  
**Auditor:** Automated comprehensive audit  

---

## Executive Summary

The Inspire2Live Platform is structurally sound with a well-organized codebase, clean ESLint output, passing unit tests (41/41), and a rich database schema. However, there are **3 P0 critical issues** (build failure, duplicate source files at workspace root, 11 unused dependencies inflating bundle), **6 P1 high-priority issues** (API contract mismatches between pages and DB schema, missing Suspense boundary, overlapping RLS policies, congress page querying non-existent columns), and **8 P2 cleanup items**. The production build currently **fails** due to a `useSearchParams()` Suspense boundary issue on `/login`, and `next.config.ts` masks all TypeScript errors with `ignoreBuildErrors: true`. Overall confidence: **70% — functional in dev mode but not production-ready**.

---

## 1. Static Analysis Results

### 1.1 Dependency Install
- **Status:** ✅ Clean install via `pnpm install`
- **Finding:** 11 dependencies in `package.json` are **never imported** anywhere in `src/` (see §6.1)

### 1.2 ESLint
- **Status:** ✅ Clean — no errors or warnings
- **Note:** ESLint config uses `@next/next` recommended rules via `eslint.config.mjs`

### 1.3 TypeScript Errors
- **Status:** ⚠️ Unknown — `typescript.ignoreBuildErrors: true` in `next.config.ts` suppresses all TS errors during build
- **Root Cause:** `next.config.ts` line: `typescript: { ignoreBuildErrors: true }`
- **Risk:** TypeScript errors may exist but are invisible. A separate `tsc --noEmit` run is required to verify. Key areas of concern:
  - Several pages use `searchParams` as a plain object but Next.js 15+ expects `Promise<SearchParams>` — only `resources/page.tsx` correctly awaits it
  - `params` in dynamic routes (`[id]`) should also be `Promise<{id: string}>` in Next.js 15+

### 1.4 Build Output
- **Status:** ❌ FAILS
- **Error:** `/login` page uses `useSearchParams()` without wrapping in a `<Suspense>` boundary
- **File:** `inspire2live-platform/src/app/login/page.tsx`
- **Root Cause:** Next.js 15+ requires all client components using `useSearchParams()` to be wrapped in `<Suspense>`. The login page likely reads a `?error=` or `?redirect=` param.
- **Fix concept:** Wrap the login page content in `<Suspense fallback={...}>` or extract the `useSearchParams()` usage into a child client component wrapped in Suspense.

### 1.5 Unit Tests
- **Status:** ✅ All passing
- **Results:** 6 test files, 41 tests, 0 failures
  - `rag-status.test.ts` — RAG derivation logic
  - `middleware-routing.test.ts` — middleware route matching
  - `role-access.test.ts` — role normalization and access control
  - `dashboard-view.test.ts` — dashboard variant resolution
  - `profile-view.test.ts` — profile helpers
  - `initiative-workspace.test.ts` — task grouping, status helpers

---

## 2. Page-by-Page Rendering Results

> **Note:** Runtime testing was limited to static code analysis because the build fails (§1.4). Dev server (`pnpm dev`) can start but authenticated routes require a valid Supabase session. Analysis below is based on code review of every page file.

| # | Route | Status | Error Description | Root Cause |
|---|-------|--------|-------------------|------------|
| 1 | `/` | ✅ | Landing page — static content | — |
| 2 | `/login` | ❌ | Build fails: `useSearchParams()` not in Suspense | Missing `<Suspense>` wrapper |
| 3 | `/auth/callback` | ✅ | Route handler — exchanges code for session | — |
| 4 | `/onboarding` | ✅ | Server component loads profile + initiatives, renders wizard | — |
| 5 | `/app/dashboard` | ⚠️ | `searchParams` typed as plain object, not `Promise` | Next.js 15 async searchParams |
| 6 | `/app/profile` | ✅ | Loads profile, renders ProfileEditor client component | — |
| 7 | `/app/initiatives` | ⚠️ | `searchParams` typed as plain object | Next.js 15 async searchParams |
| 8 | `/app/initiatives/[id]` | ⚠️ | `params` typed as `{id: string}` not `Promise` | Next.js 15 async params |
| 9 | `/app/initiatives/[id]/team` | ⚠️ | Same `params` issue | Next.js 15 async params |
| 10 | `/app/initiatives/[id]/discussions` | ⚠️ | Same `params` issue | Next.js 15 async params |
| 11 | `/app/initiatives/[id]/milestones` | ⚠️ | Same `params` issue | Next.js 15 async params |
| 12 | `/app/initiatives/[id]/tasks` | ⚠️ | `params` and `searchParams` both plain objects | Next.js 15 async params/searchParams |
| 13 | `/app/initiatives/[id]/evidence` | ⚠️ | Same as tasks page | Next.js 15 async params/searchParams |
| 14 | `/app/bureau` | ⚠️ | Queries `activity_log`, `milestones`, `tasks`, `initiative_members` with joins that may not match DB FK names exactly | Potential runtime query failures |
| 15 | `/app/congress` | ❌ | Queries `congress_decisions` with columns `title`, `body` — but 00001 schema has `description`, not `title`/`body`. Also uses FK `congress_decisions_initiative_id_fkey` and `congress_topics_submitted_by_fkey` which may not exist in 00007 schema | Schema mismatch (see §5) |
| 16 | `/app/notifications` | ⚠️ | Works if `notifications` table exists. Uses `notifications_initiative_id_fkey` FK name — must verify | Depends on which migration created table |
| 17 | `/app/resources` | ⚠️ | Queries `resources` with columns `partner_org`, `superseded`, `cancer_type` — these are added by 00008 migration. Also queries `resource_translations` table. `searchParams` correctly uses `Promise` (only page that does!) | Works only if 00008 migration applied |
| 18 | `/app/partners` | ⚠️ | Queries `partner_applications` and `partner_audit_log` — tables from 00008 migration. Uses `(supabase as any)` cast to bypass type checking | Works only if 00008 migration applied; type-unsafe |
| 19 | `/app/admin/users` | ✅ | Server component with server action, properly guarded | — |

---

## 3. Middleware & Auth Flows

| Scenario | Expected | Actual (Code Analysis) | Status |
|----------|----------|----------------------|--------|
| Unauthenticated → `/app/*` | Redirect to `/login` | ✅ Middleware checks `supabase.auth.getUser()`, redirects if no user | ✅ |
| Authenticated → `/login` | Redirect to `/app/dashboard` | ✅ Middleware redirects authenticated users away from `/login` | ✅ |
| `onboarding_completed = false` → `/app/*` | Redirect to `/onboarding` | ✅ Middleware queries profile, checks flag, redirects | ✅ |
| Role-based access (`canAccessAppPath`) | Restricted sections blocked | ✅ `role-access.ts` has `canAccessAppPath()` checking `/app/bureau`, `/app/admin/users`, `/app/partners` | ✅ |
| Admin perspective switcher | Cookie `i2l-view-as-role` changes layout | ✅ `view-as.ts` + `view-as-action.ts` server action reads/writes cookie | ✅ |
| Middleware location | Must be at project root | ✅ `inspire2live-platform/middleware.ts` — correct Next.js location | ✅ |

---

## 4. Component Health

| Component | Renders | Interactive | Data-Connected | Issues |
|-----------|---------|-------------|----------------|--------|
| **TopNav** (`top-nav.tsx`) | ✅ | ✅ Mobile menu, profile dropdown, perspective switcher | ✅ Reads profile + viewAs role | None detected |
| **SideNav** (`side-nav.tsx`) | ✅ | ✅ Active state highlighting | ✅ Role-based nav items | None detected |
| **OnboardingWizard** (`onboarding-wizard.tsx`) | ✅ | ✅ 4-step form with validation | ✅ Updates `profiles` table via Supabase client | Stores `firstInitiativeId` in localStorage only — no DB persistence |
| **ProfileEditor** (`profile-editor.tsx`) | ✅ | ✅ Save button with loading state | ✅ Updates `profiles` table | None detected |
| **InitiativeTabs** (`initiative-tabs.tsx`) | ✅ | ✅ Tab navigation with active state | N/A (pure navigation) | None detected |
| **EmptyState** (`empty-state.tsx`) | ✅ | ✅ Optional action link | N/A | Not used by any page (dead component) |
| **Skeleton** (`skeleton.tsx`) | ✅ | N/A | N/A | Not used by any page (dead component) |
| **ErrorBoundary** (`error-boundary.tsx`) | ✅ | ✅ Try again button | N/A | Not used by any page (dead component) |

---

## 5. Database & Migration Integrity

### 5.1 Migration Syntax
All 9 migrations (`00001` through `00009`) are **syntactically valid SQL**. No syntax errors detected.

### 5.2 Schema Conflicts Between Migrations

**CRITICAL: Duplicate table definitions across migrations**

| Table | First defined in | Re-defined in | Conflict |
|-------|-----------------|---------------|----------|
| `notifications` | `00001` (with `link_url`, specific `type` CHECK constraint) | `00007` (`CREATE TABLE IF NOT EXISTS` — different columns: no `link_url`, different `type` values, `body` nullable) | If 00001 runs first, 00007's `CREATE TABLE IF NOT EXISTS` is a no-op. But the page code (`notifications/page.tsx`) queries columns matching 00001's schema. **Low risk** — 00007 is additive. |
| `congress_decisions` | `00001` (columns: `description`, `proposed_by`, `session_id`, `owner_id`, `deadline`, `conversion_status`) | `00007` (`CREATE TABLE IF NOT EXISTS` — columns: `title`, `body`, `session_date`, `conversion_status` with different CHECK values including `declined`) | **HIGH RISK**: The congress page (`congress/page.tsx`) queries `title` and `body` columns, but if 00001 ran first, these columns **don't exist**. The table has `description` instead. |
| `congress_topics` | `00001` (columns: `congress_id`, `submitter_id`, `description`, `vote_count`, `status` with values `submitted/under_review/accepted/not_this_year`) | `00007` (`CREATE TABLE IF NOT EXISTS` — columns: `submitted_by`, `description` nullable, `status` with values `submitted/approved/rejected/discussing/resolved`) | **HIGH RISK**: Column name mismatch: `submitter_id` (00001) vs `submitted_by` (00007). Congress page uses `submitted_by` FK name. If 00001 ran, the column doesn't exist. |
| `topic_votes` | `00001` (PK is `id uuid`) | `00007` as `congress_topic_votes` (composite PK `topic_id, user_id`) | Different table names — both may exist. 00007's `congress_topic_votes` is separate from 00001's `topic_votes`. |

### 5.3 RLS Policy Conflicts (00002 vs 00009)

| Policy Area | 00002 Policy | 00009 Policy | Conflict? |
|-------------|-------------|-------------|-----------|
| `profiles` SELECT | `profiles_select`: `using (true)` — allows everyone | `admin_can_read_all_profiles`: allows own + PlatformAdmin | ⚠️ **Overlapping** — 00002's `profiles_select` already allows ALL reads, making 00009's policy redundant. Not harmful but wasteful. |
| `profiles` UPDATE | `profiles_update_own` + `profiles_update_admin` | `admin_can_update_any_profile` | ⚠️ **Overlapping** — 00002 already has `profiles_update_admin`. 00009 adds another admin UPDATE policy. PostgreSQL OR's policies together, so this works but is redundant. |

### 5.4 Triggers
- ✅ `on_auth_user_created` trigger on `auth.users` → auto-creates profile in `public.profiles`
- ✅ `set_updated_at` triggers on `profiles`, `initiatives`, `tasks`, `milestones`, `discussions`, `partner_engagements`
- ✅ `on_reply_change` trigger updates `discussions.reply_count`
- ✅ `on_vote_change` trigger updates `congress_topics.vote_count`
- ✅ `resources_fts_trigger` updates full-text search vector

### 5.5 Notifications Table
- ✅ `notifications` table exists in `00001` with all required columns
- ✅ Layout's unread count query (`notifications` WHERE `user_id` AND `is_read = false`) will work

### 5.6 Storage Buckets (00003)
- ✅ Three buckets: `evidence-documents`, `avatars`, `compliance-docs`
- ⚠️ No upload code in the app actually references these buckets — all file upload forms have `action="#"` (non-functional placeholders)

### 5.7 Views (00004) Usage
- ✅ `initiative_health` view — referenced in `database.ts` types but **not directly queried** by any page (bureau page does its own joins)
- ✅ `member_activity_summary` view — referenced in `database.ts` types but **not directly queried**
- ✅ `decision_pipeline` view — referenced in `database.ts` types but **not directly queried**
- ✅ `resource_library` view — referenced in `database.ts` types but **not directly queried**
- **Finding:** All 4 views are defined and typed but unused in application code. Pages reconstruct the same data via direct queries.

---

## 6. Dependency & Config Issues

### 6.1 Unused Dependencies

**Search result: 0 imports found** for any of the following packages listed in `package.json`:

| Package | In package.json | Imported in src/ | Verdict |
|---------|----------------|-----------------|---------|
| `@react-pdf/renderer` | ✅ | ❌ | **UNUSED** |
| `react-simple-maps` | ✅ | ❌ | **UNUSED** |
| `next-intl` | ✅ | ❌ | **UNUSED** |
| `resend` | ✅ | ❌ | **UNUSED** |
| `zustand` | ✅ | ❌ | **UNUSED** |
| `@tanstack/react-query` | ✅ | ❌ | **UNUSED** |
| `recharts` | ✅ | ❌ | **UNUSED** |
| `@dnd-kit/core` | ✅ | ❌ | **UNUSED** |
| `@dnd-kit/sortable` | ✅ | ❌ | **UNUSED** |
| `lucide-react` | ✅ | ❌ | **UNUSED** |
| `date-fns` | ✅ | ❌ | **UNUSED** |
| `zod` | ✅ | ❌ | **UNUSED** |

**12 unused dependencies** adding unnecessary weight to `node_modules` and `pnpm-lock.yaml`.

### 6.2 Duplicate Source Files

**CONFIRMED:** Duplicate Supabase client files exist at two locations:

| File | Path 1 (correct — inside project) | Path 2 (stray — workspace root) |
|------|-----------------------------------|--------------------------------|
| `client.ts` | `inspire2live-platform/src/lib/supabase/client.ts` | `src/lib/supabase/client.ts` |
| `server.ts` | `inspire2live-platform/src/lib/supabase/server.ts` | `src/lib/supabase/server.ts` |

The workspace root also has a `tsconfig.json` with path aliases that could cause confusion. The stray files at the workspace root are **not used** by the Next.js project but could confuse IDEs and developers.

### 6.3 Middleware Location
- ✅ `middleware.ts` is at `inspire2live-platform/middleware.ts` — correct location for Next.js App Router

### 6.4 `next.config.ts` Issues
- ❌ `typescript.ignoreBuildErrors: true` — **masks all TypeScript errors during build**
- Known TS issues that would surface without this flag:
  - `searchParams` typed as plain object instead of `Promise` in ~8 pages
  - `params` typed as plain object instead of `Promise` in ~6 pages
  - These are **breaking changes in Next.js 15+** for Server Components

### 6.5 `tsconfig.json` Path Aliases
- ✅ `@/*` resolves to `./src/*` — correctly configured
- ✅ All `import from '@/lib/...'` and `import from '@/components/...'` resolve correctly
- ⚠️ Workspace root `tsconfig.json` also exists but is unrelated to the Next.js project

---

## 7. Issue Registry

| ID | Severity | File(s) | Description | Root Cause |
|----|----------|---------|-------------|------------|
| I-001 | **P0** | `src/app/login/page.tsx` | Production build fails: `useSearchParams()` not wrapped in `<Suspense>` | Next.js 15 requires Suspense boundary for `useSearchParams()` |
| I-002 | **P0** | `next.config.ts` | `typescript.ignoreBuildErrors: true` masks all TS errors | Config flag suppresses compiler |
| I-003 | **P0** | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts` (workspace root) | Duplicate source files at workspace root outside project directory | Copy/paste error during development |
| I-004 | **P1** | `src/app/app/congress/page.tsx` | Queries `congress_decisions.title` and `congress_decisions.body` columns that don't exist in 00001 schema (schema has `description`) | Migration 00001 vs 00007 schema mismatch; 00007 `CREATE TABLE IF NOT EXISTS` is no-op if 00001 ran first |
| I-005 | **P1** | `src/app/app/congress/page.tsx` | Queries `congress_topics` with FK `congress_topics_submitted_by_fkey` but 00001 schema column is `submitter_id`, not `submitted_by` | Migration 00001 vs 00007 column name mismatch |
| I-006 | **P1** | Multiple pages (8+) | `searchParams` and `params` typed as synchronous objects instead of `Promise<>` | Next.js 15+ breaking change for Server Components |
| I-007 | **P1** | `src/app/app/resources/page.tsx` | Queries `resources.partner_org`, `resources.superseded`, `resources.cancer_type`, `resource_translations` — columns/table added in 00008 which conflicts with 00001's `resources` schema | 00008 uses `ADD COLUMN IF NOT EXISTS` which works, but 00001 defines `version` as `int` while 00008 adds `version` as `text` |
| I-008 | **P1** | `src/app/app/partners/page.tsx` | Uses `(supabase as any)` to bypass TypeScript for `partner_applications` and `partner_audit_log` queries | Tables not in `database.ts` type definitions |
| I-009 | **P1** | `supabase/migrations/00007_wp4_congress_notifications.sql` | Seed data references slugs (`mced-patient-voice-2024`, `molecular-dx-eu-access`, `prom-standardisation`) that don't exist — 00005 uses different slugs (`multi-cancer-early-detection`, `molecular-diagnostics-nl`) and 00006 uses yet different ones | Seed data slug mismatch across migrations |
| I-010 | **P2** | `package.json` | 12 unused dependencies installed but never imported | Over-provisioned dependencies |
| I-011 | **P2** | `src/components/ui/empty-state.tsx`, `skeleton.tsx`, `error-boundary.tsx` | UI components defined but never imported by any page | Dead code |
| I-012 | **P2** | `supabase/migrations/00004_views.sql` | 4 database views (`initiative_health`, `member_activity_summary`, `decision_pipeline`, `resource_library`) defined but never queried by app code | Unused views |
| I-013 | **P2** | `supabase/migrations/00002_rls_policies.sql` + `00009_admin_bootstrap.sql` | Overlapping RLS policies on `profiles` (00002 allows all SELECT, 00009 adds redundant admin SELECT) | Redundant policies |
| I-014 | **P2** | `src/app/app/congress/page.tsx` | Topic submission form has `action="#"` — non-functional | No server action implemented |
| I-015 | **P2** | `src/app/app/resources/page.tsx` | Upload form has `action="#"` — non-functional | No server action implemented |
| I-016 | **P2** | `src/app/app/partners/page.tsx` | Application form has `action="#"`, review buttons have `action="/app/partners/{id}/approve"` — routes don't exist | No server actions/routes implemented |
| I-017 | **P2** | `src/app/app/notifications/page.tsx` | "Mark all read" form posts to `/app/notifications/mark-all-read` — route doesn't exist | No route handler implemented |

---

## 8. Recommended Fix Strategy

### 8.1 Immediate (P0 — app won't build for production)

1. **I-001: Fix `/login` Suspense boundary**
   - Wrap `useSearchParams()` usage in a child client component inside `<Suspense>`
   - Estimated: 15 minutes

2. **I-002: Remove `ignoreBuildErrors: true`**
   - Remove from `next.config.ts`
   - Fix all TypeScript errors that surface (primarily `params`/`searchParams` Promise types)
   - Estimated: 1–2 hours

3. **I-003: Delete workspace root duplicate files**
   - Delete `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` at workspace root
   - Delete workspace root `tsconfig.json` if not needed
   - Estimated: 5 minutes

### 8.2 High Priority (P1 — broken features at runtime)

4. **I-004 + I-005: Fix Congress page schema mismatch**
   - Option A: Rewrite `congress/page.tsx` to use 00001 schema column names (`description` instead of `title`/`body`, `submitter_id` instead of `submitted_by`)
   - Option B: Add an `ALTER TABLE` migration to add `title` and `body` columns to match page expectations
   - Estimated: 1 hour

5. **I-006: Fix `params`/`searchParams` typing across all pages**
   - Update all Server Component signatures to use `Promise<>` types
   - Add `await` for `params` and `searchParams` access
   - Affected files: dashboard, initiatives list, initiative detail + 5 sub-pages, tasks, evidence
   - Estimated: 1–2 hours

6. **I-007 + I-008: Reconcile resources schema and add types**
   - Verify 00008 migration `ADD COLUMN IF NOT EXISTS` works correctly against 00001's `resources` table
   - Add `partner_applications`, `partner_audit_log`, `resource_translations` to `database.ts`
   - Remove `(supabase as any)` casts
   - Estimated: 1–2 hours

7. **I-009: Fix seed data slug references in 00007**
   - Update seed `WITH` clauses to use correct slugs from 00005/00006, or make them idempotent with fallbacks
   - Estimated: 30 minutes

### 8.3 Cleanup (P2 — tech debt, unused code)

8. **I-010: Remove unused dependencies** — `pnpm remove @react-pdf/renderer react-simple-maps next-intl resend zustand @tanstack/react-query recharts @dnd-kit/core @dnd-kit/sortable lucide-react date-fns zod`
9. **I-011: Either use or remove UI components** (`EmptyState`, `Skeleton`, `ErrorBoundary`)
10. **I-012: Either use database views in app code or document why they exist**
11. **I-013: Remove redundant RLS policies from 00009**
12. **I-014–I-017: Implement form server actions** for congress topic submission, resource upload, partner actions, and notification mark-all-read

### 8.4 Dependency Order

```
I-003 (delete duplicates)     ← no dependencies, do first
    ↓
I-001 (Suspense fix)          ← enables production build
    ↓
I-006 (params/searchParams)   ← must be done before removing ignoreBuildErrors
    ↓
I-002 (remove ignoreBuildErrors) ← reveals any remaining TS errors
    ↓
I-004 + I-005 (congress schema) ← fixes runtime data loading
    ↓
I-007 + I-008 (resources/partners types) ← fixes runtime data loading
    ↓
I-009 (seed data slugs)       ← fixes dev data population
    ↓
I-010 through I-017 (cleanup) ← independent, any order
```

---

*End of audit report.*
