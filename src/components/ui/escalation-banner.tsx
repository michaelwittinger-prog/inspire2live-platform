export function EscalationBanner({
  tone = 'info',
  title,
  message,
}: {
  tone?: 'info' | 'warning'
  title: string
  message: string
}) {
  const cls =
    tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-blue-200 bg-blue-50 text-blue-900'

  return (
    <div className={[
      'rounded-xl border p-4',
      cls,
    ].join(' ')}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm opacity-90">{message}</p>
    </div>
  )
}
