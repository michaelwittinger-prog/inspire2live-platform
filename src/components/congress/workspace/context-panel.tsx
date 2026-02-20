import type { ReactNode } from 'react'

export function ContextPanel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <aside className="hidden xl:block xl:w-80 shrink-0">
      <div className="sticky top-20 space-y-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Context</p>
          <h2 className="mt-1 text-base font-bold text-neutral-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-neutral-600">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </aside>
  )
}
