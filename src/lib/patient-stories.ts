export type PatientStoryStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'needs_changes'
  | 'approved'
  | 'published'
  | 'archived'
  | 'rejected'

export const PATIENT_STORY_STATUS_META: Record<PatientStoryStatus, { label: string; tone: 'neutral' | 'blue' | 'amber' | 'green' | 'red' }>
  = {
    draft: { label: 'Draft', tone: 'neutral' },
    submitted: { label: 'Submitted', tone: 'blue' },
    in_review: { label: 'In Review', tone: 'amber' },
    needs_changes: { label: 'Needs Changes', tone: 'red' },
    approved: { label: 'Approved', tone: 'green' },
    published: { label: 'Published', tone: 'green' },
    archived: { label: 'Archived', tone: 'neutral' },
    rejected: { label: 'Rejected', tone: 'red' },
  }

export function slugifyStoryTitle(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80)
}
