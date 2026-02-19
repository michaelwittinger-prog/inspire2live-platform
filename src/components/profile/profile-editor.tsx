'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { parseExpertiseInput } from '@/lib/profile-view'

type EditableProfile = {
  name: string
  bio: string | null
  city: string | null
  country: string
  organization: string | null
  timezone: string
  language: string
  avatar_url: string | null
  expertise_tags: string[] | null
}

export function ProfileEditor({
  userId,
  profile,
}: {
  userId: string
  profile: EditableProfile
}) {
  const supabase = useMemo(() => createClient(), [])

  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [city, setCity] = useState(profile.city ?? '')
  const [country, setCountry] = useState(profile.country)
  const [organization, setOrganization] = useState(profile.organization ?? '')
  const [timezone, setTimezone] = useState(profile.timezone)
  const [language, setLanguage] = useState(profile.language)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [expertiseInput, setExpertiseInput] = useState((profile.expertise_tags ?? []).join(', '))

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const canSave = name.trim().length > 1 && country.trim().length > 0 && !saving

  const onSave = async () => {
    if (!canSave) return
    setSaving(true)
    setMessage('Saving profile…')

    const { error } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        bio: bio.trim() || null,
        city: city.trim() || null,
        country: country.trim(),
        organization: organization.trim() || null,
        timezone: timezone.trim() || 'UTC',
        language,
        avatar_url: avatarUrl.trim() || null,
        expertise_tags: parseExpertiseInput(expertiseInput),
      })
      .eq('id', userId)

    if (error) {
      setMessage(`Could not save profile: ${error.message}`)
      setSaving(false)
      return
    }

    setSaving(false)
    setMessage('Profile saved successfully.')
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-700">Profile settings</h2>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">Country</span>
          <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">City</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">Organization</span>
          <input value={organization} onChange={(e) => setOrganization(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">Timezone</span>
          <input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">Language</span>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2">
            <option value="en">English</option>
            <option value="nl">Dutch</option>
          </select>
        </label>

        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-neutral-600">Avatar URL</span>
          <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2" placeholder="https://..." />
        </label>

        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-neutral-600">Bio</span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
        </label>

        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-neutral-600">Expertise tags (comma separated)</span>
          <input value={expertiseInput} onChange={(e) => setExpertiseInput(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2" placeholder="Patient advocacy, Policy, Prevention" />
        </label>
      </div>

      {message ? <p className="mt-3 text-xs text-neutral-600">{message}</p> : null}
    </section>
  )
}
