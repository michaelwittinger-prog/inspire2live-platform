# Security & Data Privacy Policy — Inspire2Live Platform

> **Audience:** Developers, auditors, DPO, platform administrators.  
> **Regulation scope:** EU General Data Protection Regulation (GDPR), Dutch UAVG implementation.  
> **Last reviewed:** 2026-02-24

---

## 1 · Data Classification

All data stored or processed by the platform is classified into one of four tiers.
Classification determines storage rules, access controls, retention, and breach notification obligations.

| Tier | Label | Examples | Storage | Access |
|------|-------|----------|---------|--------|
| **T1** | Public | Published patient stories, congress agenda, landing page content | Supabase (no RLS restriction on read) | Anyone |
| **T2** | Internal | Initiative names, task titles, milestone dates, resource metadata | Supabase (RLS: authenticated) | Authenticated users with space access |
| **T3** | Confidential | User emails, profile details, role assignments, invitation records | Supabase (RLS: owner or admin) | Data subject, PlatformAdmin |
| **T4** | Sensitive / Health-Adjacent | Patient story drafts (pre-publication), evidence attachments, personal messages | Supabase (RLS: owner + explicit share) | Data subject, assigned reviewers |

### Health data disclaimer

The Inspire2Live Platform is **not** a medical records system. It does not store clinical data, diagnoses, or treatment records. Patient stories are self-authored narratives shared voluntarily. Nevertheless, story content may contain health-related information and is treated as **T4 Sensitive** until published.

---

## 2 · GDPR Compliance Controls

### 2.1 Lawful Basis for Processing

| Processing Activity | Lawful Basis (Art. 6) | Notes |
|--------------------|-----------------------|-------|
| Account creation & authentication | Consent (opt-in registration) | Magic link / password — no social login yet |
| Profile storage (name, email, role) | Contract performance | Necessary for platform functionality |
| Initiative / task participation | Legitimate interest | Core organizational purpose |
| Patient story submission | Explicit consent (Art. 9) | Separate consent checkbox before submission |
| Email notifications & invitations | Consent | Configurable; can be disabled |
| Analytics / usage metrics | Legitimate interest | Anonymized; no third-party trackers |

### 2.2 Data Subject Rights Implementation

| Right | Implementation | Endpoint / Process |
|-------|---------------|--------------------|
| **Access** (Art. 15) | User can view all their data via Profile page | `/app/profile` |
| **Rectification** (Art. 16) | User can edit profile, stories, tasks | Profile editor, inline edit |
| **Erasure** (Art. 17) | Admin-assisted account deletion (Phase 2: self-service) | PlatformAdmin → Admin panel |
| **Portability** (Art. 20) | Data export as JSON (Phase 2) | Not yet implemented — tracked as `REQ-SEC-010` |
| **Restriction** (Art. 18) | Account deactivation without deletion | Admin panel → set `status = inactive` |
| **Objection** (Art. 21) | Withdraw from specific processing | Contact DPO or admin |

### 2.3 Consent Management

- **Registration:** Creating an account constitutes consent for T2/T3 processing.
- **Patient stories:** Separate consent checkbox: *"I understand this story may be published and I consent to sharing."*
- **Email notifications:** Opt-in at registration; toggle in profile settings.
- **Consent withdrawal:** User can delete stories, disable notifications, or request account deletion.

### 2.4 Data Retention Policy

| Data Type | Retention Period | Deletion Trigger |
|-----------|-----------------|------------------|
| Active user profiles | Duration of account | Account deletion request |
| Deactivated profiles | 12 months after deactivation | Auto-purge job (Phase 2) |
| Published patient stories | Indefinite (public interest) | Author withdrawal request |
| Draft stories (unpublished) | 6 months after last edit | Auto-archive |
| Invitation records | 90 days after response/expiry | Scheduled cleanup |
| Notification records | 90 days | Scheduled cleanup |
| Audit logs | 24 months | Rolling purge |
| Session tokens | Supabase default (JWT expiry) | Auto-expire |

---

## 3 · Authentication & Session Security

### 3.1 Authentication Methods

| Method | Status | Notes |
|--------|--------|-------|
| Magic Link (email OTP) | ✅ Active | Primary auth method |
| Password + email | ✅ Active | Alternative for users who prefer it |
| OAuth (Google, GitHub) | 🔜 Phase 2 | Not yet implemented |
| MFA / TOTP | 🔜 Phase 3 | Recommended for admin accounts |

### 3.2 Session Management

- **JWT tokens** issued by Supabase Auth with configurable expiry.
- **Refresh tokens** rotate on use (Supabase default behavior).
- **Server-side session validation** in middleware on every request.
- **No client-side token storage** in localStorage — cookies only (httpOnly, secure, sameSite).

### 3.3 Password Policy (when password auth is used)

- Minimum 8 characters (Supabase default).
- Password reset via email link with 1-hour expiry.
- No password stored in application code — delegated entirely to Supabase Auth.

---

## 4 · Authorization & Row-Level Security

### 4.1 Principle

**All data access is enforced at the database level via PostgreSQL Row-Level Security (RLS).**
UI-level checks are a convenience; they are never the sole authorization mechanism.

### 4.2 RLS Policy Categories

| Category | Example Policy | Tables |
|----------|---------------|--------|
| Owner-only | `auth.uid() = user_id` | `profiles`, `patient_stories` (drafts) |
| Role-based | `role IN ('PlatformAdmin', 'HubCoordinator')` | `invitations`, `admin_*` |
| Membership-based | User is member of initiative/congress | `initiative_members`, `congress_members` |
| Public read | No restriction on SELECT | Published stories, congress agenda |

### 4.3 Admin Override

- `PlatformAdmin` has broad read access but **cannot bypass RLS for writes** without explicit policy.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — used only in server-side admin actions, never exposed to client.

---

## 5 · Infrastructure Security

### 5.1 Hosting & Network

| Layer | Provider | Security Controls |
|-------|----------|-------------------|
| Frontend / Edge | Vercel | TLS 1.3, DDoS protection, edge caching, no server SSH |
| Database | Supabase (AWS eu-central-1) | Encrypted at rest (AES-256), encrypted in transit (TLS), daily backups |
| Storage | Supabase Storage (S3-compatible) | Bucket-level RLS, private by default |
| DNS | Vercel / Cloudflare | DNSSEC capable |
| Email | Resend (transactional) | SPF, DKIM, DMARC configured |

### 5.2 Secret Management

| Secret | Storage Location | Access |
|--------|-----------------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env (server-only) | Never exposed to browser |
| `RESEND_API_KEY` | Vercel env (server-only) | Server actions only |
| `CRON_SECRET` | Vercel env (server-only) | Cron endpoint auth |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel env (public) | Safe — public project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel env (public) | Safe — scoped by RLS |

### 5.3 Dependency Security

- **Lockfile:** `pnpm-lock.yaml` with `--frozen-lockfile` in CI.
- **Audit:** `pnpm audit` run periodically (to be added to CI in Phase 2).
- **Node version:** Pinned in `.nvmrc` (v20 LTS).
- **No native dependencies** except `esbuild` (build-only).

---

## 6 · Incident & Breach Response

See [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) for the full operational runbook.

### GDPR Breach Notification (Art. 33, 34)

| Obligation | Timeframe | Action |
|-----------|-----------|--------|
| Notify supervisory authority | 72 hours after awareness | Document scope, affected data tiers, remediation |
| Notify affected data subjects | Without undue delay (if high risk) | Email notification with plain-language description |
| Internal documentation | Immediately | Log in incident register with timeline |

---

## 7 · Third-Party Data Processors

| Processor | Purpose | Data Shared | DPA Status |
|-----------|---------|-------------|------------|
| Supabase (Singapore Pte Ltd) | Auth, DB, Storage | All platform data | Standard contractual clauses (EU) |
| Vercel Inc. | Hosting, Edge compute | Request logs, static assets | DPA available on request |
| Resend Inc. | Transactional email | Email addresses, notification content | DPA available on request |

> **Action item:** Execute formal Data Processing Agreements (DPAs) with all processors before public launch.

---

## 8 · Security Checklist for Developers

Before shipping any feature that touches user data:

- [ ] RLS policy covers the new table/column (never rely on UI-only checks)
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` exposed to client-side code
- [ ] PII is not logged (console.log, Vercel logs, error messages)
- [ ] Email content does not expose other users' data
- [ ] File uploads validated (type, size) before storage
- [ ] New env variables documented in `.env.example` and `ENVIRONMENT_REFERENCE.md`
- [ ] Consent flow exists if collecting new personal data categories

---

*Last updated: 2026-02-24 · Maintainer: Michael Wittinger*
