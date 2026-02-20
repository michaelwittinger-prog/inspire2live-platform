import type { PlatformRole } from '@/lib/role-access'

export type CongressAction =
  | 'create_workstream'
  | 'update_workstream'
  | 'create_task'
  | 'update_task'
  | 'create_raid'
  | 'update_raid'
  | 'submit_decision'
  | 'review_decision'
  | 'approve_decision'
  | 'log_incident'
  | 'update_incident'

export type PermissionCheck = {
  allowed: boolean
  reason: string
  platformRole: PlatformRole
}

/**
 * Platform role governs if a user can perform a class of actions.
 * Congress roles govern responsibility scope (not permissions).
 */
export function canPerformCongressAction(
  platformRoleRaw: string | null | undefined,
  action: CongressAction
): PermissionCheck {
  const platformRole = (platformRoleRaw as PlatformRole) ?? 'PatientAdvocate'

  // Keep simple and consistent with existing DB helper `is_coordinator_or_admin()`
  const isEditor = platformRole === 'HubCoordinator' || platformRole === 'PlatformAdmin'

  if (!isEditor) {
    return {
      allowed: false,
      platformRole,
      reason: `Your platform role (${platformRole}) is read-only for this action.`,
    }
  }

  // Editors can do all congress actions in v1.
  return {
    allowed: true,
    platformRole,
    reason: `Allowed by platform role (${platformRole}) for ${action}.`,
  }
}

export type ResponsibilityCheck = {
  hasAssignment: boolean
  roles: string[]
  message: string
  tone: 'info' | 'warning'
}

/**
 * Responsibility layer explanation (does not grant permissions).
 * Used to keep "why" messaging clear and avoid hidden overrides.
 */
export function responsibilitySummary(
  platformRoleRaw: string | null | undefined,
  congressRoles: string[]
): ResponsibilityCheck {
  const platformRole = (platformRoleRaw as PlatformRole) ?? 'PatientAdvocate'
  const isEditor = platformRole === 'HubCoordinator' || platformRole === 'PlatformAdmin'
  const hasAssignment = (congressRoles ?? []).length > 0

  if (!isEditor && hasAssignment) {
    return {
      hasAssignment,
      roles: congressRoles,
      tone: 'warning',
      message:
        `You’re assigned as ${congressRoles.join(', ')}, but your platform role (${platformRole}) is read-only. ` +
        `Ask a coordinator/admin to perform edits or promote your platform role.`,
    }
  }

  if (isEditor && !hasAssignment) {
    return {
      hasAssignment,
      roles: [],
      tone: 'info',
      message:
        `You can edit because your platform role (${platformRole}) allows it. ` +
        `You currently have no congress assignment, so responsibility-focused views may be less targeted.`,
    }
  }

  if (hasAssignment) {
    return {
      hasAssignment,
      roles: congressRoles,
      tone: 'info',
      message: `Your congress responsibilities: ${congressRoles.join(', ')}.`,
    }
  }

  return {
    hasAssignment,
    roles: [],
    tone: 'info',
    message: `No congress assignment recorded.`,
  }
}




