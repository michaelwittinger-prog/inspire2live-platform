/**
 * Skeleton — pulse-animated loading placeholder.
 * Usage: <Skeleton className="h-6 w-40" />  or  <Skeleton rows={3} />
 */

interface SkeletonProps {
  className?: string
  /** Shorthand: render N rows of skeleton bars */
  rows?: number
}

export function Skeleton({ className, rows }: SkeletonProps) {
  if (rows) {
    return (
      <div className="flex flex-col gap-3" role="status" aria-label="Loading">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-neutral-200"
            style={{ width: `${85 - i * 10}%` }}
          />
        ))}
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  return (
    <div
      className={`animate-pulse rounded bg-neutral-200 ${className ?? 'h-4 w-full'}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading…</span>
    </div>
  )
}

/** Card-shaped skeleton for dashboard / grid views */
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5" role="status" aria-label="Loading card">
      <div className="flex flex-col gap-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
        <div className="h-3 w-full animate-pulse rounded bg-neutral-200" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-neutral-200" />
        <div className="mt-2 flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-neutral-200" />
          <div className="h-6 w-12 animate-pulse rounded-full bg-neutral-200" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}

/** Grid of skeleton cards */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
