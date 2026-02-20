export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string
  tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'violet'
}) {
  const cls: Record<string, string> = {
    neutral: 'border-neutral-200 bg-neutral-50 text-neutral-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    red: 'border-red-200 bg-red-50 text-red-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
  }

  return (
    <span className={[
      'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold',
      cls[tone],
    ].join(' ')}>
      {label}
    </span>
  )
}
