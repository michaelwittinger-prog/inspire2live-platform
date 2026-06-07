import { getUserWorkspaceLabel, normalizeUserType, type UserType } from '@/lib/user-workspace'

const USER_TYPE_BADGE_CLASS: Record<UserType, string> = {
  comms: 'border-orange-200 bg-orange-50 text-orange-700',
  board: 'border-violet-200 bg-violet-50 text-violet-700',
  partner: 'border-teal-200 bg-teal-50 text-teal-700',
  default: 'border-neutral-200 bg-neutral-100 text-neutral-600',
}

/**
 * Small pill showing a person's existing user_type label
 * (e.g. "Communications", "Board"). Surfaces the existing model only —
 * no new role is introduced.
 */
export function RoleBadge({
  userType,
  className = '',
}: {
  userType: string | null | undefined
  className?: string
}) {
  const normalized = normalizeUserType(userType)
  const label = getUserWorkspaceLabel(normalized)
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${USER_TYPE_BADGE_CLASS[normalized]} ${className}`}
    >
      {label}
    </span>
  )
}
