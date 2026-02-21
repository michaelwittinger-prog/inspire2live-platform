import type { PostgrestError } from '@supabase/supabase-js'

export type WorkspaceQueryIssue = {
  scope: string
  message: string
  code?: string
  hint?: string
}

export type WorkspaceEvent = {
  id: string
  year: number | null
  /** UI-safe title (never empty) */
  title: string
  /** Raw status string from DB (may differ by schema version) */
  status: string | null
}

function issue(scope: string, err: PostgrestError | null): WorkspaceQueryIssue | null {
  if (!err) return null
  return {
    scope,
    message: err.message,
    code: err.code ?? undefined,
    hint: (err as unknown as { hint?: string }).hint,
  }
}

/**
 * Fetch the latest congress event in a schema-tolerant way.
 *
 * Why this exists:
 * - Some environments can have an older congress_events schema (e.g. with `theme` not `title`).
 * - Selecting missing columns causes PostgREST errors.
 * - Workspace pages must not silently fall back to DEMO event IDs (non-UUID) because they break uuid FKs.
 */
export async function fetchLatestWorkspaceEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<{ event: WorkspaceEvent | null; issues: WorkspaceQueryIssue[] }> {
  const issues: WorkspaceQueryIssue[] = []

  // Important: select('*') avoids schema drift issues (missing columns)
  const { data, error } = await supabase
    .from('congress_events')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)

  const maybeIssue = issue('congress_events.select_latest', error)
  if (maybeIssue) issues.push(maybeIssue)

  const row = data?.[0]
  if (!row) {
    if (!error) {
      issues.push({
        scope: 'congress_events.empty',
        message: 'No congress_events rows found. Create at least one current event.',
      })
    }
    return { event: null, issues }
  }

  const year = typeof row.year === 'number' ? row.year : null
  const title: string =
    (typeof row.title === 'string' && row.title.trim())
      ? row.title.trim()
      : (typeof row.theme === 'string' && row.theme.trim())
        ? `Inspire2Live Congress ${year ?? ''}`.trim()
        : `Inspire2Live Congress ${year ?? ''}`.trim()

  const event: WorkspaceEvent = {
    id: String(row.id),
    year,
    title,
    status: row.status ? String(row.status) : null,
  }

  return { event, issues }
}
