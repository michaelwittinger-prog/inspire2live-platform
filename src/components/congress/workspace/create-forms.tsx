'use client'

/**
 * Congress workspace — create-forms.tsx
 *
 * All "add new item" form components used across workspace tabs.
 * Each form calls the corresponding server action via HTML form action.
 * Uses a simple inline-expand pattern: no additional dependencies.
 */
import { useState, useTransition } from 'react'
import {
  createWorkstream,
  createTask,
  createMessage,
  createMilestone,
  createRaidItem,
} from '@/app/app/congress/workspace/actions'

// ─── Shared UI ───────────────────────────────────────────────────────────────

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-neutral-700">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-orange-400 focus:outline-none'
const selectCls = 'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-orange-400 focus:outline-none'

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100"
    >
      + {label}
    </button>
  )
}

function FormPanel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        <button type="button" onClick={onClose} className="text-xs text-neutral-500 hover:text-neutral-700">✕ Cancel</button>
      </div>
      {children}
    </div>
  )
}

function SubmitBtn({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
    >
      {pending ? 'Saving…' : label}
    </button>
  )
}

// ─── Error display ────────────────────────────────────────────────────────────

function ErrorMsg({ msg }: { msg: string | null }) {
  if (!msg) return null
  return <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{msg}</p>
}

// ─── 1. Workstream Create Form ────────────────────────────────────────────────

export function WorkstreamCreateForm({
  congressId,
  workstreamRoles,
}: {
  congressId: string
  workstreamRoles?: string[]
}) {
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const roles = workstreamRoles ?? [
    'Congress Lead', 'Scientific Lead', 'Ops Lead', 'Sponsor Lead',
    'Comms Lead', 'Finance', 'Compliance Reviewer', 'Contributor',
  ]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createWorkstream(fd)
        setOpen(false)
      } catch (ex: unknown) {
        setErr(ex instanceof Error ? ex.message : 'Unknown error')
      }
    })
  }

  if (!open) return <AddButton label="Add workstream" onClick={() => setOpen(true)} />

  return (
    <FormPanel title="New workstream" onClose={() => setOpen(false)}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="hidden" name="congress_id" value={congressId} />

        <FormRow label="Title *">
          <input name="title" required placeholder="e.g. Programme & Agenda" className={inputCls} />
        </FormRow>

        <FormRow label="Description">
          <input name="description" placeholder="Short description…" className={inputCls} />
        </FormRow>

        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Congress role owner">
            <select name="owner_role" className={selectCls}>
              <option value="">None</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </FormRow>

          <FormRow label="Health">
            <select name="health" className={selectCls}>
              <option value="on_track">On track</option>
              <option value="at_risk">At risk</option>
              <option value="blocked">Blocked</option>
            </select>
          </FormRow>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Progress %">
            <input name="progress_pct" type="number" min={0} max={100} defaultValue={0} className={inputCls} />
          </FormRow>
          <FormRow label="Next milestone">
            <input name="next_milestone" placeholder="Short label…" className={inputCls} />
          </FormRow>
        </div>

        <ErrorMsg msg={err} />
        <SubmitBtn pending={pending} label="Save workstream" />
      </form>
    </FormPanel>
  )
}

// ─── 2. Task Create Form ──────────────────────────────────────────────────────

type Workstream = { id: string; title: string }

export function TaskCreateForm({
  congressId,
  workstreams,
}: {
  congressId: string
  workstreams: Workstream[]
}) {
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createTask(fd)
        setOpen(false)
      } catch (ex: unknown) {
        setErr(ex instanceof Error ? ex.message : 'Unknown error')
      }
    })
  }

  if (!open) return <AddButton label="New task" onClick={() => setOpen(true)} />

  return (
    <FormPanel title="New task" onClose={() => setOpen(false)}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="hidden" name="congress_id" value={congressId} />

        <FormRow label="Title *">
          <input name="title" required placeholder="What needs to happen?" className={inputCls} />
        </FormRow>

        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Status">
            <select name="status" className={selectCls}>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </FormRow>
          <FormRow label="Priority">
            <select name="priority" className={selectCls}>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
              <option value="low">Low</option>
            </select>
          </FormRow>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Lane">
            <select name="lane" className={selectCls}>
              <option value="now">Now</option>
              <option value="next">Next</option>
              <option value="later">Later</option>
            </select>
          </FormRow>
          <FormRow label="Due date">
            <input name="due_date" type="date" className={inputCls} />
          </FormRow>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Owner">
            <input name="owner_name" placeholder="Name or role" className={inputCls} />
          </FormRow>
          <FormRow label="Workstream">
            <select name="workstream_id" className={selectCls}>
              <option value="">None</option>
              {workstreams.map(ws => <option key={ws.id} value={ws.id}>{ws.title}</option>)}
            </select>
          </FormRow>
        </div>

        <ErrorMsg msg={err} />
        <SubmitBtn pending={pending} label="Save task" />
      </form>
    </FormPanel>
  )
}

// ─── 3. Message Create Form ───────────────────────────────────────────────────

export function MessageCreateForm({ congressId }: { congressId: string }) {
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createMessage(fd)
        setOpen(false)
      } catch (ex: unknown) {
        setErr(ex instanceof Error ? ex.message : 'Unknown error')
      }
    })
  }

  if (!open) return <AddButton label="Post update" onClick={() => setOpen(true)} />

  return (
    <FormPanel title="Post congress update" onClose={() => setOpen(false)}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="hidden" name="congress_id" value={congressId} />

        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Type">
            <select name="thread_type" className={selectCls}>
              <option value="update">Update</option>
              <option value="action_required">Action Required</option>
              <option value="decision">Decision</option>
              <option value="fyi">FYI</option>
            </select>
          </FormRow>
          <FormRow label="Your name (displayed)">
            <input name="author_name" placeholder="Your name" className={inputCls} />
          </FormRow>
        </div>

        <FormRow label="Subject *">
          <input name="subject" required placeholder="Message subject…" className={inputCls} />
        </FormRow>

        <FormRow label="Body *">
          <textarea name="body" required rows={3} placeholder="Write your update…" className={inputCls} />
        </FormRow>

        <FormRow label="Labels (comma-separated)">
          <input name="labels" placeholder="e.g. ops, venue" className={inputCls} />
        </FormRow>

        <ErrorMsg msg={err} />
        <SubmitBtn pending={pending} label="Post update" />
      </form>
    </FormPanel>
  )
}

// ─── 4. Milestone Create Form ─────────────────────────────────────────────────

export function MilestoneCreateForm({
  congressId,
  workstreams,
}: {
  congressId: string
  workstreams: Workstream[]
}) {
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createMilestone(fd)
        setOpen(false)
      } catch (ex: unknown) {
        setErr(ex instanceof Error ? ex.message : 'Unknown error')
      }
    })
  }

  if (!open) return <AddButton label="Add milestone" onClick={() => setOpen(true)} />

  return (
    <FormPanel title="New milestone" onClose={() => setOpen(false)}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="hidden" name="congress_id" value={congressId} />

        <FormRow label="Title *">
          <input name="title" required placeholder="Milestone title" className={inputCls} />
        </FormRow>

        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Date *">
            <input name="milestone_date" type="date" required className={inputCls} />
          </FormRow>
          <FormRow label="Status">
            <select name="status" className={selectCls}>
              <option value="upcoming">Upcoming</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </FormRow>
        </div>

        <FormRow label="Workstream (optional)">
          <select name="workstream_id" className={selectCls}>
            <option value="">None</option>
            {workstreams.map(ws => <option key={ws.id} value={ws.id}>{ws.title}</option>)}
          </select>
        </FormRow>

        <ErrorMsg msg={err} />
        <SubmitBtn pending={pending} label="Save milestone" />
      </form>
    </FormPanel>
  )
}

// ─── 5. RAID Item Create Form ─────────────────────────────────────────────────

export function RaidCreateForm({ congressId }: { congressId: string }) {
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createRaidItem(fd)
        setOpen(false)
      } catch (ex: unknown) {
        setErr(ex instanceof Error ? ex.message : 'Unknown error')
      }
    })
  }

  if (!open) return <AddButton label="Add RAID item" onClick={() => setOpen(true)} />

  return (
    <FormPanel title="New RAID item" onClose={() => setOpen(false)}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="hidden" name="congress_id" value={congressId} />

        <FormRow label="Title *">
          <input name="title" required placeholder="Short description of the risk/issue/etc." className={inputCls} />
        </FormRow>

        <div className="grid grid-cols-3 gap-3">
          <FormRow label="Type">
            <select name="type" className={selectCls}>
              <option value="risk">Risk</option>
              <option value="assumption">Assumption</option>
              <option value="issue">Issue</option>
              <option value="decision">Decision</option>
            </select>
          </FormRow>
          <FormRow label="Priority">
            <select name="priority" className={selectCls}>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="low">Low</option>
            </select>
          </FormRow>
          <FormRow label="Status">
            <select name="status" className={selectCls}>
              <option value="open">Open</option>
              <option value="mitigating">Mitigating</option>
              <option value="resolved">Resolved</option>
            </select>
          </FormRow>
        </div>

        <FormRow label="Owner role">
          <input name="owner_role" placeholder="e.g. Ops Lead, Congress Lead…" className={inputCls} />
        </FormRow>

        <FormRow label="Description">
          <textarea name="description" rows={2} placeholder="More details…" className={inputCls} />
        </FormRow>

        <ErrorMsg msg={err} />
        <SubmitBtn pending={pending} label="Save RAID item" />
      </form>
    </FormPanel>
  )
}
