/**
 * Congress workspace server actions — unit tests
 *
 * Verifies that each create* action calls the correct Supabase table
 * and sends the right fields. No real DB connection; all calls are mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Shared mock ─────────────────────────────────────────────────────────────

const mockInsertMaybeSingle = vi.fn().mockResolvedValue({ data: { id: 'row-1' }, error: null })
const mockInsertSelect      = vi.fn(() => ({ maybeSingle: mockInsertMaybeSingle }))
const mockInsert            = vi.fn(() => ({ select: mockInsertSelect }))

const mockEq     = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn(() => ({ eq: mockEq }))

const mockFrom = vi.fn()

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

function buildTableClient(table: string) {
  // Special case: activity log insert is best-effort and does not use select().
  if (table === 'congress_activity_log') {
    return {
      insert: vi.fn().mockResolvedValue({ error: null }),
    }
  }

  // Profiles query used by requireCoordinator():
  // from('profiles').select('role').eq('id', ...).maybeSingle()
  if (table === 'profiles') {
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { role: 'PlatformAdmin' }, error: null }),
        })),
      })),
    }
  }

  // Everything else (workspace operational tables)
  return {
    insert: mockInsert,
    update: mockUpdate,
  }
}

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
    mockFrom.mockImplementation((table: string) => buildTableClient(table))

    mockInsertMaybeSingle.mockResolvedValue({ data: { id: 'row-1' }, error: null })
    mockEq.mockResolvedValue({ error: null })
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

  // ── createLiveOpsUpdate ───────────────────────────────────────────────────

  describe('createLiveOpsUpdate', () => {
    it('inserts into congress_live_ops_updates with correct fields', async () => {
      const { createLiveOpsUpdate } = await import('@/app/app/congress/workspace/actions')
      await createLiveOpsUpdate(fd({
        congress_id: 'evt-1',
        title: 'Registration outage',
        description: 'Some users see 500s',
        status: 'open',
        severity: 'sev1',
      }))

      expect(mockFrom).toHaveBeenCalledWith('congress_live_ops_updates')
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        congress_id: 'evt-1',
        title: 'Registration outage',
        status: 'open',
        severity: 'sev1',
      }))
    })
  })

  // ── createFollowUpAction ──────────────────────────────────────────────────

  describe('createFollowUpAction', () => {
    it('inserts into congress_follow_up_actions with correct fields', async () => {
      const { createFollowUpAction } = await import('@/app/app/congress/workspace/actions')
      await createFollowUpAction(fd({
        congress_id: 'evt-1',
        title: 'Publish decisions report',
        description: 'Summary to website',
        status: 'todo',
        priority: 'high',
        owner_name: 'Sophie',
        due_date: '2026-12-01',
      }))

      expect(mockFrom).toHaveBeenCalledWith('congress_follow_up_actions')
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        congress_id: 'evt-1',
        title: 'Publish decisions report',
        status: 'todo',
        priority: 'high',
        owner_name: 'Sophie',
        due_date: '2026-12-01',
      }))
    })
  })

  // ── createApprovalRequest ─────────────────────────────────────────────────

  describe('createApprovalRequest', () => {
    it('inserts into congress_approval_requests with correct fields', async () => {
      const { createApprovalRequest } = await import('@/app/app/congress/workspace/actions')
      await createApprovalRequest(fd({
        congress_id: 'evt-1',
        title: 'Approve agenda v1',
        description: 'Ready to publish',
        requested_by_name: 'Peter',
      }))

      expect(mockFrom).toHaveBeenCalledWith('congress_approval_requests')
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        congress_id: 'evt-1',
        title: 'Approve agenda v1',
        requested_by_name: 'Peter',
        status: 'submitted',
      }))
    })
  })

  // ── Status updates ────────────────────────────────────────────────────────

  describe('updateTaskStatus', () => {
    it('updates congress_tasks status by id', async () => {
      const { updateTaskStatus } = await import('@/app/app/congress/workspace/actions')
      await updateTaskStatus(fd({
        congress_id: 'evt-1',
        task_id: 'task-1',
        status: 'done',
      }))

      expect(mockFrom).toHaveBeenCalledWith('congress_tasks')
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'done' })
      expect(mockEq).toHaveBeenCalledWith('id', 'task-1')
    })
  })

  describe('updateRaidItemStatus', () => {
    it('updates congress_raid_items status by id', async () => {
      const { updateRaidItemStatus } = await import('@/app/app/congress/workspace/actions')
      await updateRaidItemStatus(fd({
        congress_id: 'evt-1',
        raid_id: 'raid-1',
        status: 'resolved',
      }))

      expect(mockFrom).toHaveBeenCalledWith('congress_raid_items')
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'resolved' })
      expect(mockEq).toHaveBeenCalledWith('id', 'raid-1')
    })
  })

  describe('updateApprovalStatus', () => {
    it('updates congress_approval_requests status by id', async () => {
      const { updateApprovalStatus } = await import('@/app/app/congress/workspace/actions')
      await updateApprovalStatus(fd({
        congress_id: 'evt-1',
        approval_id: 'appr-1',
        status: 'approved',
      }))

      expect(mockFrom).toHaveBeenCalledWith('congress_approval_requests')
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'approved' })
      expect(mockEq).toHaveBeenCalledWith('id', 'appr-1')
    })
  })

  describe('updateLiveOpsStatus', () => {
    it('updates congress_live_ops_updates status by id', async () => {
      const { updateLiveOpsStatus } = await import('@/app/app/congress/workspace/actions')
      await updateLiveOpsStatus(fd({
        congress_id: 'evt-1',
        incident_id: 'inc-1',
        status: 'resolved',
      }))

      expect(mockFrom).toHaveBeenCalledWith('congress_live_ops_updates')
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'resolved' }))
      expect(mockEq).toHaveBeenCalledWith('id', 'inc-1')
    })
  })
})
