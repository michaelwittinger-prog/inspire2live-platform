'use client'

import { Suspense, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Tab = 'signin' | 'signup' | 'magic'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-sm text-neutral-400">Loading…</p></div>}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>('signin')

  /* shared */
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const authError = searchParams.get('error')

  /* ── Sign in with password ── */
  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setStatus({ type: 'error', msg: 'Invalid email or password. Please try again.' })
    } else {
      router.push('/app/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  /* ── Create account with password ── */
  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setStatus({ type: 'error', msg: 'Passwords do not match.' })
      return
    }
    if (password.length < 8) {
      setStatus({ type: 'error', msg: 'Password must be at least 8 characters.' })
      return
    }
    setLoading(true)
    setStatus(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    if (error) {
      setStatus({ type: 'error', msg: error.message })
    } else {
      setStatus({
        type: 'success',
        msg: 'Account created! Check your email to confirm, then come back here to sign in.',
      })
    }
    setLoading(false)
  }

  /* ── Magic link (OTP fallback) ── */
  const handleMagicLink = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    if (error) {
      setStatus({ type: 'error', msg: error.message })
    } else {
      setStatus({ type: 'success', msg: 'Magic link sent — check your email.' })
    }
    setLoading(false)
  }

  const switchTab = (t: Tab) => {
    setTab(t)
    setStatus(null)
    setPassword('')
    setConfirmPassword('')
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'signin', label: 'Sign in' },
    { key: 'signup', label: 'Create account' },
  ]

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-12">
      <div className="w-full rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-600 text-sm font-bold text-white">
            I2L
          </span>
          <span className="text-base font-semibold text-neutral-900">Inspire2Live Platform</span>
        </div>

        {/* Auth callback error */}
        {authError === 'auth_callback_failed' && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Login link expired or already used. Please sign in again.
          </p>
        )}

        {/* Tabs */}
        <div className="mb-6 flex rounded-lg border border-neutral-200 bg-neutral-50 p-1 gap-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={[
                'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
                tab === key
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Sign in ── */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700" htmlFor="signin-email">
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-orange-300 focus:ring"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700" htmlFor="signin-pw">
                Password
              </label>
              <input
                id="signin-pw"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-orange-300 focus:ring"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {status && (
              <p className={`rounded-lg px-3 py-2 text-sm ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {status.msg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-center text-xs text-neutral-400">
              Forgot password?{' '}
              <button
                type="button"
                onClick={() => switchTab('magic')}
                className="text-orange-600 underline-offset-2 hover:underline"
              >
                Sign in without password
              </button>
            </p>
          </form>
        )}

        {/* ── Create account ── */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700" htmlFor="signup-email">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-orange-300 focus:ring"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700" htmlFor="signup-pw">
                Password <span className="text-neutral-400 font-normal">(min. 8 characters)</span>
              </label>
              <input
                id="signup-pw"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-orange-300 focus:ring"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700" htmlFor="signup-confirm">
                Confirm password
              </label>
              <input
                id="signup-confirm"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-orange-300 focus:ring"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            {status && (
              <p className={`rounded-lg px-3 py-2 text-sm ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {status.msg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}

        {/* ── Magic link (fallback) ── */}
        {tab === 'magic' && (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <p className="text-sm text-neutral-500">
              We&apos;ll email you a one-time login link. No password needed.
            </p>
            <div>
              <label className="block text-sm font-medium text-neutral-700" htmlFor="otp-email">
                Email
              </label>
              <input
                id="otp-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-orange-300 focus:ring"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            {status && (
              <p className={`rounded-lg px-3 py-2 text-sm ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {status.msg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>

            <p className="text-center text-xs text-neutral-400">
              Have a password?{' '}
              <button
                type="button"
                onClick={() => switchTab('signin')}
                className="text-orange-600 underline-offset-2 hover:underline"
              >
                Sign in with password
              </button>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
