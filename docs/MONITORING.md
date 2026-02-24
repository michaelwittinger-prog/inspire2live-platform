# Monitoring & Observability Guide — Inspire2Live Platform

> **Purpose:** Where to look when something is wrong, what to monitor, and how to set up alerting.  
> **Audience:** Developers, platform administrators.  
> **Last reviewed:** 2026-02-24

---

## 1 · Observability Stack

| Layer | Tool | What It Monitors | Access |
|-------|------|------------------|--------|
| **Frontend / Edge** | Vercel Analytics | Request volume, response times, error rates, Web Vitals | Vercel Dashboard |
| **Server Functions** | Vercel Logs | Server-side console output, errors, cold starts | Vercel → Logs tab |
| **Database** | Supabase Dashboard | Query performance, connection pool, storage usage | Supabase → Database |
| **Auth** | Supabase Auth Logs | Login attempts, magic link sends, failed auths | Supabase → Auth → Logs |
| **Email** | Resend Dashboard | Email delivery, bounces, complaints | resend.com dashboard |
| **Uptime** | Health check endpoint | Application liveness | `/api/version` |
| **CI/CD** | GitHub Actions | Build success/failure, test results | GitHub → Actions tab |

---

## 2 · Health Check Endpoint

The platform exposes a lightweight health check at:

```
GET /api/version
```

**Response (healthy):**
```json
{
  "version": "0.1.0",
  "status": "ok",
  "timestamp": "2026-02-24T12:00:00.000Z"
}
```

**Use this for:**
- External uptime monitors (e.g., UptimeRobot, Better Stack, Vercel Checks)
- Load balancer health checks
- Smoke test after deployment

### Recommended uptime monitoring setup

1. Create a free account at [UptimeRobot](https://uptimerobot.com) or [Better Stack](https://betterstack.com).
2. Add monitor: `https://inspire2live-platform.vercel.app/api/version`
3. Check interval: 5 minutes.
4. Alert via email to project lead.

---

## 3 · Vercel Monitoring

### 3.1 Accessing Logs

1. Go to: https://vercel.com → inspire2live-platform → Deployments → [latest]
2. Click **Functions** tab to see server-side function logs.
3. Click **Runtime Logs** for real-time streaming.

### 3.2 Key Metrics to Watch

| Metric | Healthy Range | Alert If |
|--------|---------------|----------|
| Edge response time (p50) | < 200ms | > 1000ms |
| Server function duration (p50) | < 500ms | > 3000ms |
| Error rate | < 1% | > 5% |
| Cold start frequency | Occasional | Every request (indicates config issue) |
| Build time | < 90s | > 300s |

### 3.3 Vercel Alerting

Vercel Pro/Enterprise plans support deployment failure notifications:
- **Deployment failed** → email notification (auto-configured)
- **Domain issues** → email notification (auto-configured)

For the free/hobby tier, rely on GitHub Actions CI status + uptime monitor.

---

## 4 · Supabase Monitoring

### 4.1 Database Dashboard

Access: https://supabase.com/dashboard/project/bvccuypipogprmjxctxp

Key sections:
- **Database → Query Performance:** Slow query log (queries > 1s).
- **Database → Database Size:** Storage consumption.
- **Database → Connections:** Active connection count vs. pool limit.

### 4.2 Key Metrics to Watch

| Metric | Healthy Range | Alert If |
|--------|---------------|----------|
| Active connections | < 50% of pool | > 80% of pool |
| Database size | < 80% of plan limit | > 90% of plan |
| Slow queries (> 1s) | 0 | > 5 per hour |
| Auth failures | < 5% of attempts | > 20% (brute force?) |
| Storage usage | < 80% of plan | > 90% of plan |

### 4.3 Supabase Alerts

Supabase Pro plans include built-in alerting. For the free tier:
- Check dashboard weekly.
- Set a calendar reminder for monthly capacity review.

---

## 5 · Application-Level Logging

### 5.1 Logging Conventions

```typescript
// ✅ Good — structured, no PII
console.error('[invitations] createInvitation failed:', { scope, initiativeId, error: err.message })

// ❌ Bad — PII in logs
console.error('Failed for user:', userEmail, 'with data:', fullPayload)
```

### 5.2 Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `console.error` | Unexpected failures, caught exceptions | DB write failure, auth error |
| `console.warn` | Degraded behavior, fallbacks activated | Missing env var, using default |
| `console.info` | Significant operations (sparingly) | Migration applied, cron job ran |
| `console.log` | Dev-only debugging | **Remove before commit** |

### 5.3 PII in Logs — Policy

**Never log:**
- Email addresses
- User names
- Full request/response bodies containing user data
- JWT tokens or API keys

**Safe to log:**
- User IDs (UUIDs)
- Role names
- Resource IDs
- Error messages (without user data)
- Request paths and status codes

---

## 6 · Error Tracking (Future)

Currently, errors are captured via:
- Vercel server logs (auto-captured `console.error`)
- Client-side error boundaries (`src/components/ui/error-boundary.tsx`)

### Recommended future additions (Phase 2+)

| Tool | Purpose | Priority |
|------|---------|----------|
| **Sentry** | Real-time error tracking with stack traces, source maps | High |
| **Vercel Web Analytics** | Core Web Vitals, page-level performance | Medium |
| **PostHog** or **Plausible** | Privacy-friendly usage analytics | Medium |
| **PgHero** (self-hosted) or Supabase Observability | Deep PostgreSQL monitoring | Low |

---

## 7 · Alerts Checklist

Minimum viable alerting for production:

- [ ] **Uptime monitor** on `/api/version` — alert on 2 consecutive failures
- [ ] **GitHub Actions** — notification on CI failure (auto via GitHub)
- [ ] **Vercel** — deployment failure email (auto)
- [ ] **Weekly manual check:** Supabase dashboard (connections, storage, slow queries)
- [ ] **Monthly review:** Dependency audit (`pnpm audit`), Vercel usage/limits

---

## 8 · Runbook Quick Reference

| Symptom | Where to Look | Likely Cause |
|---------|---------------|-------------|
| "502 Bad Gateway" | Vercel Logs → Functions | Server action crash, unhandled exception |
| "Auth redirect loop" | Supabase Auth Logs + `middleware.ts` | Token expiry, wrong Site URL config |
| "Slow page loads" | Supabase → Query Performance | Missing index, N+1 query |
| "Emails not arriving" | Resend Dashboard → Logs | SPF/DKIM misconfigured, Resend quota hit |
| "RLS violation" error | Supabase → Logs | Missing or incorrect RLS policy |
| Build fails in CI | GitHub Actions → ci.yml logs | TypeScript error, missing dependency |
| "Database connection refused" | Supabase Dashboard → Connections | Pool exhausted, Supabase maintenance |

---

*Last updated: 2026-02-24 · Maintainer: Michael Wittinger*
