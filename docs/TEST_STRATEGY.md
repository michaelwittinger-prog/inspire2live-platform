# Test Strategy — Inspire2Live Platform

> **Purpose:** Dedicated test strategy defining what to test, how, and why.  
> **Audience:** Developers adding features, reviewers checking PRs.  
> **Last reviewed:** 2026-02-24

---

## 1 · Philosophy

**Risk-based, lean testing.** Quality comes from testing the right things deeply — not from blanket coverage or snapshot tests.

### Core principles

1. **Test behaviour, not implementation.** Assert on outputs given inputs. Don't couple tests to internal structure.
2. **Pure logic first.** Unit test business rules (RAG status, permissions, assignments). Skip presentational components.
3. **Critical paths via E2E.** Auth flow, route protection, and role-based access are too important for unit tests alone.
4. **No mocking Supabase I/O in unit tests.** If a function calls Supabase, it gets a mock client injected — but the mock simulates the *contract*, not the *implementation*.
5. **Fast feedback loop.** Full unit suite must complete in < 10 seconds locally.

---

## 2 · Test Pyramid

```
        ┌─────────┐
        │   E2E   │  4–8 smoke paths (Playwright)
        │  Smoke  │  Runs: main + release branches only
        ├─────────┤
        │  Unit   │  80+ assertions across 16+ test files (Vitest)
        │  Tests  │  Runs: every push, every PR
        ├─────────┤
        │  Type   │  TypeScript strict mode (pnpm typecheck)
        │  Check  │  Runs: every push, every PR
        ├─────────┤
        │  Lint   │  ESLint (pnpm lint)
        │         │  Runs: every push, every PR
        └─────────┘
```

---

## 3 · Test Types

### 3.1 Unit Tests (`src/test/unit/`)

**Tool:** Vitest + jsdom environment  
**Run:** `pnpm test` (or `pnpm test:watch` for dev loop)

| What to Test | Example | Priority |
|-------------|---------|----------|
| RAG status derivation | `rag-status.test.ts` | High |
| Permission resolution | `permissions.test.ts`, `role-access.test.ts` | High |
| Middleware routing decisions | `middleware-routing.test.ts` | High |
| Auth redirect URL logic | `auth-redirect-url.test.ts` | High |
| Congress policy / assignments | `congress-policy.test.ts`, `congress-assignments.test.ts` | High |
| Invitation logic | `invitations.test.ts` | High |
| Dashboard view transforms | `dashboard-view.test.ts` | Medium |
| Profile view logic | `profile-view.test.ts` | Medium |
| Admin data functions | `admin-permissions-data.test.ts` | Medium |

**What NOT to unit test:**
- React component rendering (use E2E for critical paths)
- Supabase client initialization
- CSS / Tailwind classes
- Static page content

### 3.2 E2E Smoke Tests (`src/test/e2e/`)

**Tool:** Playwright (Chromium only during MVP)  
**Run:** `pnpm test:e2e` (requires dev server or auto-starts)

| Path | File | Validates |
|------|------|-----------|
| Auth gate | `auth.spec.ts` | Unauthenticated users redirected to login |
| Dashboard load | `dashboard.spec.ts` | Authenticated dashboard renders |

**Future paths to add:**
- Initiative creation flow
- Invitation accept flow
- Patient story submission
- Admin permission override

### 3.3 Type Checking

**Tool:** TypeScript (`pnpm typecheck`)  
**Strict mode:** Yes — `"strict": true` in `tsconfig.json`  
**Zero `any`:** Enforced by convention; flagged in PR review.

### 3.4 Linting

**Tool:** ESLint with Next.js config (`pnpm lint`)  
**Config:** `eslint.config.mjs`

---

## 4 · Coverage

### Thresholds (enforced in CI)

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| Lines | 60% | Covers core business logic in `src/lib/` |
| Functions | 60% | Ensures exported functions have at least one test |

### Coverage scope

Coverage is measured only on `src/lib/**/*.{ts,tsx}` — business logic modules.

**Excluded from coverage:**
- `src/lib/demo-data.ts` — large seed content, not unit-tested
- `src/lib/supabase/**` — thin wrappers around runtime
- `src/lib/view-as.ts` — depends on Next.js cookies; tested via E2E
- All `src/app/`, `src/components/` — UI tested via E2E, not snapshots

### Running coverage

```bash
pnpm test:coverage
```

Report is uploaded as a CI artifact (7-day retention).

---

## 5 · Risk-Based Coverage Map

| Area | Risk Level | Test Type | Status |
|------|-----------|-----------|--------|
| RAG status logic | 🔴 High | Unit | ✅ Covered |
| Permission / role resolution | 🔴 High | Unit | ✅ Covered |
| Middleware route guards | 🔴 High | Unit + E2E | ✅ Covered |
| Auth callback / login flow | 🔴 High | E2E | ✅ Covered |
| Invitation system | 🔴 High | Unit | ✅ Covered |
| Congress policy | 🟡 Medium | Unit | ✅ Covered |
| Congress workspace actions | 🟡 Medium | Unit | ✅ Covered |
| Dashboard data transforms | 🟡 Medium | Unit | ✅ Covered |
| Admin permissions | 🟡 Medium | Unit | ✅ Covered |
| RLS data isolation | 🔴 High | Integration (Phase 2) | ⏳ Planned |
| File upload validation | 🟡 Medium | Unit (Phase 2) | ⏳ Planned |
| Email delivery | 🟡 Medium | Integration (Phase 2) | ⏳ Planned |
| UI components | 🟢 Low | None (MVP) | — |
| Static pages | 🟢 Low | None | — |

---

## 6 · Writing New Tests

### Convention

- File: `src/test/unit/<module-name>.test.ts`
- One test file per `src/lib/<module>.ts`
- Use `describe` blocks to group by function
- Use `it` (not `test`) for consistency

### Template

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '@/lib/my-module'

describe('myFunction', () => {
  it('returns expected result for valid input', () => {
    expect(myFunction('input')).toBe('expected')
  })

  it('handles edge case gracefully', () => {
    expect(myFunction('')).toBe('fallback')
  })
})
```

### For functions with Supabase dependency

Inject a mock client rather than mocking the module:

```typescript
function makeSupabase(overrides?: { ... }) {
  return {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
    from: (table: string) => { /* return chainable mock */ },
  }
}
```

See `src/test/unit/invitations.test.ts` for a full example.

---

## 7 · CI Integration

Tests run in GitHub Actions (`.github/workflows/ci.yml`):

```
Job 1: quality    → lint → typecheck → build
Job 2: unit-tests → vitest --coverage (parallel with Job 3)
Job 3: e2e        → playwright (main + release only)
```

### CI gates

- **All 3 jobs must pass** before merge.
- **Coverage report** uploaded as artifact.
- **Playwright failure report** uploaded on test failure.

### Adding a new test to CI

No action needed — all files matching `src/test/unit/**/*.test.ts` are auto-discovered by Vitest.

---

## 8 · Acceptance Criteria for Test PRs

- [ ] New business logic in `src/lib/` has a corresponding test file
- [ ] Tests are deterministic (no date/time dependencies without mocking)
- [ ] No `console.log` left in test files
- [ ] Coverage thresholds still pass (`pnpm test:coverage`)
- [ ] Test names describe behaviour, not implementation

---

*Last updated: 2026-02-24 · Maintainer: Michael Wittinger*
