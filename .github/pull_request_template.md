## Summary

Describe what this PR changes.

## Requirement Mapping

- Implements: `REQ-...`
- Related: `REQ-...`

## ADR / Deviation

- ADR: `ADR-...` (if applicable)
- Deviation from benchmark design doc: yes/no
- If yes, explain briefly:

## Validation

- [ ] Type check passes (`pnpm build`)
- [ ] Tests pass (`pnpm test`)
- [ ] Permissions/RLS impact reviewed
- [ ] Accessibility impact reviewed
- [ ] Traceability matrix updated (`docs/TRACEABILITY.md`)

## Database changes (complete if any migration was added)

- [ ] Migration file added to `supabase/migrations/`
- [ ] Migration applied to **production** Supabase (SQL Editor)
- [ ] `NOTIFY pgrst, 'reload schema';` executed after DDL changes
- [ ] `src/types/database.ts` updated (no `as any` casts for new tables)
- [ ] All new Supabase queries use `{ data, error }` destructuring — `error` is checked
- [ ] `error.tsx` added next to any new page that queries the DB
- [ ] RLS policy role strings match raw DB `role` values exactly (not TypeScript-normalized values)

## Screenshots / Evidence (if UI)

Attach screenshots or short notes.
