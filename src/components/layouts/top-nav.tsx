'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { canAccessAppPath } from '@/lib/role-access'

interface TopNavProps {
  userName: string
  userRole: string
  userInitials: string
  unreadCount?: number
}

export function TopNav({ userName, userRole, userInitials, unreadCount = 0 }: TopNavProps) {
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const roleLabel: Record<string, string> = {
    PatientAdvocate: 'Patient Advocate',
    Clinician: 'Clinician',
    Researcher: 'Researcher',
    HubCoordinator: 'Hub Coordinator',
    IndustryPartner: 'Partner',
    BoardMember: 'Board Member',
    PlatformAdmin: 'Platform Admin',
  }

  const notificationsAccessible = canAccessAppPath(userRole, '/app/notifications')

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-neutral-200 bg-white px-4 shadow-sm">
      {/* Left: logo */}
      <div className="flex items-center gap-3">
        <Link href="/app/dashboard" className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-md bg-orange-600 text-xs font-bold text-white flex items-center justify-center">
            I2L
          </span>
          <span className="hidden text-sm font-semibold text-neutral-900 sm:block">
            Inspire2Live Platform
          </span>
        </Link>
      </div>

      {/* Right: notifications + profile */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        {notificationsAccessible ? (
          <Link
            href="/app/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
            aria-label="Notifications"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        ) : null}

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            aria-label="Account menu"
            aria-expanded={profileOpen}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
              {userInitials}
            </span>
            <span className="hidden max-w-30 truncate sm:block">{userName}</span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-1 w-52 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
              <div className="border-b border-neutral-100 px-3 py-2">
                <p className="text-xs font-medium text-neutral-900 truncate">{userName}</p>
                <p className="text-xs text-neutral-500">{roleLabel[userRole] ?? userRole}</p>
              </div>
              <Link
                href="/app/profile"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                onClick={() => setProfileOpen(false)}
              >
                Profile &amp; settings
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
