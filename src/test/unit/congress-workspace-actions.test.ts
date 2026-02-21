/**
 * Congress workspace server actions — unit tests
 *
 * Verifies that each create* action calls the correct Supabase table
 * and sends the right fields. No real DB connection; all calls are mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Shared mock ─────────────────────────────────────────────────────────────

const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockFrom   = vi.fn(() => ({
  insert: mockInsert,
  select: vi.fn(() => ({
    eq:        vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { role: 'PlatformAdmin' }, error: null }) })),
    order:     vi.fn(() => ({ limit: vi.fn().mockResolvedValue({ data: [] }) })),
    in:        vi.fn().mockResolvedValue({ data: [] }),
  })),
}))

const mockSupabase = {
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
  from: mockFrom,
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fd(data: Record<string, string>) {
  const f = new FormData()
  for (const [k, v] of Object.entries(data)) f.set(k, v)
  return f
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Congress workspace server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
  })

  // ── createWorkstream ───────────────────────────────────────────────────────

  describe('createWorkstream', () => {
    it('inserts into congress_workstreams with correct fields', async () => {
      const { createWorkstream } = await import('@/app/app/congress/workspace/actions')
      await createWorkstream(fd({
        congress_id:  'evt-1',
        title:        'Programme & Agenda',
        description:  'Plan the programme',
        owner_role:   'Congress Lead',
        health:       'on_track',
        progress_pct: '20',
        next_milestone: 'Draft agenda',
      }))

      expect(mockFrom).toHaveBeenCalledWith('congress_workstreams')
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        congress_id:    'evt-1',
        title:          'Programme & Agenda',
        health:         'on_track',
        progress_pct:   20,
      }))
    })

    it('throws when title is missing', async () => {
      const { createWorkstream } = await import('@/app/app/congress/workspace/actions')
      await expect(
        createWorkstream(fd({ congress_id: 'evt-1', title: '' }))
      ).rejects.toThrow()
    })
  })

  // ── createTask ─────────────────────────────────────────────────────────────

  describe('createTask', () => {
    it('inserts into congress_tasks with correct fields', async () => {
      const { createTask } = await import('@/app/app/congress/workspace/actions')
      await createTask(fd({
        congress_id: 'evt-1',
        title:       'Confirm venue AV requirements',
        status:      'todo',
        priority:    'high',
        lane:        'now',
        owner_name:  'Ops Lead',
        due_date:    '2026-06-01',
      }))

      expect(mockFrom).toHaveBeenCalledWith('congress_tasks')
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        congress_id: 'evt-1',
        title:       'Confirm venue AV requirements',
        status:      'todo',
        priority:    'high',
        lane:        'now',
        owner_name:  'Ops Lead',
        due_date:    '2026-06-01',
      }))
    })
  })

  // ── createMessage ──────────────────────────────────────────────────────────

  describe('createMessage', () => {
    it('inserts into congress_messages with correct fields', async () => {
      const { createMessage } = await import('@/app/app/congress/workspace/actions')
      await createMessage(fd({
        congress_id:  'evt-1',
        subject:      'Venue confirmed',
        body:         'Hotel has signed off on the main hall.',
        thread_type:  'update',
        author_name:  'Anna Schmidt',
        labels:       'ops, venue',
      }))

      expect(mockFrom).toHaveBeenCalledWith('congress_messages')
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        congress_id:  'evt-1',
        subject:      'Venue confirmed',
        body:         'Hotel has signed off on the main hall.',
        thread_type:  'update',
        author_name:  'Anna Schmidt',
        labels:       ['ops', 'venue'],
      }))
    })

    it('throws when body is missing', async () => {
      const { createMessage } = await import('@/app/app/congress/workspace/actions')
      await expect(
        createMessage(fd({ congress_id: 'evt-1', subject: 'Hello', body: '' }))
      ).rejects.toThrow()
    })
  })

  // ── createMilestone ────────────────────────────────────────────────────────

  describe('createMilestone', () => {
    it('inserts into congress_milestones with correct fields', async () => {
      const { createMilestone } = await import('@/app/app/congress/workspace/actions')
      await createMilestone(fd({
        congress_id:    'evt-1',
        title:          'Programme finalised',
        milestone_date: '2026-08-15',
        status:         'upcoming',
      }))

      expect(mockFrom).toHaveBeenCalledWith('congress_milestones')
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        congress_id:    'evt-1',
        title:          'Programme finalised',
        milestone_date: '2026-08-15',
        status:         'upcoming',
      }))
    })

    it('throws when milestone_date is missing', async () => {
      const { createMilestone } = await import('@/app/app/congress/workspace/actions')
      await expect(
        createMilestone(fd({ congress_id: 'evt-1', title: 'X', milestone_date: '' }))
      ).rejects.toThrow()
    })
  })

  // ── createRaidItem ─────────────────────────────────────────────────────────

  describe('createRaidItem', () => {
    it('inserts into congress_raid_items with correct fields', async () => {
      const { createRaidItem } = await import('@/app/app/congress/workspace/actions')
      await createRaidItem(fd({
        congress_id:  'evt-1',
        title:        'Venue cancellation risk',
        type:         'risk',
        status:       'open',
        priority:     'high',
        owner_role:   'Ops Lead',
        description:  'Hotel may pull out due to booking conflict.',
      }))

      expect(mockFrom).toHaveBeenCalledWith('congress_raid_items')
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        congress_id: 'evt-1',
        title:       'Venue cancellation risk',
        type:        'risk',
        status:      'open',
        priority:    'high',
      }))
    })
  })
})
