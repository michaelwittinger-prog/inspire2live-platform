# Environment Variable Reference — Inspire2Live Platform

> **Purpose:** Every environment variable explained — what it does, what breaks without it, where to get it.  
> **Audience:** Developers, DevOps, anyone configuring a new environment.  
> **Last reviewed:** 2026-02-24

---

## Quick Setup

1. Copy `.env.example` to `.env.local`
2. Fill in values following the table below
3. Never commit `.env.local` to source control

---

## Variable Reference

### Supabase (Required)

| Variable | Scope | Required | Default | Description |
|----------|-------|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | ✅ | — | Supabase project URL. Get from: Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | ✅ | — | Supabase anonymous/public key. Safe to expose — scoped by RLS. Get from: same page as URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | ✅ | — | Bypasses RLS — **never expose to browser**. Used for admin server actions. Get from: same page, under "service_role" |

**If missing:** App cannot connect to database. All pages will fail with connection errors.

### Email (Required for notifications)

| Variable | Scope | Required | Default | Description |
|----------|-------|----------|---------|-------------|
| `RESEND_API_KEY` | Server only | ✅ | — | API key for transactional email via Resend. Get from: https://resend.com/api-keys |

**If missing:** Invitation emails and notification emails will silently fail. Auth magic links still work (sent by Supabase directly).

### Application

| Variable | Scope | Required | Default | Description |
|----------|-------|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | Client + Server | ✅ | — | The canonical URL of the application. **Must be the production Vercel URL for production** (e.g., `https://inspire2live-platform.vercel.app`). For local dev: `http://localhost:3000`. Used for auth redirects, email links, and callback URLs. |
| `NEXT_PUBLIC_APP_NAME` | Client | ❌ | `Inspire2Live Platform` | Display name shown in UI headers and emails |

**If `NEXT_PUBLIC_APP_URL` is wrong:** Auth magic links redirect to wrong domain. Password reset links break. This was the root cause of the localhost redirect bug (see ADR or incident log).

### Scheduled Jobs

| Variable | Scope | Required | Default | Description |
|----------|-------|----------|---------|-------------|
| `CRON_SECRET` | Server only | ❌ | — | Secret token to authenticate cron endpoint calls. Generate with: `openssl rand -base64 32` |

**If missing:** Cron endpoints will reject requests (401). No impact on interactive features.

### Feature Flags

| Variable | Scope | Required | Default | Description |
|----------|-------|----------|---------|-------------|
| `NEXT_PUBLIC_FEATURE_CONGRESS` | Client | ❌ | `false` | Show/hide Congress features in UI |
| `NEXT_PUBLIC_FEATURE_HUBS` | Client | ❌ | `false` | Show/hide Hub Network features |
| `NEXT_PUBLIC_FEATURE_PARTNERS` | Client | ❌ | `false` | Show/hide Partner Portal features |

**If missing:** Features default to hidden. Safe.

---

## Environment-Specific Configuration

### Local Development (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://bvccuypipogprmjxctxp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Inspire2Live Platform (Dev)
```

### Vercel Production

All variables set in: **Vercel → Project → Settings → Environment Variables**

| Variable | Scope in Vercel | Environment |
|----------|----------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Preview + Production | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Preview + Production | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only | Production |
| `RESEND_API_KEY` | Production only | Production |
| `NEXT_PUBLIC_APP_URL` | Production only | Production: `https://inspire2live-platform.vercel.app` |
| `CRON_SECRET` | Production only | Production |
| Feature flags | Preview + Production | Toggle per environment |

---

## External Configuration (Not Env Vars)

These settings live outside the codebase but affect behavior:

| Setting | Location | Must Match |
|---------|----------|------------|
| **Supabase Site URL** | Supabase Dashboard → Auth → URL Configuration | Must equal `NEXT_PUBLIC_APP_URL` |
| **Supabase Redirect URLs** | Same page | Must include `{NEXT_PUBLIC_APP_URL}/auth/callback` |
| **Resend Domain** | Resend Dashboard → Domains | Must match email sender domain |
| **Vercel Domain** | Vercel → Domains | Must match `NEXT_PUBLIC_APP_URL` |

---

## Troubleshooting

| Symptom | Likely Cause |
|---------|-------------|
| "Failed to fetch" on every page | `NEXT_PUBLIC_SUPABASE_URL` or `ANON_KEY` missing/wrong |
| Auth redirects to `localhost` in production | `NEXT_PUBLIC_APP_URL` set to `localhost` OR Supabase Site URL not updated |
| Magic links expire immediately | Supabase Site URL ≠ actual app URL |
| Emails not sending | `RESEND_API_KEY` missing or invalid |
| Build works locally but fails on Vercel | Env var missing in Vercel (check all three scopes: Development, Preview, Production) |

---

*Last updated: 2026-02-24 · Maintainer: Michael Wittinger*
