/**
 * Congress lifecycle business logic and shared types.
 * Used across all /app/congress/* pages.
 */

// ─── Status helpers ───────────────────────────────────────────────────────────

export type CongressEventStatus =
  | 'planning'
  | 'open_for_topics'
  | 'agenda_set'
  | 'live'
  | 'post_congress'
  | 'archived'

export type ConversionStatus = 'pending' | 'converted' | 'needs_clarification' | 'declined'
export type TopicStatus      = 'submitted' | 'approved' | 'rejected' | 'discussing' | 'resolved'
export type SessionType      = 'plenary' | 'workshop' | 'panel' | 'working_group' | 'keynote' | 'break'

export interface CongressEvent {
  id: string
  year: number
  title: string
  description: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
  theme_headline: string | null
  status: CongressEventStatus
  parent_event_id: string | null
  created_at: string
  themes?: CongressTheme[]
  decision_count?: number | null
  converted_count?: number | null
}

export interface CongressTheme {
  id: string
  title: string
  description: string | null
  color: string
  first_year: number
}

export interface CongressTopic {
  id: string
  title: string
  description: string | null
  status: TopicStatus
  vote_count: number
  event_id: string | null
  theme_id: string | null
  carryover_from_topic_id: string | null
  submitted_by: string
  submitter_name?: string | null
  initiative_title?: string | null
  created_at: string
}

export interface CongressSession {
  id: string
  event_id: string
  title: string
  description: string | null
  session_type: SessionType
  agenda_order: number
  start_time: string | null
  end_time: string | null
  room: string | null
  status: string
  session_lead_id: string | null
  session_lead_name?: string | null
  note_taker_id: string | null
  topic_id: string | null
  decision_count?: number | null
}

export interface CongressDecision {
  id: string
  title: string
  body: string | null
  description: string | null
  event_id: string | null
  congress_year: number | null
  session_id: string | null
  initiative_id: string | null
  initiative_title?: string | null
  owner_id: string | null
  owner_name?: string | null
  deadline: string | null
  conversion_status: ConversionStatus
  converted_task_id: string | null
  captured_at: string
  carryover_to_event_id: string | null
  /** Hours since capture */
  hours_since_capture?: number
  /** Hours remaining until 48h SLA breach (negative = overdue) */
  sla_hours_remaining?: number
}

// ─── Phase metadata ───────────────────────────────────────────────────────────

export const EVENT_STATUS_META: Record<CongressEventStatus, {
  label: string
  badge: string
  phase: 'pre' | 'live' | 'post' | 'archived'
  description: string
}> = {
  planning:         { label: 'Planning',          badge: 'bg-neutral-100 text-neutral-600', phase: 'pre',      description: 'Event is being planned — not yet open for topics' },
  open_for_topics:  { label: 'Open for Topics',   badge: 'bg-blue-100 text-blue-700',      phase: 'pre',      description: 'Topic proposals are open for community submission' },
  agenda_set:       { label: 'Agenda Set',         badge: 'bg-violet-100 text-violet-700',  phase: 'pre',      description: 'Agenda is finalised — sessions and speakers confirmed' },
  live:             { label: 'Live',               badge: 'bg-green-100 text-green-700',    phase: 'live',     description: 'Congress is in progress' },
  post_congress:    { label: 'Post-Congress',      badge: 'bg-orange-100 text-orange-700',  phase: 'post',     description: 'Congress has ended — decisions converting to tasks' },
  archived:         { label: 'Archived',           badge: 'bg-neutral-200 text-neutral-500', phase: 'archived', description: 'Archived — all outcomes recorded' },
}

export const SESSION_TYPE_META: Record<SessionType, { label: string; color: string; icon: string }> = {
  plenary:       { label: 'Plenary',       color: 'bg-orange-100 text-orange-700',  icon: '🎤' },
  keynote:       { label: 'Keynote',       color: 'bg-amber-100 text-amber-700',    icon: '⭐' },
  workshop:      { label: 'Workshop',      color: 'bg-blue-100 text-blue-700',      icon: '🔧' },
  panel:         { label: 'Panel',         color: 'bg-violet-100 text-violet-700',  icon: '💬' },
  working_group: { label: 'Working Group', color: 'bg-emerald-100 text-emerald-700',icon: '👥' },
  break:         { label: 'Break',         color: 'bg-neutral-100 text-neutral-500',icon: '☕' },
}

export const CONVERSION_STATUS_META: Record<ConversionStatus, {
  label: string
  badge: string
  icon: string
}> = {
  pending:            { label: 'Pending conversion',   badge: 'bg-orange-100 text-orange-700', icon: '⏳' },
  converted:          { label: 'Converted to task',    badge: 'bg-green-100 text-green-700',   icon: '✅' },
  needs_clarification:{ label: 'Needs clarification',  badge: 'bg-yellow-100 text-yellow-700', icon: '❓' },
  declined:           { label: 'Declined',             badge: 'bg-neutral-200 text-neutral-500',icon: '✗' },
}

// ─── SLA helpers ──────────────────────────────────────────────────────────────

/** Compute hours elapsed since a decision was captured */
export function hoursElapsed(capturedAt: string): number {
  return (Date.now() - new Date(capturedAt).getTime()) / 3_600_000
}

/** Hours remaining in the 48h SLA window (negative = overdue) */
export function slaHoursRemaining(capturedAt: string): number {
  return 48 - hoursElapsed(capturedAt)
}

/** Classify SLA state of a pending decision */
export function slaBadge(decision: CongressDecision): {
  label: string
  badge: string
  urgent: boolean
} {
  if (decision.conversion_status !== 'pending') {
    const m = CONVERSION_STATUS_META[decision.conversion_status]
    return { label: m.label, badge: m.badge, urgent: false }
  }
  const remaining = slaHoursRemaining(decision.captured_at)
  if (remaining < 0)  return { label: `${Math.abs(Math.round(remaining))}h overdue`,  badge: 'bg-red-100 text-red-700',     urgent: true }
  if (remaining < 12) return { label: `${Math.round(remaining)}h remaining`,           badge: 'bg-orange-100 text-orange-700', urgent: true }
  return { label: `${Math.round(remaining)}h remaining`,                               badge: 'bg-yellow-100 text-yellow-700', urgent: false }
}

/** Enriches decisions with computed SLA fields */
export function enrichDecisions(decisions: CongressDecision[]): CongressDecision[] {
  return decisions.map(d => ({
    ...d,
    hours_since_capture:  hoursElapsed(d.captured_at),
    sla_hours_remaining:  slaHoursRemaining(d.captured_at),
  }))
}

// ─── Decision stats ───────────────────────────────────────────────────────────

export interface DecisionStats {
  total: number
  pending: number
  converted: number
  needs_clarification: number
  declined: number
  overdue: number
  conversion_rate_pct: number
}

export function computeDecisionStats(decisions: CongressDecision[]): DecisionStats {
  const total        = decisions.length
  const pending      = decisions.filter(d => d.conversion_status === 'pending').length
  const converted    = decisions.filter(d => d.conversion_status === 'converted').length
  const needs_clar   = decisions.filter(d => d.conversion_status === 'needs_clarification').length
  const declined     = decisions.filter(d => d.conversion_status === 'declined').length
  const overdue      = decisions.filter(d =>
    d.conversion_status === 'pending' && hoursElapsed(d.captured_at) > 48
  ).length
  const conversion_rate_pct = total > 0 ? Math.round((converted / total) * 100) : 0
  return { total, pending, converted, needs_clarification: needs_clar, declined, overdue, conversion_rate_pct }
}

// ─── Topic voting helpers ─────────────────────────────────────────────────────

export const TOPIC_STATUS_META: Record<TopicStatus, { label: string; badge: string }> = {
  submitted:   { label: 'Submitted',   badge: 'bg-blue-100 text-blue-700' },
  approved:    { label: 'Approved',    badge: 'bg-green-100 text-green-700' },
  rejected:    { label: 'Rejected',    badge: 'bg-red-100 text-red-700' },
  discussing:  { label: 'Discussing',  badge: 'bg-violet-100 text-violet-700' },
  resolved:    { label: 'Resolved',    badge: 'bg-neutral-200 text-neutral-500' },
}

// ─── Runtime-safe coercion helpers ───────────────────────────────────────────

/**
 * Normalize unknown DB values into a safe CongressEventStatus.
 * Prevents runtime crashes like EVENT_STATUS_META[status].badge when status is unexpected.
 */
export function normalizeEventStatus(input: unknown): CongressEventStatus {
  switch (String(input)) {
    case 'planning':
    case 'open_for_topics':
    case 'agenda_set':
    case 'live':
    case 'post_congress':
    case 'archived':
      return input as CongressEventStatus
    default:
      return 'planning'
  }
}

export function normalizeTopicStatus(input: unknown): TopicStatus {
  switch (String(input)) {
    case 'submitted':
    case 'approved':
    case 'rejected':
    case 'discussing':
    case 'resolved':
      return input as TopicStatus
    default:
      return 'submitted'
  }
}

export function normalizeConversionStatus(input: unknown): ConversionStatus {
  switch (String(input)) {
    case 'pending':
    case 'converted':
    case 'needs_clarification':
    case 'declined':
      return input as ConversionStatus
    default:
      return 'pending'
  }
}

export function normalizeSessionType(input: unknown): SessionType {
  switch (String(input)) {
    case 'plenary':
    case 'workshop':
    case 'panel':
    case 'working_group':
    case 'keynote':
    case 'break':
      return input as SessionType
    default:
      return 'plenary'
  }
}

// ─── Date formatting helpers ──────────────────────────────────────────────────

export function formatEventDates(start: string | null, end: string | null): string {
  if (!start) return 'Date TBC'
  const s = new Date(start)
  const e = end ? new Date(end) : null
  const day   = (d: Date) => d.getDate()
  const month = (d: Date) => d.toLocaleDateString('en-GB', { month: 'long' })
  const year  = (d: Date) => d.getFullYear()
  if (!e || s.toDateString() === e.toDateString())
    return `${day(s)} ${month(s)} ${year(s)}`
  if (s.getMonth() === e.getMonth())
    return `${day(s)}–${day(e)} ${month(s)} ${year(s)}`
  return `${day(s)} ${month(s)} – ${day(e)} ${month(e)} ${year(e)}`
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}

/** The phase of the congress program cycle relative to today */
export type ProgramPhase = 'months_out' | 'pre_open' | 'topics_open' | 'agenda_building' | 'imminent' | 'live' | 'post' | 'archived'

export function getProgramPhase(event: CongressEvent): ProgramPhase {
  const status = event.status
  if (status === 'archived')      return 'archived'
  if (status === 'live')          return 'live'
  if (status === 'post_congress') return 'post'
  if (!event.start_date)          return 'months_out'
  const days = daysUntil(event.start_date) ?? 999
  if (days > 180)                 return 'months_out'
  if (days > 90)                  return 'pre_open'
  if (status === 'open_for_topics') return days > 30 ? 'topics_open' : 'agenda_building'
  if (status === 'agenda_set')    return days <= 14 ? 'imminent' : 'agenda_building'
  return 'months_out'
}
