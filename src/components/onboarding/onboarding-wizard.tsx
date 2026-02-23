'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROLE_LABELS } from '@/lib/role-access'

/** Roles available for self-selection during onboarding (excludes admin/moderator) */
type RoleOption =
  | 'PatientAdvocate'
  | 'Clinician'
  | 'Researcher'
  | 'HubCoordinator'
  | 'IndustryPartner'
  | 'BoardMember'

type InitialProfile = {
  name: string
  role: string
  country: string
  city: string | null
  organization: string | null
  timezone: string
  language: string
} | null

type InitiativeOption = {
  id: string
  title: string
  status: string
  phase: string
}

const ROLE_OPTIONS: { value: RoleOption; hint: string }[] = [
  {
    value: 'PatientAdvocate',
    hint: 'Lived-experience leadership and patient-centered advocacy',
  },
  {
    value: 'Clinician',
    hint: 'Clinical pathway design, care quality, implementation insights',
  },
  {
    value: 'Researcher',
    hint: 'Evidence generation, analysis, and knowledge translation',
  },
  {
    value: 'HubCoordinator',
    hint: 'Regional orchestration, convening, and execution governance',
  },
  {
    value: 'IndustryPartner',
    hint: 'Scoped contribution under transparency and neutrality rules',
  },
  {
    value: 'BoardMember',
    hint: 'Strategic oversight and milestone governance',
  },
]

export function OnboardingWizard({
  userId,
  initialProfile,
  initiatives,
}: {
  userId: string
  initialProfile: InitialProfile
  initiatives: InitiativeOption[]
}) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [role, setRole] = useState<RoleOption>(
    (initialProfile?.role as RoleOption) || 'PatientAdvocate'
  )
  const [name, setName] = useState(initialProfile?.name || '')
  const [country, setCountry] = useState(initialProfile?.country || 'NL')
  const [city, setCity] = useState(initialProfile?.city || '')
  const [organization, setOrganization] = useState(initialProfile?.organization || '')
  const [timezone, setTimezone] = useState(
    initialProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  )
  const [language, setLanguage] = useState(initialProfile?.language || 'en')
  const [firstInitiativeId, setFirstInitiativeId] = useState<string>('')

  const canContinueProfile = name.trim().length > 1 && country.trim().length > 0

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        role,
        country: country.trim(),
        city: city.trim() || null,
        organization: organization.trim() || null,
        timezone: timezone.trim() || 'UTC',
        language,
        onboarding_completed: true,
      })
      .eq('id', userId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // Best-effort log to localStorage for later preference handling (no DB schema change in WP-1)
    if (firstInitiativeId) {
      localStorage.setItem('i2l:firstInitiativeId', firstInitiativeId)
    }

    setLoading(false)
    router.push('/app/dashboard')
    router.refresh()
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900">Welcome to Inspire2Live Platform</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Complete your onboarding in 4 quick steps to unlock your workspace.
        </p>
      </div>

      <div className="mb-6 flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-orange-600' : 'bg-neutral-200'}`} />
        ))}
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-neutral-900">Step 1 — Welcome</h2>
            <p className="text-sm text-neutral-600">
              This platform turns decisions into traceable action across initiatives, hubs, and congress cycles.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
              <li>Track tasks, milestones, blockers, and evidence in one place</li>
              <li>Keep patient voices structurally equal in every workflow</li>
              <li>Build institutional memory with traceable decisions and outcomes</li>
            </ul>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-neutral-900">Step 2 — Select your role</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={`rounded-lg border p-3 text-left transition ${
                    role === option.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <p className="font-medium text-neutral-900">{ROLE_LABELS[option.value]}</p>
                  <p className="mt-1 text-xs text-neutral-600">{option.hint}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-neutral-900">Step 3 — Set up your profile</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-neutral-700">Full name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-neutral-700">Country</span>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-neutral-700">City (optional)</span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-neutral-700">Organization (optional)</span>
                <input
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-neutral-700">Timezone</span>
                <input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-neutral-700">Language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                >
                  <option value="en">English</option>
                  <option value="nl">Dutch</option>
                </select>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!canContinueProfile}
                onClick={() => setStep(4)}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-neutral-900">Step 4 — Pick your first initiative</h2>
            <p className="text-sm text-neutral-600">
              Select an initiative to start with. This helps personalize your first dashboard view.
            </p>

            <div className="max-h-64 space-y-2 overflow-auto rounded-lg border border-neutral-200 p-3">
              {initiatives.map((initiative) => (
                <label
                  key={initiative.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 ${
                    firstInitiativeId === initiative.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-neutral-200'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{initiative.title}</p>
                    <p className="text-xs capitalize text-neutral-500">
                      {initiative.status} · {initiative.phase}
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="first-initiative"
                    checked={firstInitiativeId === initiative.id}
                    onChange={() => setFirstInitiativeId(initiative.id)}
                  />
                </label>
              ))}

              {initiatives.length === 0 && (
                <p className="text-sm text-neutral-500">No initiatives are available yet. You can continue now.</p>
              )}
            </div>

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading || !canContinueProfile}
                onClick={handleSubmit}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Finishing...' : 'Finish onboarding'}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
