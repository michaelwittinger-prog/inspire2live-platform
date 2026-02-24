# Vercel Deployment Setup

## Overview

Deployment happens in **three ways** — all non-interactive after one-time setup:

| Method | Trigger | When to use |
|--------|---------|-------------|
| **Auto via GitHub Actions** | Every push to `main` (after CI passes) | Normal development flow |
| **Manual via GitHub Actions** | Actions tab → "Deploy to Vercel" → Run workflow | Re-deploy without a code change |
| **Local via script** | `pnpm deploy` | Quick local deploy, emergencies |

---

## One-Time Setup

### Step 1 — Vercel CLI authentication (local machine only)

```powershell
pnpm vercel login
# Opens browser → log in → saves token to ~/.vercel/auth.json
```

### Step 2 — Link this directory to your Vercel project

```powershell
pnpm vercel link
# Asks which scope/project → saves .vercel/project.json (gitignored)
```

### Step 3 — Add GitHub Secrets (enables auto-deploy via CI)

Go to: **https://github.com/michaelwittinger-prog/inspire2live-platform/settings/secrets/actions**

Add these three secrets:

| Secret | How to get it |
|--------|---------------|
| `VERCEL_TOKEN` | https://vercel.com/account/tokens → Create token |
| `VERCEL_ORG_ID` | https://vercel.com → project → Settings → General → "Team ID" |
| `VERCEL_PROJECT_ID` | Same page → "Project ID" |

Or run this after `vercel link` and copy from `.vercel/project.json`:
```powershell
Get-Content .vercel/project.json
```

---

## Local Deploy Commands

```powershell
# Full deploy (runs tests → build → deploy)
pnpm deploy

# Deploy skipping tests
./scripts/deploy.ps1 -SkipTests

# Deploy with a token override (no ~/.vercel/auth.json needed)
$env:VERCEL_TOKEN = "tok_xxx"
pnpm deploy
```

---

## Automatic Deploy (GitHub Actions)

The workflow `.github/workflows/deploy-vercel.yml` fires automatically:

1. You push to `main`
2. CI workflow (`ci.yml`) runs: lint → typecheck → build → unit tests
3. When CI **passes**, the deploy workflow triggers automatically
4. Deployed URL appears in the Actions job summary

To **manually trigger** a deploy without pushing code:
- Go to **Actions** → **Deploy to Vercel (Production)** → **Run workflow**

---

## Troubleshooting

### Deploy workflow fails with "Missing required secrets"
→ Follow Step 3 above to add the GitHub secrets.

### `pnpm deploy` fails with "Error: Not authenticated"
→ Run `pnpm vercel login` first.

### `pnpm deploy` fails with "Error: No project found"
→ Run `pnpm vercel link` from the `inspire2live-platform/` directory.

### Vercel build error (different from local)
→ Check the Vercel dashboard logs. Ensure all `NEXT_PUBLIC_*` environment variables are set in the Vercel project settings.

### Invite modal shows: `Could not find the table 'public.invitations' in the schema cache`
This is a **Supabase production schema state** issue (not a Vercel/Docker issue).

Run in Supabase SQL editor (Production):

```sql
-- 1) Verify whether table exists
select to_regclass('public.invitations');

-- 2) If null, apply migration 00025_invitation_system.sql
--    (via your normal migration pipeline)

-- 3) Force PostgREST schema/cache reload
notify pgrst, 'reload schema';
notify pgrst, 'reload config';
```

After that, retry the invite flow.

Required Vercel environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY` (optional — invitation emails)
