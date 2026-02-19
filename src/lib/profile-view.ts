export const roleLabel: Record<string, string> = {
  PatientAdvocate: 'Patient Advocate',
  Clinician: 'Clinician',
  Researcher: 'Researcher',
  HubCoordinator: 'Hub Coordinator',
  IndustryPartner: 'Industry Partner',
  BoardMember: 'Board Member',
  PlatformAdmin: 'Platform Admin',
}

export function getProfileInitials(name?: string | null): string {
  if (!name?.trim()) return 'U'
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function formatMemberSince(createdAt?: string | null): string {
  if (!createdAt) return 'Unknown'
  return new Date(createdAt).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

export function normalizeExpertiseTags(tags: string[] | null): string[] {
  return (tags ?? []).map((tag) => tag.trim()).filter(Boolean)
}

export function parseExpertiseInput(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  )
}

export function humanizeAction(action: string): string {
  return action.replace(/_/g, ' ')
}
