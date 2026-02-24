# Changelog

All notable changes to the Inspire2Live Platform are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Invitation system for initiatives and congress (invite by email or platform user)
- Notification system with in-app notification feed
- Password reset flow with dedicated `/reset-password` page
- Auth redirect URL helper with production/localhost detection (`auth-redirect-url.ts`)
- `notifications_type_check` constraint expansion for `initiative_invite` and `congress_invite`
- Unit test suite for auth redirect URL logic
- Documentation overhaul: 8 new docs + 4 populated ADRs + docs index

### Fixed
- Auth magic links redirecting to `localhost` in production (Supabase Site URL + code fix)
- `notifications_type_check` constraint violation when sending initiative invitations

---

## [0.1.0] — 2025-12-01

### Added
- **Platform foundation:** Next.js 16 + React 19 + Tailwind CSS 4 + TypeScript strict
- **Authentication:** Supabase Auth with magic link and password flows
- **Database:** PostgreSQL with 26 sequential migrations and full RLS
- **Role system:** 8 platform roles with 4-tier permission resolution
- **Initiatives:** Create, manage, assign tasks, track milestones, upload evidence
- **Congress lifecycle:** Planning → active → post-event → archived with workspace
- **Congress workspace:** Workstreams, RAID log, tasks, approvals, communications, timeline
- **Patient stories:** Create, review, publish workflow with public story pages
- **Admin panel:** User management, permission overrides, role default configuration
- **Bureau dashboard:** RAG health overview across all initiatives
- **Board dashboard:** Governance metrics and drill-down
- **Profile system:** Onboarding wizard, profile editor, avatar upload
- **Navigation:** Role-aware side nav and top nav
- **CI/CD:** GitHub Actions (lint, typecheck, build, unit tests, E2E) + Vercel auto-deploy
- **Testing:** 16+ unit test files (Vitest), 2 E2E smoke tests (Playwright)

### Infrastructure
- Supabase project (PostgreSQL + Auth + Storage)
- Vercel hosting with auto-deploy on push to `main`
- Resend for transactional email
- GitHub Actions CI pipeline (3 parallel jobs)

---

*Maintainer: Michael Wittinger*
