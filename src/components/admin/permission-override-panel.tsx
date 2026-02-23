'use client'

import { useState, useTransition } from 'react'
import type { AccessLevel, PlatformSpace, ScopeType } from '@/lib/permissions'
import { setPermissionOverride, removePermissionOverride } from '@/app/app/admin/permissions/actions'

const ACCESS_LEVELS: AccessLevel[] = ['invisible', 'view', 'edit', 'manage']

const ACCESS_BADGE: Record<AccessLevel, string> = {
  invisible: 'bg-neutral-100 text-neutral-400',
  view:      'bg-sky-100 text-sky-700',
  edit:      'bg-emerald-100 text-emerald-700',
  manage:    'bg-orange-100 text-orange-700',
}

const ACCESS_BUTTON: Record<AccessLevel, string> = {
  invisible: 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-600',
  view:      'border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700',
  edit:      'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700',
  manage:    'border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700',
}

const SCOPE_OPTIONS: { value: ScopeType; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'initiative', label: 'Initiative' },
  { value: 'congress', label: 'Congress' },
]

type Props = {
  userId: string
  userName: string
  space: PlatformSpace
  override: AccessLevel | null
  defaultLevel: AccessLevel
  effectiveLevel: AccessLevel
  isOverridden: boolean
  scopedOverrideCount?: number
  onActionComplete?: (payload: { message: string; scopeLabel: string }) => void
}

export function PermissionOverridePanel({
  userId,
  userName,
  space,
  override,
  defaultLevel,
  effectiveLevel,
  isOverridden,
  scopedOverrideCount = 0,
  onActionComplete,
}: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [scopeType, setScopeType] = useState<ScopeType>('global')
  const [scopeId, setScopeId] = useState('')

  function handleSet(level: AccessLevel) {
    setError(null)

    const trimmedScopeId = scopeId.trim()
    if (scopeType !== 'global' && !trimmedScopeId) {
      setError('Please provide a scope id for scoped overrides.')
      return
    }

    const scopeIdForRequest = scopeType === 'global' ? undefined : trimmedScopeId
    const scopeLabel = scopeType === 'global' ? 'global' : `${scopeType}:${scopeIdForRequest}`

    startTransition(async () => {
      const result = await setPermissionOverride({
        targetUserId: userId,
        space,
        accessLevel: level,
        scopeType,
        scopeId: scopeIdForRequest,
      })
      if (result.error) {
        setError(result.error)
      } else {
        onActionComplete?.({ message: `${space} → ${level} (${scopeLabel})`, scopeLabel })
        setSaved(true)
        setTimeout(() => { setSaved(false); setOpen(false) }, 800)
      }
    })
  }

  function handleRemove() {
    setError(null)

    const trimmedScopeId = scopeId.trim()
    if (scopeType !== 'global' && !trimmedScopeId) {
      setError('Please provide a scope id for scoped resets.')
      return
    }

    const scopeIdForRequest = scopeType === 'global' ? undefined : trimmedScopeId
    const scopeLabel = scopeType === 'global' ? 'global' : `${scopeType}:${scopeIdForRequest}`

    startTransition(async () => {
      const result = await removePermissionOverride(
        userId,
        space,
        scopeType,
        scopeIdForRequest
      )
      if (result.error) {
        setError(result.error)
      } else {
        onActionComplete?.({ message: `${space} reset to default (${scopeLabel})`, scopeLabel })
        setSaved(true)
        setTimeout(() => { setSaved(false); setOpen(false) }, 800)
      }
    })
  }

  return (
    <>
      {/* Cell button */}
      <button
        onClick={() => {
          setOpen(true)
          setError(null)
          setSaved(false)
          setScopeType('global')
          setScopeId('')
        }}
        className={`flex flex-col items-start gap-0.5 bg-white px-3 py-2 text-left transition-colors hover:bg-neutral-50 ${isOverridden ? 'ring-1 ring-inset ring-orange-300' : ''}`}
      >
        <span className="font-mono text-xs font-medium text-neutral-600">{space}</span>
        <span className={`rounded px-1.5 py-0.5 text-xs font-mono ${ACCESS_BADGE[effectiveLevel]}`}>
          {effectiveLevel}
        </span>
        {isOverridden && (
          <span className="text-[10px] text-orange-500">overridden</span>
        )}
        {scopedOverrideCount > 0 && (
          <span className="text-[10px] text-indigo-500">scoped {scopedOverrideCount}</span>
        )}
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-base font-semibold text-neutral-900">
                Override <span className="font-mono text-orange-600">{space}</span> for {userName}
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                Role default:{' '}
                <span className={`rounded px-1.5 py-0.5 font-mono ${ACCESS_BADGE[defaultLevel]}`}>
                  {defaultLevel}
                </span>
                {isOverridden && (
                  <> · Current override:{' '}
                    <span className={`rounded px-1.5 py-0.5 font-mono ${ACCESS_BADGE[override!]}`}>
                      {override}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Scope controls */}
            <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-600">Override scope</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SCOPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setScopeType(option.value)
                      setError(null)
                    }}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                      scopeType === option.value
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {scopeType !== 'global' && (
                <div className="mt-2 space-y-1">
                  <label className="block text-[11px] font-medium text-neutral-600">
                    {scopeType === 'initiative' ? 'Initiative ID' : 'Congress ID'}
                  </label>
                  <input
                    value={scopeId}
                    onChange={(e) => setScopeId(e.target.value)}
                    placeholder={scopeType === 'initiative' ? 'e.g. initiative UUID' : 'e.g. congress UUID'}
                    className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 font-mono text-[11px] text-neutral-700"
                  />
                </div>
              )}

              <p className="mt-2 text-[10px] text-neutral-500">
                Use <span className="font-medium">Global</span> for platform-wide overrides. Use scoped overrides for one initiative or congress context.
              </p>
              <div className="mt-2">
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                  Active scope: {scopeType === 'global' ? 'global' : `${scopeType}${scopeId.trim() ? `:${scopeId.trim()}` : ''}`}
                </span>
              </div>
            </div>

            {/* Level picker */}
            <div className="grid grid-cols-2 gap-2">
              {ACCESS_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => handleSet(level)}
                  disabled={isPending || saved || level === override}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                    level === (override ?? effectiveLevel)
                      ? `${ACCESS_BUTTON[level]} ring-2 ring-offset-1 ring-current`
                      : ACCESS_BUTTON[level]
                  }`}
                >
                  {saved && level === (override ?? effectiveLevel) ? '✓ Saved' : `Set ${level}`}
                </button>
              ))}
            </div>

            {/* Remove override */}
            {isOverridden && (
              <button
                onClick={handleRemove}
                disabled={isPending || saved}
                className="mt-3 w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
              >
                {isPending ? 'Removing…' : '↩ Reset to role default'}
              </button>
            )}

            {error && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}

            {/* Cancel */}
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-neutral-400 hover:text-neutral-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
