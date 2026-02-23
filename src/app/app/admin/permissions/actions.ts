'use server'

/**
 * Permission management server actions — Phase 3.
 *
 * NOTE: user_space_permissions and permission_audit_log are added by migration 00022.
 * Until `pnpm supabase gen types` is re-run against the live DB, we cast those
 * table names with `as any` to satisfy the TS overloads that only know about
 * the types currently in src/types/database.ts.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { normalizeRole } from '@/lib/role-access'
import type { AccessLevel, PlatformSpace, ScopeType } from '@/lib/permissions'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PermissionOverrideInput = {
  targetUserId: string
  space: PlatformSpace
  accessLevel: AccessLevel
  scopeType?: ScopeType
  scopeId?: string
}

// ─── Guard: caller must be PlatformAdmin ─────────────────────────────────────

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', adminId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const normalized = normalizeRole(profile?.role)
  if (normalized !== 'PlatformAdmin') {
    return { error: 'Forbidden: PlatformAdmin only', adminId: null }
  }

  return { error: null, adminId: user.id }
}

// ─── setPermissionOverride ────────────────────────────────────────────────────

/**
 * Upserts a permission override for a user on a space.
 * Also appends an audit log entry.
 */
export async function setPermissionOverride(
  input: PermissionOverrideInput
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error: authError, adminId } = await requireAdmin(supabase)
  if (authError || !adminId) return { error: authError ?? 'Unauthorized' }

  const { targetUserId, space, accessLevel, scopeType = 'global', scopeId } = input

  // Read current value for audit log
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('user_space_permissions')
    .select('access_level')
    .eq('user_id', targetUserId)
    .eq('space', space)
    .eq('scope_type', scopeType)
    .is('scope_id', scopeId ?? null)
    .maybeSingle() as { data: { access_level: string } | null }

  // Upsert the override
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: upsertError } = await (supabase as any)
    .from('user_space_permissions')
    .upsert(
      {
        user_id: targetUserId,
        space,
        access_level: accessLevel,
        scope_type: scopeType,
        scope_id: scopeId ?? null,
        granted_by: adminId,
      },
      { onConflict: 'user_id,space,scope_type,scope_id', ignoreDuplicates: false }
    ) as { error: { message: string } | null }

  if (upsertError) return { error: upsertError.message }

  // Append audit log
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('permission_audit_log')
    .insert({
      target_user_id: targetUserId,
      changed_by: adminId,
      change_type: 'permission_override',
      previous_value: existing ? { space, access_level: existing.access_level } : null,
      new_value: { space, access_level: accessLevel, scope_type: scopeType },
    })

  revalidatePath('/app/admin/permissions')
  return { error: null }
}

// ─── removePermissionOverride ─────────────────────────────────────────────────

/**
 * Removes a specific permission override (restores role-based default).
 * Also appends an audit log entry.
 */
export async function removePermissionOverride(
  targetUserId: string,
  space: PlatformSpace,
  scopeType: ScopeType = 'global',
  scopeId?: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error: authError, adminId } = await requireAdmin(supabase)
  if (authError || !adminId) return { error: authError ?? 'Unauthorized' }

  // Read current value for audit log
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('user_space_permissions')
    .select('access_level')
    .eq('user_id', targetUserId)
    .eq('space', space)
    .eq('scope_type', scopeType)
    .is('scope_id', scopeId ?? null)
    .maybeSingle() as { data: { access_level: string } | null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: deleteError } = await (supabase as any)
    .from('user_space_permissions')
    .delete()
    .eq('user_id', targetUserId)
    .eq('space', space)
    .eq('scope_type', scopeType)
    .is('scope_id', scopeId ?? null) as { error: { message: string } | null }

  if (deleteError) return { error: deleteError.message }

  // Append audit log
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('permission_audit_log')
    .insert({
      target_user_id: targetUserId,
      changed_by: adminId,
      change_type: 'permission_override',
      previous_value: existing ? { space, access_level: existing.access_level } : null,
      new_value: { space, access_level: 'default (removed override)', scope_type: scopeType },
    })

  revalidatePath('/app/admin/permissions')
  return { error: null }
}
