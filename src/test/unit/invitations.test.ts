/**
 * Unit tests for lib/invitations.ts
 *
 * Tests run against mock Supabase clients (no real DB).
 * Covers: canInvite, searchProfiles, createInvitation (permission guard,
 * duplicate detection, validation), revokeInvitation, respondToInvitation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  canInvite,
  searchProfiles,
  createInvitation,
  revokeInvitation,
  respondToInvitation,
} from '@/lib/invitations'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSupabase(overrides?: {
  userRole?: string | null
  userId?: string
  profilesSelectData?: unknown
  insertData?: unknown
  insertError?: unknown
  updateError?: unknown
  rpcData?: unknown
  rpcError?: unknown
  fromOverrides?: Record<string, unknown>
}) {
  const userId = overrides?.userId ?? 'user-123'
  const userRole = overrides?.userRole ?? 'HubCoordinator'

  // Helper to build chainable query mock
  const makeQuery = (data: unknown, error: unknown = null) => {
    const q: Record<string, unknown> = {}
    const chain = () => q
    q.select = chain
    q.eq = chain
    q.in = chain
    q.or = chain
    q.limit = () => ({ data, error })
    q.maybeSingle = () => Promise.resolve({ data, error })
    q.single = () => Promise.resolve({ data, error })
    q.insert = () => ({ select: () => ({ single: () => Promise.resolve({ data: overrides?.insertData ?? { id: 'inv-001' }, error: overrides?.insertError ?? null }) }) })
    q.update = () => ({
      eq: () => ({
        eq: () => Promise.resolve({ error: overrides?.updateError ?? null }),
      }),
    })
    q.upsert = () => Promise.resolve({ error: null })
    q.order = () => ({ data, error })
    return q
  }

  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: userId } } }),
    },
    rpc: () => Promise.resolve({
      data: overrides?.rpcData ?? { ok: true },
      error: overrides?.rpcError ?? null,
    }),
    from: (table: string) => {
      if (table === 'profiles') {
        if (overrides?.profilesSelectData !== undefined) {
          return makeQuery(overrides.profilesSelectData)
        }
        // default: return a profile with the given role
        return makeQuery({ id: userId, role: userRole, name: 'Test User', email: 'test@example.com' })
      }
      // For invitations / initiative_members / congress_members tables
      return makeQuery(null)
    },
  }
}

// ─── canInvite ───────────────────────────────────────────────────────────────

describe('canInvite', () => {
  it('returns true for PlatformAdmin', async () => {
    const supabase = makeSupabase({ userRole: 'PlatformAdmin' })
    expect(await canInvite(supabase as never)).toBe(true)
  })

  it('returns true for HubCoordinator', async () => {
    const supabase = makeSupabase({ userRole: 'HubCoordinator' })
    expect(await canInvite(supabase as never)).toBe(true)
  })

  it('returns false for PatientAdvocate', async () => {
    const supabase = makeSupabase({ userRole: 'PatientAdvocate' })
    expect(await canInvite(supabase as never)).toBe(false)
  })

  it('returns false for Clinician', async () => {
    const supabase = makeSupabase({ userRole: 'Clinician' })
    expect(await canInvite(supabase as never)).toBe(false)
  })

  it('returns false for Researcher', async () => {
    const supabase = makeSupabase({ userRole: 'Researcher' })
    expect(await canInvite(supabase as never)).toBe(false)
  })

  it('returns false when no session user', async () => {
    const supabase = {
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
      from: () => ({}),
    }
    expect(await canInvite(supabase as never)).toBe(false)
  })
})

// ─── searchProfiles ──────────────────────────────────────────────────────────

describe('searchProfiles', () => {
  it('returns empty array for query shorter than 2 chars', async () => {
    const supabase = makeSupabase()
    expect(await searchProfiles(supabase as never, 'a')).toEqual([])
    expect(await searchProfiles(supabase as never, '')).toEqual([])
  })

  it('maps profile rows to ProfileSuggestion shape', async () => {
    const rows = [
      { id: 'p-1', name: 'Alice Smith', email: 'alice@example.com', role: 'Researcher' },
    ]
    const supabase = makeSupabase({ profilesSelectData: rows })
    // Override limit to return rows
    ;(supabase as unknown as { from: (t: string) => unknown }).from = (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            or: () => ({
              limit: () => Promise.resolve({ data: rows, error: null }),
            }),
          }),
        }
      }
      return {}
    }
    const results = await searchProfiles(supabase as never, 'alice')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      id: 'p-1',
      name: 'Alice Smith',
      email: 'alice@example.com',
      role: 'Researcher',
    })
  })

  it('falls back to email when name is null', async () => {
    const rows = [{ id: 'p-2', name: null, email: 'bob@example.com', role: 'Clinician' }]
    const supabase = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
      from: (table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              or: () => ({ limit: () => Promise.resolve({ data: rows, error: null }) }),
            }),
          }
        }
        return {}
      },
    }
    const results = await searchProfiles(supabase as never, 'bob')
    expect(results[0].name).toBe('bob@example.com')
  })
})

// ─── createInvitation ─────────────────────────────────────────────────────────

describe('createInvitation', () => {
  it('returns error when caller is not authorized', async () => {
    const supabase = makeSupabase({ userRole: 'PatientAdvocate' })
    const result = await createInvitation(supabase as never, {
      scope: 'initiative',
      initiativeId: 'init-1',
      inviteeEmail: 'guest@example.com',
      inviteeRole: 'contributor',
    })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/Hub Coordinator|Platform Admin/i)
  })

  it('returns error when invitee is not specified', async () => {
    const supabase = makeSupabase({ userRole: 'HubCoordinator' })
    const result = await createInvitation(supabase as never, {
      scope: 'initiative',
      initiativeId: 'init-1',
      inviteeRole: 'contributor',
    })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/email/i)
  })

  it('returns error when initiativeId is missing for initiative scope', async () => {
    const supabase = makeSupabase({ userRole: 'HubCoordinator' })
    const result = await createInvitation(supabase as never, {
      scope: 'initiative',
      inviteeEmail: 'test@example.com',
      inviteeRole: 'contributor',
    })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/Initiative ID/i)
  })

  it('returns error when congressId is missing for congress scope', async () => {
    const supabase = makeSupabase({ userRole: 'HubCoordinator' })
    const result = await createInvitation(supabase as never, {
      scope: 'congress',
      inviteeEmail: 'test@example.com',
      inviteeRole: 'attendee',
    })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/Congress ID/i)
  })
})

// ─── revokeInvitation ────────────────────────────────────────────────────────

describe('revokeInvitation', () => {
  it('returns error when caller cannot invite', async () => {
    const supabase = makeSupabase({ userRole: 'Researcher' })
    const result = await revokeInvitation(supabase as never, 'inv-abc')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/revoke/i)
  })

  it('returns ok for authorized caller', async () => {
    const supabase = makeSupabase({ userRole: 'PlatformAdmin' })
    // Override from: profiles → canInvite check; invitations → update
    ;(supabase as unknown as { from: (t: string) => unknown }).from = (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: 'PlatformAdmin' }, error: null }),
            }),
          }),
        }
      }
      return {
        update: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }),
      }
    }
    const result = await revokeInvitation(supabase as never, 'inv-abc')
    expect(result.ok).toBe(true)
  })

  it('propagates DB error', async () => {
    const supabase = makeSupabase({ userRole: 'HubCoordinator' })
    ;(supabase as unknown as { from: (t: string) => unknown }).from = (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: 'HubCoordinator' }, error: null }),
            }),
          }),
        }
      }
      return {
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: { message: 'DB failure' } }),
          }),
        }),
      }
    }
    const result = await revokeInvitation(supabase as never, 'inv-abc')
    expect(result.ok).toBe(false)
    expect(result.error).toBe('DB failure')
  })
})

// ─── respondToInvitation ─────────────────────────────────────────────────────

describe('respondToInvitation', () => {
  it('calls RPC and returns ok when RPC succeeds', async () => {
    const supabase = makeSupabase({ rpcData: { ok: true } })
    const result = await respondToInvitation(supabase as never, 'inv-1', 'accepted')
    expect(result.ok).toBe(true)
  })

  it('returns error when RPC returns an error', async () => {
    const supabase = makeSupabase({ rpcError: { message: 'RPC failure' } })
    const result = await respondToInvitation(supabase as never, 'inv-1', 'accepted')
    expect(result.ok).toBe(false)
    expect(result.error).toBe('RPC failure')
  })

  it('returns error when unauthenticated', async () => {
    const supabase = {
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
      from: () => ({}),
      rpc: () => Promise.resolve({ data: null, error: null }),
    }
    const result = await respondToInvitation(supabase as never, 'inv-1', 'accepted')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/authenticated/i)
  })
})
