'use client'

/**
 * error.tsx — catches unhandled server exceptions in the permissions page.
 * Next.js App Router automatically uses this when the Server Component throws.
 * Displays the error message to admin users (safe — this route is admin-only).
 */

import { useEffect } from 'react'

export default function PermissionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to browser console so devtools shows it
    console.error('[admin/permissions] caught error:', error)
  }, [error])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-neutral-900">Permission Management</h1>

      <div className="rounded-xl border border-red-200 bg-red-50 p-6 space-y-3">
        <p className="text-sm font-semibold text-red-700">
          ⚠️ This page crashed with a server-side exception
        </p>

        <div className="rounded-lg bg-white border border-red-100 px-4 py-3">
          <p className="font-mono text-xs font-medium text-red-600">
            {error.message || 'Unknown error'}
          </p>
          {error.digest && (
            <p className="mt-1 font-mono text-xs text-neutral-400">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="text-xs text-red-600 space-y-1">
          <p className="font-medium">Common causes:</p>
          <ul className="list-disc list-inside space-y-0.5 text-red-500">
            <li>Your profile role in the database is not exactly <code className="font-mono">PlatformAdmin</code></li>
            <li>RLS policy evaluation failure on <code className="font-mono">user_space_permissions</code></li>
            <li>A pending database migration was not applied to production</li>
            <li>Supabase connection issue (check environment variables)</li>
          </ul>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
          >
            Try again
          </button>
          <a
            href="/app/admin/users"
            className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-700"
          >
            ← Back to User Management
          </a>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
        <span className="font-medium">Debugging:</span> Check Vercel function logs for{' '}
        <code className="font-mono">[permissions page]</code> entries with the full stack trace.
      </div>
    </div>
  )
}
