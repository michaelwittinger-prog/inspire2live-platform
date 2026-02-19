import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { InitiativeTabs } from '@/components/initiatives/initiative-tabs'
import { canManageInitiativeWorkspace } from '@/lib/initiative-workspace'

export default async function InitiativeLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { id: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (profile && !profile.onboarding_completed) redirect('/onboarding')

  const { data: initiative } = await supabase
    .from('initiatives')
    .select('id, title, status, phase')
    .eq('id', params.id)
    .maybeSingle()

  if (!initiative) redirect('/app/initiatives')

  const { data: membership } = await supabase
    .from('initiative_members')
    .select('role')
    .eq('initiative_id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  const isCoordinator = profile?.role === 'HubCoordinator' || profile?.role === 'PlatformAdmin'
  if (!membership && !isCoordinator) redirect('/app/initiatives')

  const canManage = canManageInitiativeWorkspace(profile?.role, membership?.role)

  const tabs = [
    { label: 'Overview', href: `/app/initiatives/${params.id}` },
    { label: 'Milestones', href: `/app/initiatives/${params.id}/milestones` },
    { label: 'Tasks', href: `/app/initiatives/${params.id}/tasks` },
    { label: 'Evidence', href: `/app/initiatives/${params.id}/evidence` },
    { label: 'Team', href: `/app/initiatives/${params.id}/team` },
    { label: 'Discussions', href: `/app/initiatives/${params.id}/discussions` },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{initiative.title}</h1>
            <p className="mt-1 text-sm capitalize text-neutral-600">
              {initiative.phase} · {initiative.status}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/app/initiatives"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              All initiatives
            </Link>
            {canManage ? (
              <Link
                href={`/app/initiatives/${params.id}/tasks`}
                className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                Manage tasks
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <InitiativeTabs tabs={tabs} />
      {children}
    </div>
  )
}

