# Inspire2Live Platform

A Next.js 16 application built with Supabase, Tailwind CSS v4, and deployed on Vercel.

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) 9+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (optional, for local DB)

### 1. Clone & Install

```bash
git clone <repo-url>
cd inspire2live-platform
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### 3. Run the Dev Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Vercel Deployment

### Required Environment Variables in Vercel

Go to your Vercel project → **Settings → Environment Variables** and add:

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret) | ✅ |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL | ✅ |
| `NEXT_PUBLIC_APP_NAME` | Display name of the app | ✅ |
| `RESEND_API_KEY` | Resend API key for emails | ✅ |
| `CRON_SECRET` | Secret for protected cron endpoints | ✅ |
| `NEXT_PUBLIC_FEATURE_CONGRESS` | Enable Congress feature | optional |
| `NEXT_PUBLIC_FEATURE_HUBS` | Enable Hubs feature | optional |
| `NEXT_PUBLIC_FEATURE_PARTNERS` | Enable Partners feature | optional |

> **Important:** `SUPABASE_SERVICE_ROLE_KEY` must be set as a **Server-side only** variable in Vercel — never expose it to the browser.

### Supabase Auth Callback URL

In your Supabase project → **Authentication → URL Configuration**, add:

```
https://<your-vercel-url>/auth/callback
```

Also add your Vercel preview URLs if using preview deployments:
```
https://<your-project>-*.vercel.app/auth/callback
```

### Vercel Project Settings

The repository root contains a `vercel.json` that sets:
- **Root Directory:** `inspire2live-platform`
- **Build Command:** `pnpm build`
- **Install Command:** `pnpm install --frozen-lockfile`

These are applied automatically when you connect the repo to Vercel.

---

## 🧪 Testing

```bash
# Unit tests
pnpm test

# Unit tests with coverage
pnpm test:coverage

# E2E tests (requires a running dev server)
pnpm test:e2e
```

---

## 🛠 Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript type check |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:coverage` | Unit tests with coverage |
| `pnpm test:e2e` | E2E tests (Playwright) |

---

## 🗄 Database

Supabase migrations are in `supabase/migrations/`. To apply them to your cloud project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

To run locally with Docker:

```bash
supabase start
# Then update .env.local with the local keys printed by the CLI
```

---

## 📁 Project Structure

```
inspire2live-platform/
├── src/
│   ├── app/            # Next.js App Router pages & layouts
│   ├── components/     # Reusable UI components
│   ├── lib/            # Business logic, Supabase clients, utilities
│   ├── types/          # TypeScript types (incl. generated DB types)
│   └── test/           # Unit and E2E tests
├── supabase/
│   ├── migrations/     # SQL migration files
│   └── seed*.sql       # Seed data scripts
├── docs/               # Architecture docs, ADRs, roadmap
├── .env.example        # Environment variable template
└── next.config.ts      # Next.js configuration
```
