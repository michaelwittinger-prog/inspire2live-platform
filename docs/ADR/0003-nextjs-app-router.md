# ADR-0003: Next.js App Router with React Server Components

- **Status:** accepted
- **Date:** 2025-10-15
- **Owners:** Michael Wittinger

## Context

The platform needs a full-stack React framework that supports server-side rendering, API routes, middleware for auth guards, and a modern component model. The framework must work well with Supabase Auth (cookie-based sessions) and Vercel deployment.

- Related requirements: `REQ-TECH-001`, `REQ-TECH-002`, `REQ-UX-001`

## Decision

Use **Next.js 15+ with the App Router** and React Server Components (RSC) as the primary rendering model.

- Pages default to Server Components (zero client JS unless opted in).
- Client components use `'use client'` directive only when interactive state is needed.
- Server Actions handle mutations (no separate API routes for form submissions).
- Middleware (`middleware.ts`) handles auth gate and route protection.

## Alternatives considered

1. **Next.js Pages Router** — Stable but being sunset in favor of App Router. Missing RSC, server actions, and improved data fetching patterns.
2. **Remix** — Strong data loading model but smaller ecosystem. Supabase integration less mature. Vercel deployment possible but not native.
3. **SvelteKit** — Excellent performance but would require the team to learn a new language/framework. Smaller component library ecosystem for enterprise-style UIs.

## Consequences

### Positive
- RSC reduces client bundle size — most pages ship zero JavaScript.
- Server Actions simplify mutations (no boilerplate API routes).
- Middleware provides a single auth checkpoint for all `/app/*` routes.
- Native Vercel integration: zero-config deployment, edge functions, preview deployments.
- Large community and ecosystem for components, tooling, and hiring.

### Negative / trade-offs
- App Router is newer; some libraries lag behind in compatibility.
- RSC mental model requires careful management of server/client boundary.
- Caching behavior can be surprising (need to understand `revalidatePath` semantics).
- Middleware runs at the edge — limited Node.js API availability.

## Rollout / Migration plan

- Adopted from project inception — no migration needed.
- All new pages use App Router conventions (`page.tsx`, `layout.tsx`, `loading.tsx`).
- No Pages Router files exist in the project.

## References

- Next.js App Router docs: https://nextjs.org/docs/app
- Supabase + Next.js guide: https://supabase.com/docs/guides/auth/server-side/nextjs
- Related config: `next.config.ts`, `middleware.ts`
