import { EVENT_STATUS_META, normalizeEventStatus, type CongressEventStatus } from '@/lib/congress'

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const ms = new Date(dateStr).getTime() - Date.now()
  if (Number.isNaN(ms)) return null
  return Math.ceil(ms / 86_400_000)
}

const CTA: Record<CongressEventStatus, { title: string; body: string; tone: 'neutral' | 'info' | 'live' | 'warn' }> = {
  planning: {
    title: 'Planning phase',
    body: 'Set theme, dates, workstreams, and team assignments.',
    tone: 'neutral',
  },
  open_for_topics: {
    title: 'Topics are open',
    body: 'Collect proposals and refine the agenda structure. Promote participation.',
    tone: 'info',
  },
  agenda_set: {
    title: 'Agenda set',
    body: 'Confirm sessions, speakers, and comms. Prepare live-ops readiness.',
    tone: 'info',
  },
  live: {
    title: 'Congress is live',
    body: 'Capture decisions in real time. Log incidents in Live Ops. Keep RAID current.',
    tone: 'live',
  },
  post_congress: {
    title: 'Post-congress conversion',
    body: 'Convert decisions into tasks and follow-up actions. Close the loop on outcomes.',
    tone: 'warn',
  },
  archived: {
    title: 'Archived',
    body: 'Outcomes are recorded. Use this workspace as the reference archive.',
    tone: 'neutral',
  },
}

function toneClasses(tone: 'neutral' | 'info' | 'live' | 'warn'): string {
  switch (tone) {
    case 'live':
      return 'border-green-200 bg-green-50 text-green-900'
    case 'warn':
      return 'border-amber-200 bg-amber-50 text-amber-900'
    case 'info':
      return 'border-blue-200 bg-blue-50 text-blue-900'
    default:
      return 'border-neutral-200 bg-neutral-50 text-neutral-900'
  }
}

export function StageBanner({
  status,
  startDate,
}: {
  status: unknown
  startDate?: string | null
}) {
  const s = normalizeEventStatus(status)
  const meta = EVENT_STATUS_META[s]
  const cta = CTA[s]
  const d = daysUntil(startDate)

  return (
    <div className={`rounded-xl border px-4 py-3 ${toneClasses(cta.tone)}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${meta.badge}`}>
              {meta.label}
            </span>
            <p className="text-sm font-semibold leading-tight">{cta.title}</p>
          </div>
          <p className="mt-1 text-xs text-neutral-600">{cta.body}</p>
        </div>

        {d !== null && (
          <div className="shrink-0 text-right">
            <p className="text-xs font-semibold text-neutral-800">
              {d > 0 ? `${d} day${d === 1 ? '' : 's'} to start` : d === 0 ? 'Starts today' : `${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'} since start`}
            </p>
            <p className="text-[10px] text-neutral-500">based on event start_date</p>
          </div>
        )}
      </div>
    </div>
  )
}
