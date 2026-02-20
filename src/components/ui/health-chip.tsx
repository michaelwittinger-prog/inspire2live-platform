import { StatusBadge } from './status-badge'

export function HealthChip({
  label,
  value,
  status,
}: {
  label: string
  value: string
  status: 'good' | 'warn' | 'bad'
}) {
  const tone = status === 'good' ? 'green' : status === 'bad' ? 'red' : 'amber'
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2">
      <span className="text-xs text-neutral-600">{label}</span>
      <StatusBadge label={value} tone={tone} />
    </div>
  )
}
