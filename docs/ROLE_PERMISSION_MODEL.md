# Role & Permission Model — Inspire2Live Platform

> **Purpose:** Human-readable reference for the full permission matrix, role definitions, override logic.  
> **Audience:** Developers debugging access issues, new team members, auditors.  
> **Code reference:** `src/lib/role-access.ts`, `src/lib/permissions.ts`, `src/lib/platform-roles.ts`  
> **Last reviewed:** 2026-02-24

---

## 1 · Role Definitions

The platform defines 8 roles. Every authenticated user has exactly one primary role stored in `profiles.role`.

| Role | Code Value | Description | Typical User |
|------|-----------|-------------|-------------|
| **Super Admin** | `super_admin` | Platform owner, unrestricted | System administrator |
| **Admin** | `admin` | Organization-wide admin | Inspire2Live staff |
| **Board Member** | `board_member` | Governance and oversight | Board of directors |
| **Bureau Member** | `bureau_member` | Operational management | Bureau / operations team |
| **Hub Coordinator** | `HubCoordinator` | Regional hub leader | Hub managers |
| **Researcher** | `Researcher` | Scientific contributor | Clinicians, scientists |
| **Patient Advocate** | `PatientAdvocate` | Patient voice representative | Patient advocates |
| **Industry Partner** | `IndustryPartner` | External partner (scoped) | Pharma, medtech companies |

### Design principle

**Patient voice is structurally equal.** `PatientAdvocate` has the same workspace rights within initiatives as `Researcher` — there is no "patient-lite" tier.

---

## 2 · Access Level Scale

Every space × role combination resolves to one of four access levels:

| Level | Value | Description |
|-------|-------|-------------|
| **invisible** | 0 | Space hidden from navigation; 403 if accessed directly |
| **view** | 1 | Read-only access; can see content but not modify |
| **edit** | 2 | Can create and edit own content within the space |
| **manage** | 3 | Full control: edit all content, assign roles, configure |

---

## 3 · Default Permission Matrix

This is the `ROLE_SPACE_DEFAULTS` matrix defined in `src/lib/role-access.ts`.

| Space | super_admin | admin | board_member | bureau_member | HubCoordinator | Researcher | PatientAdvocate | IndustryPartner |
|-------|:-----------:|:-----:|:------------:|:-------------:|:--------------:|:----------:|:---------------:|:---------------:|
| **dashboard** | manage | manage | view | manage | edit | view | view | view |
| **initiatives** | manage | manage | view | edit | manage | edit | edit | view |
| **congress** | manage | manage | view | manage | edit | view | view | invisible |
| **board** | manage | manage | manage | view | invisible | invisible | invisible | invisible |
| **bureau** | manage | manage | invisible | manage | view | invisible | invisible | invisible |
| **resources** | manage | manage | view | edit | edit | edit | view | view |
| **partners** | manage | manage | invisible | edit | view | invisible | invisible | edit |
| **network** | manage | manage | view | edit | manage | view | view | invisible |
| **stories** | manage | manage | view | edit | edit | view | edit | invisible |
| **tasks** | manage | manage | view | edit | edit | edit | edit | view |
| **notifications** | manage | manage | view | view | view | view | view | view |
| **admin** | manage | manage | invisible | invisible | invisible | invisible | invisible | invisible |
| **profile** | manage | manage | edit | edit | edit | edit | edit | edit |

---

## 4 · Override System

The default matrix can be overridden at two levels, stored in the `user_space_permissions` table.

### 4.1 Global Override

Applies to **all spaces** for a specific user.

```sql
-- Example: Give user full manage access everywhere
INSERT INTO user_space_permissions (user_id, space, access_level, is_global)
VALUES ('user-uuid', '*', 'manage', true);
```

### 4.2 Scoped Override

Applies to a **specific space** for a specific user.

```sql
-- Example: Give a Researcher edit access to congress
INSERT INTO user_space_permissions (user_id, space, access_level, is_global)
VALUES ('user-uuid', 'congress', 'edit', false);
```

### Resolution Order

```
1. Check for scoped override (user + specific space)
2. Check for global override (user + all spaces)
3. Fall back to ROLE_SPACE_DEFAULTS[role][space]

Winner: highest-specificity match
```

### Admin UI

PlatformAdmins can manage overrides in: `/app/admin/permissions`

---

## 5 · Congress-Specific Roles

Within a congress event, users can have additional congress-scoped roles stored in `congress_members`:

| Congress Role | Description |
|--------------|-------------|
| `organizer` | Full control over congress configuration |
| `speaker` | Can manage their session content |
| `moderator` | Can moderate discussions and Q&A |
| `attendee` | Read + participate in sessions |
| `volunteer` | Operational support role |

These roles are **additive** to the platform role — they don't replace it.

---

## 6 · Initiative-Specific Roles

Within an initiative, membership roles are stored in `initiative_members`:

| Initiative Role | Description |
|----------------|-------------|
| `lead` | Initiative owner, full control |
| `contributor` | Can edit tasks, milestones, evidence |
| `observer` | Read-only access to initiative content |

---

## 7 · Permission Check Patterns

### In Server Actions

```typescript
import { resolveAccess } from '@/lib/role-access'

// Check if user can edit initiatives
const level = await resolveAccess(supabase, userId, 'initiatives')
if (level < 2) { // 2 = edit
  return { error: 'Insufficient permissions' }
}
```

### In Server Components (page-level)

```typescript
// In page.tsx
const level = await resolveAccess(supabase, userId, 'congress')
if (level === 0) notFound() // invisible = 404
```

### In Side Navigation

```typescript
// Spaces with level 0 (invisible) are hidden from nav
const visibleSpaces = allSpaces.filter(s => resolveAccess(role, s) > 0)
```

---

## 8 · View-As (Admin Impersonation)

PlatformAdmins can temporarily view the platform as another role:

- Stored in session cookie (not database)
- Does **not** change actual permissions for data writes
- Used for debugging and QA
- Controlled via `/app/admin/` → "View As" dropdown

---

## 9 · Troubleshooting Access Issues

| Symptom | Check |
|---------|-------|
| User can't see a nav item | Check `ROLE_SPACE_DEFAULTS` for their role + space → is it `invisible`? |
| User can see but not edit | Check if level is `view` (1) instead of `edit` (2) |
| One specific user has wrong access | Check `user_space_permissions` for overrides |
| All users of a role have wrong access | Check `ROLE_SPACE_DEFAULTS` in `role-access.ts` |
| User has access they shouldn't | Check for leftover global override in DB |

---

*Last updated: 2026-02-24 · Maintainer: Michael Wittinger*
