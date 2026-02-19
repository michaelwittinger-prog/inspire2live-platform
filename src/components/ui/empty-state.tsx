/**
 * EmptyState — action-oriented, never-blaming empty view placeholder.
 * Usage: <EmptyState icon="📋" title="No tasks yet" description="Create your first task to get started." action={{ label: 'Create task', href: '#' }} />
 */
import Link from 'next/link'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: { label: string; href: string }
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center" role="status">
      <span className="text-4xl" aria-hidden="true">{icon}</span>
      <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
      {description && <p className="max-w-sm text-sm text-neutral-500">{description}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
