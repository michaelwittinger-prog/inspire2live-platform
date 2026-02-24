# ADR-0004: Multi-Tier Role & Permission Model

- **Status:** accepted
- **Date:** 2025-11-20
- **Owners:** Michael Wittinger

## Context

The Inspire2Live Platform serves diverse user types — from patient advocates and researchers to board members and industry partners — each requiring different levels of access across 13+ functional spaces. A simple binary "admin/user" model is insufficient. The design document mandates that:

1. Patient voice must be structurally equal to other roles within initiatives.
2. Industry partners must be structurally scoped (no access to editorial or governance content).
3. Individual users may need exceptions to their role defaults.

- Related requirements: `REQ-SEC-001`, `REQ-SEC-002`, `REQ-SEC-003`, `REQ-IA-001`

## Decision

Implement a **4-tier permission resolution system**:

```
Tier 1: Role defaults         → ROLE_SPACE_DEFAULTS (8 roles × 13 spaces, hardcoded in role-access.ts)
Tier 2: Admin role overrides  → role_default_overrides table (admin can change defaults per role)
Tier 3: Global user override  → user_space_permissions with is_global=true
Tier 4: Scoped user override  → user_space_permissions for specific space
```

Resolution: most specific tier wins. Access levels are `invisible` (0), `view` (1), `edit` (2), `manage` (3).

### Key design choices

- **RLS enforces access at DB level** — not just in UI. Every table has RLS policies that check the user's effective role.
- **PatientAdvocate = Researcher** within initiatives — both get `edit` on initiatives and tasks.
- **IndustryPartner** gets `invisible` on congress, board, bureau, network, stories — structurally scoped.
- **Congress and initiative roles are additive** — stored in separate membership tables, don't replace platform role.

## Alternatives considered

1. **Simple RBAC (role → permissions list)** — Doesn't handle the space × role matrix granularity needed. No per-user exceptions.
2. **ABAC (Attribute-Based Access Control)** — More flexible but significantly more complex to implement and reason about. Overkill for the current scale.
3. **Permission flags per user** — Would require 100+ boolean columns. Unmaintainable.

## Consequences

### Positive
- Clean separation: role defaults cover 95% of cases; overrides handle edge cases.
- Admin UI (`/app/admin/permissions`) gives non-technical admins control without code changes.
- Patient equality is guaranteed by the default matrix — not by policy documents.
- Industry partner scoping is enforced structurally — can't be accidentally bypassed.

### Negative / trade-offs
- 4-tier resolution adds complexity — developers must understand the cascade.
- `ROLE_SPACE_DEFAULTS` is hardcoded in TypeScript; must keep in sync with documentation.
- Adding a new space requires updating the matrix in code + docs.
- Override queries add a DB roundtrip on each page load (mitigated by caching).

## Rollout / Migration plan

- Phase 0: Hardcoded `ROLE_SPACE_DEFAULTS` in `role-access.ts` (migration 00001, 00002).
- Phase 1: `user_space_permissions` table added (migration 00022).
- Phase 2: `role_default_overrides` table added (migration 00023).
- Phase 3: Admin UI for managing overrides (`/app/admin/permissions`).

## References

- Code: `src/lib/role-access.ts`, `src/lib/permissions.ts`, `src/lib/platform-roles.ts`
- Documentation: `docs/ROLE_PERMISSION_MODEL.md`
- Tests: `src/test/unit/role-access.test.ts`, `src/test/unit/permissions.test.ts`
