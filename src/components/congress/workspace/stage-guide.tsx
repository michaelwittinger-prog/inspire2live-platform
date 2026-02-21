import Link from 'next/link'
import { EVENT_STATUS_META, normalizeEventStatus, type CongressEventStatus } from '@/lib/congress'

export type StageGuideSection =
  | 'overview'
  | 'workstreams'
  | 'timeline'
  | 'tasks'
  | 'raid'
  | 'approvals'
  | 'live-ops'
  | 'follow-up'
  | 'team'
  | 'communications'

type Guide = {
  headline: string
  bullets: string[]
  cta?: { label: string; href: string }
}

const GUIDE: Record<StageGuideSection, Record<CongressEventStatus, Guide>> = {
  overview: {
    planning: {
      headline: 'Set the foundation for the congress execution cycle.',
      bullets: [
        'Confirm workstreams and owners (Ops, Comms, Programme, Compliance…).',
        'Create the first milestone plan (CFP dates, agenda drafts, runbook sign-off).',
        'Start a backlog of tasks split into Now / Next / Later.',
      ],
      cta: { label: 'Go to Workstreams', href: '/app/congress/workspace/workstreams' },
    },
    open_for_topics: {
      headline: 'Run the “call for topics” phase: intake, triage, and communication.',
      bullets: [
        'Track topic intake tasks and assign reviewers.',
        'Timebox the submission window (open/close milestones).',
        'Send regular status updates to the team and community.',
      ],
      cta: { label: 'Go to Communications', href: '/app/congress/workspace/communications' },
    },
    agenda_set: {
      headline: 'Lock the agenda and operational readiness.',
      bullets: [
        'Turn agenda items into tasks with owners and due dates.',
        'Capture risks/issues early (venue, speakers, compliance).',
        'Create approvals for publish/go-live decisions.',
      ],
      cta: { label: 'Go to Tasks', href: '/app/congress/workspace/tasks' },
    },
    live: {
      headline: 'Day-of execution: triage fast, communicate clearly, log incidents.',
      bullets: [
        'Keep the “Now” lane clean and owned; close tasks as you go.',
        'Use Live Ops for incident tracking and escalation.',
        'Record key decisions/approvals in near real-time.',
      ],
      cta: { label: 'Go to Live Ops', href: '/app/congress/workspace/live-ops' },
    },
    post_congress: {
      headline: 'Convert outcomes into accountable follow-ups.',
      bullets: [
        'Create follow-up actions with owners and due dates.',
        'Close remaining tasks and resolved RAID items.',
        'Publish a decisions + outcomes summary update.',
      ],
      cta: { label: 'Go to Follow-up', href: '/app/congress/workspace/follow-up' },
    },
    archived: {
      headline: 'Read-only reference: preserve the execution record.',
      bullets: [
        'Review final decisions, RAID log, and completed tasks.',
        'Use this workspace as a template for the next congress.',
      ],
      cta: { label: 'Go to Approvals', href: '/app/congress/workspace/approvals' },
    },
  },

  workstreams: {
    planning: {
      headline: 'Define workstreams and assign accountable owners.',
      bullets: [
        'Create the core workstreams (Programme & Agenda, Operations & Logistics, Comms & Community, Compliance & Neutrality).',
        'Assign an owner role and a first “next milestone” for each workstream (e.g. “Agenda draft v0.1”, “Venue runbook outline”).',
        'Use health + progress to surface where attention is needed early.',
      ],
    },
    open_for_topics: {
      headline: 'Organize topic intake and review workstreams.',
      bullets: [
        'Ensure Programme & Comms workstreams are staffed (reviewers, campaign owner) and reporting health.',
        'Set next milestones such as “Topic call campaign launch” and “Reviewer triage complete”.',
        'Keep Operations/Compliance visible: intake volume impacts logistics and review policy.',
      ],
    },
    agenda_set: {
      headline: 'Shift focus to agenda finalization and logistics readiness.',
      bullets: [
        'Track agenda drafts, speaker confirmations, sponsor neutrality review, and venue runbook readiness.',
        'Escalate blocked workstreams early and convert them into tasks + RAID items.',
        'Use “next milestone” to show the current checkpoint (e.g. “Final agenda published”).',
      ],
    },
    live: {
      headline: 'Use workstreams as the “command structure” during the event.',
      bullets: ['Keep progress/health current so leadership sees real-time state.', 'Use next milestone as the next operational checkpoint.'],
    },
    post_congress: {
      headline: 'Close out workstreams and capture learnings.',
      bullets: ['Mark final status and capture remaining commitments as follow-ups.', 'Ensure Compliance/Finance workstreams are concluded.'],
    },
    archived: {
      headline: 'Archive view of execution workstreams.',
      bullets: ['Use health/progress history as reference for future congress planning.'],
    },
  },

  timeline: {
    planning: {
      headline: 'Create the high-level milestone plan.',
      bullets: ['Add key dates: topic call, agenda drafts, runbook sign-off, congress days.', 'Link milestones to the responsible workstream where possible.'],
    },
    open_for_topics: {
      headline: 'Keep the topic call deadlines visible and non-negotiable.',
      bullets: ['Track open/close dates and review checkpoints.', 'Use milestones to enforce decision windows.'],
    },
    agenda_set: {
      headline: 'Drive toward final agenda and operational readiness.',
      bullets: ['Add speaker confirmation deadlines and publishing milestones.', 'Ensure all critical operational milestones exist (venue, AV, catering, travel).'],
    },
    live: {
      headline: 'Use timeline as the “today / tomorrow” operational clock.',
      bullets: ['Ensure congress-day milestones are present (Day 1, Day 2, decision conversion).'],
    },
    post_congress: {
      headline: 'Set post-congress reporting deadlines.',
      bullets: ['Add deadlines for summary report, decisions conversion, and follow-up check-ins.'],
    },
    archived: {
      headline: 'Historical milestone trail.',
      bullets: ['Use as reference for scheduling the next cycle.'],
    },
  },

  tasks: {
    planning: {
      headline: 'Build the execution backlog.',
      bullets: [
        'Capture the first real tasks (e.g. “Confirm venue contract addendum”, “Draft agenda v0.1”, “Set reviewer pool”).',
        'Assign owners and due dates for every critical-path item.',
        'Use Now/Next/Later lanes to structure what is actionable this week.',
      ],
    },
    open_for_topics: {
      headline: 'Run intake + review tasks.',
      bullets: [
        'Track reviewer assignments, triage deadlines, and response SLAs.',
        'Create tasks for communications cadence (weekly updates, reminders, closing date push).',
        'Use “Action Required” communications when inputs are missing or reviewers are blocked.',
      ],
    },
    agenda_set: {
      headline: 'Convert agenda and logistics into executable tasks.',
      bullets: [
        'Keep “Now” lane focused on the critical path (agenda lock, speakers, runbook sign-off).',
        'Turn every open RAID item into a mitigation task with an owner.',
        'Use approvals for publish/go-live gates (agenda versions, sponsor pack, compliance sign-off).',
      ],
    },
    live: {
      headline: 'Triage the “Now” lane during the event.',
      bullets: ['Close tasks quickly and keep owners explicit.', 'Escalate incidents to Live Ops when needed.'],
      cta: { label: 'Open Live Ops', href: '/app/congress/workspace/live-ops' },
    },
    post_congress: {
      headline: 'Close remaining tasks and convert outcomes to follow-ups.',
      bullets: ['Move remaining open items into Follow-up where appropriate.', 'Ensure decisions have accountable owners and due dates.'],
    },
    archived: {
      headline: 'Completed task record.',
      bullets: ['Use this as audit + learning input.'],
    },
  },

  raid: {
    planning: {
      headline: 'Identify early risks and assumptions.',
      bullets: ['Log high-risk unknowns (venue, budget, speakers, compliance).', 'Assign an owner role to each open item.'],
    },
    open_for_topics: {
      headline: 'Capture review and community risks.',
      bullets: ['Log capacity risks (reviewer bandwidth, topic quality).', 'Track assumptions about keynote/speakers and confirmations.'],
    },
    agenda_set: {
      headline: 'Log operational and agenda risks.',
      bullets: ['Venue/logistics risks should be explicit and tracked to mitigation tasks.', 'Use Decisions/Approvals for go/no-go calls.'],
    },
    live: {
      headline: 'Use RAID to avoid repeat incidents.',
      bullets: ['Promote serious items to Live Ops updates when they become incidents.', 'Resolve quickly and document mitigations.'],
    },
    post_congress: {
      headline: 'Close or convert open items into follow-up actions.',
      bullets: ['Ensure the RAID log is resolved or explicitly accepted.'],
    },
    archived: {
      headline: 'Historical risk register.',
      bullets: ['Reference for next congress risk planning.'],
    },
  },

  approvals: {
    planning: {
      headline: 'Prepare upcoming decision points.',
      bullets: ['Capture planned approvals (budget, programme direction, compliance sign-offs).'],
    },
    open_for_topics: {
      headline: 'Decide fast on scope and messaging.',
      bullets: ['Use approvals for campaign/publication decisions.', 'Keep decision records short and explicit.'],
    },
    agenda_set: {
      headline: 'Publish / lock decisions before going live.',
      bullets: ['Approve agenda versions and operational runbook readiness.', 'Record stakeholder sign-offs.'],
    },
    live: {
      headline: 'Capture urgent decisions.',
      bullets: ['Use approvals for urgent calls during the event.', 'Keep timestamps accurate.'],
    },
    post_congress: {
      headline: 'Finalize approvals and close loops.',
      bullets: ['Ensure any outstanding approvals are resolved or rejected.', 'Convert resulting actions into follow-up items.'],
    },
    archived: {
      headline: 'Final decision log.',
      bullets: ['Reference decisions for outcomes tracking.'],
    },
  },

  'live-ops': {
    planning: {
      headline: 'Live Ops is typically quiet before the event.',
      bullets: ['Use RAID for pre-event risks; reserve Live Ops for real incidents.'],
    },
    open_for_topics: {
      headline: 'Only use Live Ops for real incidents affecting delivery.',
      bullets: ['Otherwise capture items in RAID and Tasks.'],
    },
    agenda_set: {
      headline: 'Prepare incident playbooks and escalation paths.',
      bullets: ['Confirm owners and severity meanings.', 'Ensure comms templates exist (SEV updates).'],
    },
    live: {
      headline: 'Log incidents and keep status current.',
      bullets: ['Use severity consistently (SEV1–SEV3).', 'Resolve incidents with clear closure notes.'],
    },
    post_congress: {
      headline: 'Close remaining incidents and capture learnings.',
      bullets: ['Make sure all incidents are resolved and documented.'],
    },
    archived: {
      headline: 'Incident record.',
      bullets: ['Reference for future runbooks.'],
    },
  },

  'follow-up': {
    planning: {
      headline: 'Follow-up is usually minimal before the event.',
      bullets: ['Use Tasks for execution work; Follow-up is for commitments and outcomes.'],
    },
    open_for_topics: {
      headline: 'Reserve follow-up for durable commitments.',
      bullets: ['Keep day-to-day work in Tasks; use Follow-up for longer-term commitments.'],
    },
    agenda_set: {
      headline: 'Start capturing post-event commitments early.',
      bullets: ['If decisions create long-term actions, place them here with owners and due dates.'],
    },
    live: {
      headline: 'Capture commitments created during the event.',
      bullets: ['Log follow-ups from sessions and approvals as they happen.'],
    },
    post_congress: {
      headline: 'This is the primary area post-congress.',
      bullets: ['Convert decisions into accountable actions.', 'Track owners, due dates, and priorities.'],
    },
    archived: {
      headline: 'Outcome commitments archive.',
      bullets: ['Use for long-term tracking and reporting.'],
    },
  },

  team: {
    planning: {
      headline: 'Ensure the right people are assigned before execution starts.',
      bullets: ['Assign Congress roles (Ops Lead, Comms Lead, Scientific Lead…).', 'Confirm the “command structure” is clear.'],
      cta: { label: 'User Management', href: '/app/admin/users' },
    },
    open_for_topics: {
      headline: 'Staff reviewers and comms owners.',
      bullets: ['Ensure Scientific/Programme reviewers are assigned and available.', 'Confirm Comms ownership for campaign cadence.'],
    },
    agenda_set: {
      headline: 'Lock staffing for execution.',
      bullets: ['Confirm ops and programme leads; identify backup coverage.', 'Validate responsibilities are aligned to workstreams.'],
    },
    live: {
      headline: 'Live execution staffing.',
      bullets: ['Confirm on-site roles, escalation owner, and comms owner are present.'],
    },
    post_congress: {
      headline: 'Assign owners for follow-up commitments.',
      bullets: ['Make sure follow-up actions have owners and due dates.'],
    },
    archived: {
      headline: 'Team roster archive.',
      bullets: ['Reference roles for reporting and acknowledgements.'],
    },
  },

  communications: {
    planning: {
      headline: 'Set the internal cadence and announcement plan.',
      bullets: ['Post a kickoff update and define weekly cadence.', 'Use “Action Required” when inputs are missing.'],
    },
    open_for_topics: {
      headline: 'Run the topic-call campaign and stakeholder updates.',
      bullets: ['Use the email feed for formal updates.', 'Use chat for fast coordination between owners.'],
    },
    agenda_set: {
      headline: 'Coordinate agenda publication and readiness comms.',
      bullets: ['Post approval outcomes and publish milestones.', 'Keep chat focused on execution coordination.'],
    },
    live: {
      headline: 'Fast coordination + clear incident comms.',
      bullets: ['Use chat for rapid coordination.', 'Use the feed for official updates and decisions.'],
    },
    post_congress: {
      headline: 'Publish summary + keep follow-ups visible.',
      bullets: ['Post a decisions/outcomes summary.', 'Use chat for coordination on post-event tasks.'],
    },
    archived: {
      headline: 'Communication record.',
      bullets: ['Reference for reporting and audit.'],
    },
  },
}

export function StageGuide({
  status,
  section,
}: {
  status: unknown | null | undefined
  section: StageGuideSection
}) {
  if (!status) return null
  const normalized = normalizeEventStatus(status)
  const meta = EVENT_STATUS_META[normalized]
  const guide = GUIDE[section][normalized]

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.badge}`}>
              Stage: {meta.label}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              What to do in this tab
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-neutral-900">{guide.headline}</p>
          <ul className="mt-2 space-y-1">
            {guide.bullets.map((b, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-neutral-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        {guide.cta && (
          <Link
            href={guide.cta.href}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50"
          >
            {guide.cta.label} →
          </Link>
        )}
      </div>
    </div>
  )
}
