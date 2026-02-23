'use client'

/**
 * InviteCombobox
 *
 * Accessible combobox that lets you search for existing platform users
 * by name or email, OR type a raw email address for external invites.
 *
 * Features:
 *   - Debounced server search (via /api/invite-search)
 *   - Keyboard navigation: ↑ ↓ Enter Esc
 *   - Mouse selection
 *   - Loading / no-results / error states
 *   - Accessible listbox with aria attributes
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export interface ProfileSuggestion {
  id: string
  name: string
  email: string
  role: string
}

interface InviteComboboxProps {
  onSelect: (suggestion: ProfileSuggestion | null, rawEmail: string) => void
  disabled?: boolean
  placeholder?: string
  'aria-label'?: string
}

const ROLE_LABELS: Record<string, string> = {
  PatientAdvocate: 'Patient Advocate',
  Clinician: 'Clinician',
  Researcher: 'Researcher',
  HubCoordinator: 'Hub Coordinator',
  IndustryPartner: 'Industry Partner',
  BoardMember: 'Board Member',
  PlatformAdmin: 'Platform Admin',
  Moderator: 'Moderator',
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

export function InviteCombobox({
  onSelect,
  disabled,
  placeholder = 'Search by name or email…',
  'aria-label': ariaLabel = 'Search for user to invite',
}: InviteComboboxProps) {
  const [query, setQuery]           = useState('')
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [open, setOpen]             = useState(false)
  const [activeIdx, setActiveIdx]   = useState(-1)
  const [selected, setSelected]     = useState<ProfileSuggestion | null>(null)

  const inputRef    = useRef<HTMLInputElement>(null)
  const listRef     = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  // ── Fetch suggestions ────────────────────────────────────────────────────
  // Split into two effects to avoid the "synchronous setState in effect" warning:
  // 1) clear when query is too short; 2) fetch when query is long enough.

  const queryTooShort = selected || debouncedQuery.trim().length < 2

  useEffect(() => {
    if (!queryTooShort) return
    const t = setTimeout(() => {
      setSuggestions([])
      setOpen(false)
    }, 0)
    return () => clearTimeout(t)
  }, [queryTooShort])

  useEffect(() => {
    if (queryTooShort) return

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/invite-search?q=${encodeURIComponent(debouncedQuery.trim())}`)
      .then(r => {
        if (!r.ok) throw new Error(`Search failed (${r.status})`)
        return r.json() as Promise<ProfileSuggestion[]>
      })
      .then(data => {
        if (cancelled) return
        setSuggestions(data)
        setOpen(data.length > 0)
        setActiveIdx(-1)
      })
      .catch(err => {
        if (cancelled) return
        setError((err as Error).message)
        setSuggestions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [debouncedQuery, queryTooShort])

  // ── Selection helpers (declared before keyboard handler) ─────────────────

  const handleSelect = useCallback((s: ProfileSuggestion) => {
    setSelected(s)
    setQuery(s.name || s.email)
    setOpen(false)
    setSuggestions([])
    onSelect(s, s.email)
  }, [onSelect])

  const handleExternalEmail = useCallback((email: string) => {
    setSelected(null)
    setOpen(false)
    setSuggestions([])
    onSelect(null, email)
  }, [onSelect])

  const handleClear = useCallback(() => {
    setSelected(null)
    setQuery('')
    setSuggestions([])
    setOpen(false)
    onSelect(null, '')
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [onSelect])

  // ── Keyboard handler ──────────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIdx(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIdx >= 0 && suggestions[activeIdx]) {
          handleSelect(suggestions[activeIdx])
        } else if (isValidEmail(query)) {
          handleExternalEmail(query)
        }
        break
      case 'Escape':
        setOpen(false)
        setActiveIdx(-1)
        break
    }
  }, [open, suggestions, activeIdx, query, handleSelect, handleExternalEmail])

  // ── Close on outside click ────────────────────────────────────────────────

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── Scroll active item into view ──────────────────────────────────────────

  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const item = listRef.current.children[activeIdx] as HTMLElement | undefined
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIdx])

  const listId = 'invite-combobox-list'
  const showExternal = !selected && isValidEmail(query) && suggestions.length === 0 && !loading

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id="invite-combobox-input"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={activeIdx >= 0 ? `invite-opt-${activeIdx}` : undefined}
          aria-autocomplete="list"
          type="text"
          value={query}
          onChange={e => {
            setSelected(null)
            setQuery(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true)
          }}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full rounded-lg border px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400
            ${selected ? 'border-orange-300 bg-orange-50 text-orange-900 font-medium' : 'border-neutral-200 bg-white text-neutral-900'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          autoComplete="off"
        />
        {/* Spinner / clear */}
        <span className="absolute right-2.5 flex items-center">
          {loading && (
            <svg className="h-4 w-4 animate-spin text-neutral-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {!loading && query && (
            <button
              type="button"
              onClick={handleClear}
              className="text-neutral-400 hover:text-neutral-700 focus:outline-none"
              aria-label="Clear"
              tabIndex={-1}
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </span>
      </div>

      {/* Dropdown */}
      {(open || showExternal) && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="User suggestions"
          className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-xl border border-neutral-200 bg-white shadow-lg"
        >
          {/* Profile matches */}
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              id={`invite-opt-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={() => handleSelect(s)}
              onMouseEnter={() => setActiveIdx(i)}
              className={`flex cursor-pointer items-start gap-3 px-3 py-2.5 ${i === activeIdx ? 'bg-orange-50' : 'hover:bg-neutral-50'}`}
            >
              {/* Avatar */}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                {(s.name || s.email).slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-neutral-900 truncate">{s.name || s.email}</span>
                <span className="block text-xs text-neutral-500 truncate">
                  {s.email} · {ROLE_LABELS[s.role] ?? s.role}
                </span>
              </span>
            </li>
          ))}

          {/* No profile found — offer external email invite */}
          {showExternal && (
            <li
              id="invite-opt-external"
              role="option"
              aria-selected={false}
              onMouseDown={() => handleExternalEmail(query)}
              className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-neutral-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-neutral-900 truncate">Invite by email</span>
                <span className="block text-xs text-neutral-500 truncate">{query}</span>
              </span>
            </li>
          )}

          {/* No results */}
          {!loading && !showExternal && suggestions.length === 0 && query.length >= 2 && (
            <li className="px-3 py-3 text-xs text-neutral-400 italic">
              No users found. Type an email address to invite externally.
            </li>
          )}
        </ul>
      )}

      {/* Error */}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {/* Selected chip */}
      {selected && (
        <p className="mt-1 flex items-center gap-1 text-xs text-orange-700">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Platform user selected: {selected.name || selected.email}
        </p>
      )}
    </div>
  )
}
