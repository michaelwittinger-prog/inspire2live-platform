/**
 * Static guard: Congress workspace pages must NOT import hard-coded demo data
 * for operational content (tasks, workstreams, RAID, KPIs, etc.).
 *
 * Fails deterministically — no network or DB required.
 * Pattern: read each file's source and reject banned import identifiers.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

// ─── Files under guard ──────────────────────────────────────────────────────

const WORKSPACE_ROOT = path.resolve(
  __dirname,
  '../../app/app/congress/workspace',
)

function pageFile(sub: string) {
  return path.join(WORKSPACE_ROOT, sub, 'page.tsx')
}

/**
 * These files must NOT contain operational DEMO_ imports.
 * Each entry: [filepath, description, ...banned_patterns]
 */
const GUARDS: Array<{
  file: string
  label: string
  banned: RegExp[]
}> = [
  {
    file: pageFile('overview'),
    label: 'overview',
    banned: [
      /DEMO_CONGRESS_EVENTS/,
      /DEMO_TASKS_WORKSPACE/,
      /DEMO_WORKSTREAMS/,
      /DEMO_RAID/,
      /DEMO_KPIS/,
      /DEMO_ACTIVITY/,
      /DEMO_DEP_ALERTS/,
      /DEMO_INCIDENTS/,
      /congress-workspace-demo/,
    ],
  },
  {
    file: pageFile('communications'),
    label: 'communications',
    banned: [
      /DEMO_CONGRESS_EVENTS/,
      /DEMO_EMAIL_THREADS/,
      /DEMO_TEAM_CHAT/,
      /DEMO_ACTIVITY/,
      /congress-workspace-demo/,
    ],
  },
  {
    file: pageFile('team'),
    label: 'team',
    banned: [
      /DEMO_CONGRESS_EVENTS/,
      /DEMO_CONGRESS_ASSIGNMENTS/,
      /DEMO_PROFILES/,
    ],
  },
  {
    file: pageFile('workstreams'),
    label: 'workstreams',
    banned: [
      /DEMO_CONGRESS_EVENTS/,
      /congress-workspace-demo/,
    ],
  },
  {
    file: pageFile('tasks'),
    label: 'tasks',
    banned: [
      /DEMO_CONGRESS_EVENTS/,
      /congress-workspace-demo/,
    ],
  },
  {
    file: pageFile('raid'),
    label: 'raid',
    banned: [
      /DEMO_CONGRESS_EVENTS/,
      /congress-workspace-demo/,
    ],
  },
  {
    file: pageFile('timeline'),
    label: 'timeline',
    banned: [
      /DEMO_CONGRESS_EVENTS/,
      /congress-workspace-demo/,
    ],
  },
]

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Congress workspace pages — no hard-coded demo data', () => {
  for (const guard of GUARDS) {
    describe(`workspace/${guard.label}/page.tsx`, () => {
      it('file exists', () => {
        expect(
          fs.existsSync(guard.file),
          `Expected file to exist: ${guard.file}`,
        ).toBe(true)
      })

      const src = fs.existsSync(guard.file)
        ? fs.readFileSync(guard.file, 'utf8')
        : ''

      for (const pattern of guard.banned) {
        it(`does not contain banned pattern: ${pattern}`, () => {
          expect(
            pattern.test(src),
            `Found banned pattern ${pattern} in ${guard.label}/page.tsx — remove hard-coded demo data and replace with a Supabase query`,
          ).toBe(false)
        })
      }
    })
  }
})
