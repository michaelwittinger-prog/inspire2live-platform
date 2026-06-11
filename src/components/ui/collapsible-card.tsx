'use client'

import { useEffect, useState } from 'react'

export interface CollapsibleCardProps {
  /** Heading shown in the always-visible header bar. */
  title: React.ReactNode
  /**
   * Stable key for persisting collapsed state across reloads (localStorage).
   * Omit to make the card uncontrolled/non-persistent.
   */
  storageKey?: string
  /** Initial state before any persisted value is read. */
  defaultCollapsed?: boolean
  /** Optional content on the right of the header (links, counts, badges). */
  actions?: React.ReactNode
  /** Card border accent (ignored for the `plain` variant). */
  tone?: 'neutral' | 'orange'
  /**
   * Visual style:
   * - `card` (default): a bordered, padded tile — best for boxed dashboard tiles.
   * - `plain`: no card chrome, larger heading — best for full-width section groups
   *   that already contain their own cards/tables (avoids nested borders).
   */
  variant?: 'card' | 'plain'
  /** Extra classes for the outer wrapper. */
  className?: string
  /** Extra classes for the body wrapper. */
  bodyClassName?: string
  /** Override the title typography (defaults depend on variant). */
  titleClassName?: string
  /** Render a drag handle in the header and make the tile draggable (used for reordering). */
  draggable?: boolean
  /** Visually mark the tile as the one currently being dragged. */
  isDragging?: boolean
  /** Drag-and-drop event handlers, supplied by a `TileGroup` wrapper. */
  onDragStart?: (event: React.DragEvent<HTMLElement>) => void
  onDragOver?: (event: React.DragEvent<HTMLElement>) => void
  onDrop?: (event: React.DragEvent<HTMLElement>) => void
  onDragEnd?: (event: React.DragEvent<HTMLElement>) => void
  children: React.ReactNode
}

function GripIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="5" cy="3" r="1.25" />
      <circle cx="11" cy="3" r="1.25" />
      <circle cx="5" cy="8" r="1.25" />
      <circle cx="11" cy="8" r="1.25" />
      <circle cx="5" cy="13" r="1.25" />
      <circle cx="11" cy="13" r="1.25" />
    </svg>
  )
}

function Chevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      className={[
        'h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200',
        collapsed ? '-rotate-90' : '',
      ].join(' ')}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

/**
 * A titled card whose body can be collapsed/expanded. The header bar (title +
 * chevron) is always visible; clicking it toggles the body. When `storageKey` is
 * provided the collapsed state is remembered per user via localStorage so a tidied
 * dashboard stays tidy across reloads.
 *
 * Reusable across any section-heavy surface (dashboards, congress workspace,
 * initiative detail, …) for a cleaner, scannable layout.
 */
export function CollapsibleCard({
  title,
  storageKey,
  defaultCollapsed = false,
  actions,
  tone = 'neutral',
  variant = 'card',
  className,
  bodyClassName,
  titleClassName,
  draggable,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  children,
}: CollapsibleCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  // Read any persisted preference after hydration (keeps SSR markup stable).
  useEffect(() => {
    if (!storageKey) return
    try {
      const stored = window.localStorage.getItem(`collapse:${storageKey}`)
      // Sync from persisted prefs once mounted; intentionally post-hydration so the
      // SSR markup stays stable (defaultCollapsed) and matches the first client render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored !== null) setCollapsed(stored === '1')
    } catch {
      /* localStorage unavailable — fall back to defaultCollapsed */
    }
  }, [storageKey])

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      if (storageKey) {
        try {
          window.localStorage.setItem(`collapse:${storageKey}`, next ? '1' : '0')
        } catch {
          /* ignore write failures */
        }
      }
      return next
    })
  }

  const bodyId = storageKey ? `collapsible-${storageKey}` : undefined
  const plain = variant === 'plain'

  return (
    <section
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={[
        plain
          ? ''
          : `rounded-xl border bg-white shadow-sm ${tone === 'orange' ? 'border-orange-200' : 'border-neutral-200'}`,
        isDragging ? 'opacity-40' : '',
        className ?? '',
      ].join(' ')}
    >
      <div
        className={[
          'flex items-center justify-between gap-3',
          plain ? 'mb-3' : 'px-4 py-3',
        ].join(' ')}
      >
        {draggable && (
          <span
            className="-mr-1 cursor-grab text-neutral-300 hover:text-neutral-500 active:cursor-grabbing"
            title="Drag to reorder"
            aria-hidden="true"
          >
            <GripIcon />
          </span>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <Chevron collapsed={collapsed} />
          <span
            className={
              titleClassName ??
              (plain ? 'text-base font-semibold text-neutral-900' : 'text-sm font-semibold text-neutral-900')
            }
          >
            {title}
          </span>
        </button>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div
        id={bodyId}
        hidden={collapsed}
        className={[plain ? '' : 'px-4 pb-4', bodyClassName ?? ''].join(' ')}
      >
        {children}
      </div>
    </section>
  )
}
