export function PriorityBadge({
  priority,
}: {
  priority: 'low' | 'medium' | 'high' | 'urgent'
}) {
  const cls: Record<string, string> = {
    low: 'border-neutral-200 bg-neutral-50 text-neutral-700',
    medium: 'border-amber-200 bg-amber-50 text-amber-800',
    high: 'border-orange-200 bg-orange-50 text-orange-800',
    urgent: 'border-red-200 bg-red-50 text-red-700',
  }

  const label: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  }

  return (
    <span className={[
      'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold',
      cls[priority],
    ].join(' ')}>
      {label[priority]}
    </span>
  )
}
