import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Regression guard:
 * Prevent reintroducing "bootstrap" logic that mutates profiles.role at request-time
 * based on a hardcoded email allowlist.
 */
describe('regression: no request-time bootstrap admin promotion', () => {
  it('AppLayout must not contain hardcoded admin email allowlists or role promotion', () => {
    const filePath = join(process.cwd(), 'src/app/app/layout.tsx')
    const content = readFileSync(filePath, 'utf8')

    expect(content).not.toMatch(/ADMIN_EMAILS/)
    expect(content).not.toMatch(/Auto-promote bootstrap admin/i)
    expect(content).not.toMatch(/\bbootstrap admin\b/i)
    expect(content).not.toMatch(/update\(\{\s*role:\s*'PlatformAdmin'\s*\}\)/)
  })
})
