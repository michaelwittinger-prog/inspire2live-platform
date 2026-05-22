import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlaceholderButton, PlusIcon } from '@/components/ui/client-buttons'

export default async function PartnersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Partners</h1>
          <p className="mt-1 text-sm text-neutral-500">Partnerships and neutrality declarations.</p>
        </div>
        <PlaceholderButton label="Add Partner" icon={<PlusIcon />} message="Partner management will be available in the next release." />
      </div>
      <div className="rounded-xl border border-dashed border-neutral-300 py-16 text-center text-neutral-500">
        <p className="text-base font-medium">No partners yet</p>
        <p className="mt-1 text-sm">Partner records will appear here once added.</p>
      </div>
    </div>
  )
}
