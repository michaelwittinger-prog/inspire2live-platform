# Congress — Production Readiness (Vercel + Supabase)

If the Congress / Congress Workspace UI looks “partially deployed” in production, it is usually not a Vercel routing issue.
The routes are compiled as part of the Next.js build; the most common root cause is **missing Supabase schema / seed data**.

## Required tables (Supabase)

Congress pages query the following tables:

- `congress_events`
- `congress_assignments`
- `congress_decisions`
- `congress_topics`
- `congress_sessions`

The Congress Workspace (overview) in particular requires:

- At least **one** row in `congress_events` (the “current” congress)
- `congress_assignments` rows for the current event + the logged-in user

If the DB returns no rows, the UI falls back to demo data and will show a banner:
**“Setup needed in production”**.

## Minimal production verification checklist

1) **Vercel deploy**
   - Vercel project tracks branch: `main`
   - Latest production deployment commit matches GitHub `main`

2) **Vercel environment variables** (Project → Settings → Environment Variables)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
   - `NEXT_PUBLIC_APP_URL`
   - `CRON_SECRET`

3) **Supabase migrations**
   - Apply migrations to the production Supabase project
   - Verify tables exist and RLS policies permit intended reads

4) **Seed baseline data**
   - Create at least one `congress_events` row
   - Create `congress_assignments` rows for key users

## Useful diagnostic URLs

After login:

- `/app/congress`
- `/app/congress/workspace` (redirects to overview)
- `/app/congress/workspace/overview`
