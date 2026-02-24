# ADR-0002: Supabase as Backend-as-a-Service

- **Status:** accepted
- **Date:** 2025-10-15
- **Owners:** Michael Wittinger

## Context

The Inspire2Live Platform needs a backend providing authentication, a relational database, file storage, and row-level security — without the overhead of managing dedicated infrastructure. The team is small (1–2 developers), the budget is limited, and time-to-market matters more than architectural flexibility.

- Related requirements: `REQ-TECH-001`, `REQ-SEC-001`, `REQ-SEC-003`

## Decision

Use **Supabase** (hosted PostgreSQL + Auth + Storage + Realtime) as the sole backend service.

- Authentication: Supabase Auth with magic link + password flows.
- Database: PostgreSQL with Row-Level Security (RLS) policies enforcing access at the DB layer.
- Storage: Supabase Storage for avatars and evidence files with bucket-level RLS.
- API: Auto-generated PostgREST + `supabase-js` client library (no custom REST API needed).

## Alternatives considered

1. **Firebase (Firestore + Auth)** — NoSQL data model is a poor fit for the relational nature of initiatives, tasks, milestones, and membership. No native RLS equivalent.
2. **Custom Node.js API + managed PostgreSQL** — Full control but significantly higher development and maintenance overhead. Premature for MVP.
3. **Prisma + PlanetScale** — Strong ORM tooling but no built-in auth, storage, or RLS. Would require assembling multiple services.

## Consequences

### Positive
- Single vendor for auth + DB + storage reduces integration complexity.
- RLS enforces security at the database level — not just in application code.
- Free tier is sufficient for MVP; scaling path is clear (Pro plan).
- Sequential migration system (`supabase/migrations/`) provides schema version control.
- EU data residency available (AWS eu-central-1).

### Negative / trade-offs
- Vendor lock-in: switching from Supabase requires rewriting auth integration and RLS policies.
- Limited query flexibility compared to custom API (must work within PostgREST conventions).
- Local development requires running Supabase CLI or pointing at remote project.
- RLS policies can become complex as the permission model grows (mitigated by `ROLE_PERMISSION_MODEL.md` documentation).

## Rollout / Migration plan

- Phase 0: Supabase project created, initial schema (migration 00001), RLS policies (00002).
- Ongoing: All schema changes via numbered migrations in `supabase/migrations/`.
- If migration to another provider is ever needed: export PostgreSQL dump + reimplement auth layer.

## References

- PR: Initial platform setup
- Supabase documentation: https://supabase.com/docs
- Related docs: `docs/SUPABASE_SMTP_SETUP.md`, `docs/ENVIRONMENT_REFERENCE.md`
