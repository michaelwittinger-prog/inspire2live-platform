/**
 * RAG Status logic for initiatives, milestones, and tasks.
 *
 * RAG = Red / Amber / Green
 * - Green: on track, no issues
 * - Amber: at risk (approaching deadline or minor blockage)
 * - Red:   blocked or overdue
 */

export type RAGStatus = 'green' | 'amber' | 'red'

export interface RAGInput {
  /** ISO date string of the target/due date */
  dueDate: string
  /** Whether the item has an active unresolved blocker */
  hasBlocker: boolean
  /** Whether the item is already completed */
  completed: boolean
  /** Reference date for "today" — defaults to now, injectable for testing */
  today?: string
}

/**
 * Derives the RAG status for a single item.
 *
 * Rules (in priority order):
 * 1. Completed → green
 * 2. Has active blocker → red
 * 3. Overdue (dueDate < today) → red
 * 4. Due within 7 days → amber
 * 5. Otherwise → green
 */
export function deriveRAGStatus(input: RAGInput): RAGStatus {
  const { dueDate, hasBlocker, completed, today } = input
  const now = today ? new Date(today) : new Date()
  const due = new Date(dueDate)

  if (completed) return 'green'
  if (hasBlocker) return 'red'

  // Strip time for date-only comparison
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())

  if (dueDay < nowDay) return 'red' // overdue

  const msPerDay = 1000 * 60 * 60 * 24
  const daysRemaining = Math.round((dueDay.getTime() - nowDay.getTime()) / msPerDay)

  if (daysRemaining <= 7) return 'amber'

  return 'green'
}

/**
 * Returns the CSS colour class for a RAG status chip.
 */
export function ragColorClass(status: RAGStatus): string {
  switch (status) {
    case 'red':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'amber':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'green':
      return 'bg-green-100 text-green-700 border-green-200'
  }
}
