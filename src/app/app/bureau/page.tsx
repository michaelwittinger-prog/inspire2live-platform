import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

// Local aggregate RAG derivation (per-initiative, not per-item)
function deriveInitiativeRAG(opts: {
  overdueMilestones: number
  blockedTasks: number
  daysSinceActivity: number
}): 'green' | 'amber' | 'red' {
  if (opts.overdueMilestones > 0 || opts.blockedTasks > 0) return 'red'
  if (opts.daysSinceActivity > 14) return 'red'
  if (opts.daysSinceActivity > 7)  return 'amber'
  return 'green'
}

// ─── RAG style helper ─────────────────────────────────────────────────────────
function ragStyle(status: string) {
  switch (status) {
    case 'green': return { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', label: 'Green' }
    case 'amber': return { dot: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700',     label: 'Amber' }
    case 'red':   return { dot: 'bg-red-500',      badge: 'bg-red-100 text-red-700',         label: 'Red'   }
    default:      return { dot: 'bg-neutral-300',  badge: 'bg-neutral-100 text-neutral-500', label: '—'     }
  }
}

type InitiativeRow = { id: string; title: string; phase: string; status: string; pillar: string }
type InactiveMember = {
  initiative_id: string; initiative_title: string; user_id: string
  name: string; role: string; organization: string | null; last_active_at: string | null
}

export default async function BureauPage() {
  const supabase = await createClient()

  // Hoist all time constants — avoids ESLint impure-function-in-render warnings
  const now = new Date()
  const nowMs = now.getTime()
  const cutoff7  = new Date(nowMs - 7  * 86_400_000).toISOString()
  const cutoff14 = new Date(nowMs - 14 * 86_400_000).toISOString()

  const today = now.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // ── Data fetching ─────────────────────────────────────────────────────────
  const [
    { data: rawInitiatives },
    { data: rawActivity },
    { data: rawWeeklyMilestones },
    { data: rawWeeklyTasks },
    { data: rawWeeklyDiscussions },
    { data: mData },
    { data: tData },
  ] = await Promise.all([
    supabase.from('initiatives').select('id, title, phase, status, pillar').eq('status', 'active').order('title'),
    supabase.from('activity_log').select('initiative_id, created_at').order('created_at', { ascending: false }),
    supabase.from('milestones').select('id').eq('status', 'completed').gte('completed_date', cutoff7),
    supabase.from('tasks').select('id').eq('status', 'done').gte('updated_at', cutoff7),
    supabase.from('discussions').select('id').gte('created_at', cutoff7),
    supabase.from('milestones').select('initiative_id, status'),
    supabase.from('tasks').select('initiative_id, status'),
  ])

  const initiatives = (rawInitiatives ?? []) as InitiativeRow[]

  // ── Build last-activity map ───────────────────────────────────────────────
  const lastActivityMap = new Map<string, string>()
  for (const row of rawActivity ?? []) {
    const id = row.initiative_id as string | null
    if (id && !lastActivityMap.has(id)) lastActivityMap.set(id, row.created_at as string)
  }

  // ── Milestone stats map ───────────────────────────────────────────────────
  const milestoneMap = new Map<string, { total: number; done: number; overdue: number }>()
  for (const m of mData ?? []) {
    const id = m.initiative_id as string | null
    if (!id) continue
    const cur = milestoneMap.get(id) ?? { total: 0, done: 0, overdue: 0 }
    cur.total++
    if (m.status === 'completed') cur.done++
    if (m.status === 'overdue') cur.overdue++
    milestoneMap.set(id, cur)
  }

  // ── Task stats map ────────────────────────────────────────────────────────
  const taskMap = new Map<string, { total: number; done: number; blocked: number }>()
  for (const t of tData ?? []) {
    const id = t.initiative_id as string | null
    if (!id) continue
    const cur = taskMap.get(id) ?? { total: 0, done: 0, blocked: 0 }
    cur.total++
    if (t.status === 'done') cur.done++
    if (t.status === 'blocked') cur.blocked++
    taskMap.set(id, cur)
  }

  // ── Inactivity alerts ─────────────────────────────────────────────────────
  const { data: inactiveRaw } = await supabase
    .from('initiative_members')
    .select(
      'initiative_id, user_id, role, profile:profiles!initiative_members_user_id_fkey(name, organization, last_active_at), initiative:initiatives!initiative_members_initiative_id_fkey(title, status)',
    )

  type RawMember = {
    initiative_id: string; user_id: string; role: string
    profile: { name: string; organization: string | null; last_active_at: string | null } | null
    initiative: { title: string; status: string } | null
  }

  const inactiveMembers: InactiveMember[] = ((inactiveRaw ?? []) as unknown as RawMember[])
    .filter(
      (m) =>
        m.profile &&
        m.initiative?.status === 'active' &&
        (!m.profile.last_active_at || m.profile.last_active_at < cutoff14),
    )
    .map((m) => ({
      initiative_id: m.initiative_id,
      initiative_title: m.initiative!.title,
      user_id: m.user_id,
      name: m.profile!.name,
      role: m.role,
      organization: m.profile!.organization,
      last_active_at: m.profile!.last_active_at,
    }))

  // ── Per-initiative RAG derivation ─────────────────────────────────────────
  const initiativeData = initiatives.map((init) => {
    const ms = milestoneMap.get(init.id) ?? { total: 0, done: 0, overdue: 0 }
    const ts = taskMap.get(init.id) ?? { total: 0, done: 0, blocked: 0 }
    const lastAct = lastActivityMap.get(init.id) ?? null
    const daysSinceActivity = lastAct
      ? Math.floor((nowMs - new Date(lastAct).getTime()) / 86_400_000)
      : null
    const rag = deriveInitiativeRAG({
      overdueMilestones: ms.overdue,
      blockedTasks: ts.blocked,
      daysSinceActivity: daysSinceActivity ?? 999,
    })
    const taskPct = ts.total > 0 ? Math.round((ts.done / ts.total) * 100) : 0
    return { ...init, ms, ts, daysSinceActivity, rag, taskPct }
  })

  const ragOrder: Record<string, number> = { red: 0, amber: 1, green: 2 }
  const sorted = [...initiativeData].sort(
    (a, b) => (ragOrder[a.rag] ?? 3) - (ragOrder[b.rag] ?? 3),
  )

  const ragCounts = {
    red:   sorted.filter((i) => i.rag === 'red').length,
    amber: sorted.filter((i) => i.rag === 'amber').length,
    green: sorted.filter((i) => i.rag === 'green').length,
  }

  const weeklyStats = {
    milestones:    rawWeeklyMilestones?.length ?? 0,
    tasks:         rawWeeklyTasks?.length ?? 0,
    discussions:   rawWeeklyDiscussions?.length ?? 0,
    initiatives:   initiatives.length,
    inactiveCount: inactiveMembers.length,
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Friday Morning Bureau</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{today}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700">🔴 {ragCounts.red} Red</span>
          <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-700">🟡 {ragCounts.amber} Amber</span>
          <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">🟢 {ragCounts.green} Green</span>
        </div>
      </div>

      {/* RAG Health Grid */}
      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Initiative Health Grid</h2>
          <span className="text-xs text-neutral-400">{initiatives.length} active initiatives</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-100 text-sm">
            <thead className="bg-neutral-50">
              <tr>
                {['Initiative', 'Pillar', 'Phase', 'RAG', 'Last Activity', 'Milestones', 'Tasks', 'Blockers'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-neutral-400">No active initiatives found.</td>
                </tr>
              ) : sorted.map((init) => {
                const rag = ragStyle(init.rag)
                return (
                  <tr key={init.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      <Link href={`/app/initiatives/${init.id}`} className="hover:text-orange-700 transition-colors">
                        {init.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 capitalize whitespace-nowrap">{init.pillar.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 capitalize whitespace-nowrap">
                      <span className="rounded px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600">{init.phase}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold ${rag.badge}`}>
                        <span className={`h-2 w-2 rounded-full ${rag.dot}`} />
                        {rag.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {init.daysSinceActivity === null ? (
                        <span className="text-neutral-400">No activity</span>
                      ) : (
                        <span className={
                          init.daysSinceActivity > 14 ? 'text-red-600 font-semibold' :
                          init.daysSinceActivity > 7  ? 'text-amber-600 font-medium' : 'text-neutral-600'
                        }>
                          {init.daysSinceActivity}d ago
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-neutral-900 font-medium">{init.ms.done}</span>
                      <span className="text-neutral-400">/{init.ms.total}</span>
                      {init.ms.overdue > 0 && (
                        <span className="ml-1 rounded px-1 py-0.5 text-xs font-medium bg-red-100 text-red-700">{init.ms.overdue} overdue</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-neutral-200 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${init.taskPct}%` }} />
                        </div>
                        <span className="text-xs text-neutral-500">{init.taskPct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {init.ts.blocked > 0 ? (
                        <span className="rounded px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700">{init.ts.blocked} blocked</span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Inactivity Alert Panel */}
      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Inactivity Alerts</h2>
            <p className="mt-0.5 text-xs text-neutral-500">Members not active in the last 14 days</p>
          </div>
          {inactiveMembers.length > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">{inactiveMembers.length}</span>
          )}
        </div>
        {inactiveMembers.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-neutral-500">✅ All active initiative members have been active in the last 14 days.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {inactiveMembers.map((m, i) => {
              const daysInactive = m.last_active_at
                ? Math.floor((nowMs - new Date(m.last_active_at).getTime()) / 86_400_000)
                : null
              return (
                <li key={`${m.initiative_id}-${m.user_id}-${i}`} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-200">
                    <span className="text-sm font-bold text-neutral-600">{m.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900">{m.name}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {m.initiative_title} · {m.role}{m.organization ? ` · ${m.organization}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-red-600">
                      {daysInactive !== null ? `${daysInactive}d inactive` : 'Never active'}
                    </p>
                    <a
                      href={`mailto:?subject=Inspire2Live%20update%20for%20${encodeURIComponent(m.name)}&body=Hi%20${encodeURIComponent(m.name)}%2C%20we%20noticed%20you%20haven%27t%20been%20active%20on%20the%20Inspire2Live%20platform%20recently.`}
                      className="mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                    >
                      Send nudge ↗
                    </a>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Weekly Summary */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Weekly Summary</h2>
          <span className="text-xs text-neutral-400">Auto-generated · last 7 days</span>
        </div>
        <p className="mt-3 text-sm text-neutral-700 leading-relaxed">
          This week across <strong>{weeklyStats.initiatives} active initiatives</strong>, the platform recorded{' '}
          <strong>{weeklyStats.milestones} milestone{weeklyStats.milestones !== 1 ? 's' : ''} completed</strong>,{' '}
          <strong>{weeklyStats.tasks} task{weeklyStats.tasks !== 1 ? 's' : ''} closed</strong>, and{' '}
          <strong>{weeklyStats.discussions} discussion{weeklyStats.discussions !== 1 ? 's' : ''} opened</strong>.
          {weeklyStats.inactiveCount > 0
            ? ` ⚠️ ${weeklyStats.inactiveCount} member${weeklyStats.inactiveCount !== 1 ? 's' : ''} flagged for inactivity.`
            : ' 🎉 All team members are active — no inactivity concerns.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { label: 'Active Initiatives',   value: weeklyStats.initiatives,  color: 'bg-blue-100 text-blue-700' },
            { label: 'Milestones Completed', value: weeklyStats.milestones,   color: 'bg-emerald-100 text-emerald-700' },
            { label: 'Tasks Closed',         value: weeklyStats.tasks,        color: 'bg-emerald-100 text-emerald-700' },
            { label: 'Discussions Opened',   value: weeklyStats.discussions,  color: 'bg-violet-100 text-violet-700' },
            { label: 'Inactivity Alerts',    value: weeklyStats.inactiveCount,
              color: weeklyStats.inactiveCount > 0 ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-lg px-3 py-2 ${color}`}>
              <p className="text-lg font-bold leading-none">{value}</p>
              <p className="mt-1 text-xs font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
