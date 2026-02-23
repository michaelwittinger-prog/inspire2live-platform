/**
 * GET /api/invite-search?q=<query>
 *
 * Authenticated search endpoint for the InviteCombobox.
 * Returns up to 10 profile matches by name or email.
 * Only accessible to authenticated users; results respect RLS.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchProfiles } from '@/lib/invitations'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()

  if (q.length < 2) {
    return NextResponse.json([])
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await searchProfiles(supabase, q)
  return NextResponse.json(results)
}
