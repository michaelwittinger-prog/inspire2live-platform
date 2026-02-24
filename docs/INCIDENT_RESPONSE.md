# Incident Response Runbook — Inspire2Live Platform

> **Purpose:** Operational playbook for when production breaks.  
> **Audience:** On-call developer, PlatformAdmin, project lead.  
> **Last reviewed:** 2026-02-24

---

## 1 · Severity Levels

| Level | Name | Description | Response Time | Example |
|-------|------|-------------|---------------|---------|
| **SEV-1** | Critical | Platform fully down, data loss, security breach | 15 min | Supabase outage, RLS bypass discovered |
| **SEV-2** | Major | Core feature broken for all users | 1 hour | Auth flow broken, invitation system down |
| **SEV-3** | Moderate | Feature degraded but workaround exists | 4 hours | Slow queries, one role seeing wrong data |
| **SEV-4** | Minor | Cosmetic issue, non-blocking bug | Next business day | Styling glitch, typo in notification |

---

## 2 · Escalation Path

```
Developer notices issue
    │
    ▼
┌─────────────────┐
│ Assess severity  │
│ (use table above)│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
  SEV-3/4   SEV-1/2
    │         │
    ▼         ▼
  Log issue  Notify project lead immediately
  Fix in     (Michael Wittinger)
  next cycle │
             ▼
         ┌───────────────┐
         │ SEV-1 only:   │
         │ Notify DPO if │
         │ data breach    │
         └───────┬───────┘
                 │
                 ▼
         Incident channel created
         (Teams / email thread)
```

### Contact list

| Role | Name | Contact |
|------|------|---------|
| Project Lead / Admin | Michael Wittinger | Platform admin email |
| Data Protection Officer | TBD | To be appointed before public launch |

---

## 3 · Incident Response Steps

### Phase 1: Detect & Assess (0–15 min)

1. **Confirm the issue is real** — reproduce in production, check Vercel logs.
2. **Determine severity** using the table above.
3. **Check if it's an upstream outage:**
   - Supabase: https://status.supabase.com
   - Vercel: https://www.vercel-status.com
   - Resend: https://status.resend.com
4. **Create an incident record** (see §6 below).

### Phase 2: Contain (15 min – 1 hour)

| Scenario | Containment Action |
|----------|-------------------|
| Bad deployment | Roll back via Vercel dashboard (see §4) |
| Database migration broke data | Revert migration (see §5) |
| Security vulnerability | Disable affected feature via feature flag or Vercel env |
| Auth system broken | Supabase dashboard → disable signups temporarily |
| Data leak | Rotate affected secrets, revoke sessions |

### Phase 3: Fix & Verify

1. Develop and test the fix locally.
2. Push to `main` — CI must pass.
3. Verify fix in production.
4. Update incident record with resolution.

### Phase 4: Post-Incident Review

Within 48 hours of resolution:

1. **Timeline:** Document what happened, when, and what was done.
2. **Root cause:** Why did it happen? (5-whys analysis)
3. **Impact:** How many users affected? What data was exposed/lost?
4. **Prevention:** What changes prevent recurrence?
5. **Action items:** File as issues/tasks with owners and deadlines.

---

## 4 · Vercel Rollback Procedure

Vercel keeps every deployment as an immutable snapshot. Rolling back is instant.

### Via Vercel Dashboard

1. Go to: https://vercel.com → inspire2live-platform → Deployments
2. Find the last known-good deployment (green checkmark).
3. Click the **⋯** menu → **Promote to Production**.
4. Verify the site is working.

### Via CLI

```bash
# List recent deployments
vercel ls

# Promote a specific deployment
vercel promote <deployment-url> --yes
```

### Important notes

- Rollback only affects the **frontend/server code** — database migrations are NOT rolled back.
- If a migration caused the issue, see §5 below.

---

## 5 · Database Migration Rollback

**Supabase migrations are forward-only by default.** There is no automatic rollback.

### Manual rollback procedure

1. **Identify the breaking migration** (e.g., `00026_notifications_invite_type_fix.sql`).
2. **Write a reversal migration** (e.g., `00027_revert_00026.sql`) that undoes the changes:
   ```sql
   -- 00027_revert_00026.sql
   -- Revert: drop the new constraint, restore the old one
   ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
   ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('old', 'values'));
   ```
3. **Test locally** with `supabase db reset`.
4. **Push to remote** with `supabase db push` or `pnpm db:push:win`.
5. **Verify** data integrity after rollback.

### Prevention

- Always test migrations against a copy of production data (Supabase branching or local reset).
- Never modify data in migrations — use separate seed scripts.
- Every migration should be idempotent (`IF NOT EXISTS`, `DROP IF EXISTS`).

---

## 6 · Incident Record Template

Create a file or issue for each incident:

```markdown
# Incident: [Short Title]

- **Severity:** SEV-[1-4]
- **Detected:** YYYY-MM-DD HH:MM UTC
- **Resolved:** YYYY-MM-DD HH:MM UTC
- **Duration:** X hours Y minutes
- **Affected users:** [count or "all"]

## Timeline

| Time | Event |
|------|-------|
| HH:MM | Issue reported by [who] |
| HH:MM | Severity assessed as SEV-X |
| HH:MM | Containment action: [what] |
| HH:MM | Fix deployed |
| HH:MM | Verified in production |

## Root Cause

[Description]

## Impact

[What broke, what data was affected, how many users]

## Resolution

[What was done to fix it]

## Prevention

- [ ] Action item 1 — Owner: @name — Due: YYYY-MM-DD
- [ ] Action item 2 — Owner: @name — Due: YYYY-MM-DD
```

---

## 7 · Communication Templates

### For users (SEV-1/2 — post on platform or email)

> **Service Disruption Notice**
>
> We are aware of an issue affecting [describe feature]. Our team is actively working on a resolution. We expect to restore normal service by [estimate].
>
> No action is required on your part. We will update you when the issue is resolved.

### For post-resolution

> **Service Restored**
>
> The issue affecting [describe feature] has been resolved as of [time]. [Brief explanation of what happened and what was done]. We apologize for any inconvenience.

---

*Last updated: 2026-02-24 · Maintainer: Michael Wittinger*
