export function ActivityItem({
  at,
  actor,
  message,
}: {
  at: string
  actor: string
  message: string
}) {
  const ts = new Date(at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
      <p className="text-xs text-neutral-500">{ts}</p>
      <p className="text-sm text-neutral-800">
        <span className="font-semibold">{actor}</span> — {message}
      </p>
    </div>
  )
}
