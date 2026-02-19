import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Tables } from '@/types/database'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

type ProfileRow = Tables<'profiles'>
type InitiativeRow = Tables<'initiatives'>

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role, country, city, organization, timezone, language, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle<ProfileRow>()

  if (profile?.onboarding_completed) {
    redirect('/app/dashboard')
  }

  const { data: initiatives } = await supabase
    .from('initiatives')
    .select('id, title, status, phase')
    .in('status', ['active', 'draft'])
    .order('title')
    .returns<InitiativeRow[]>()

  return (
    <OnboardingWizard
      userId={user.id}
      initialProfile={profile}
      initiatives={(initiatives ?? []).map((i) => ({
        id: i.id,
        title: i.title,
        status: i.status,
        phase: i.phase,
      }))}
    />
  )
}
