import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function CommunicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  void id
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Communication</h2>
          <p className="text-sm text-neutral-500">Team email feed & chat</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Email Feed ── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-900">Email Feed</h3>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <div className="rounded-xl border border-dashed border-neutral-300 py-12 text-center">
            <p className="text-sm font-medium text-neutral-600">No emails yet</p>
            <p className="mt-1 text-xs text-neutral-400">Email integration is planned for a future release.</p>
          </div>

          {/* Compose placeholder */}
          <div className="mt-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3">
            <p className="text-xs font-medium text-neutral-500">✉️ Compose email</p>
            <div className="mt-2 h-8 rounded-lg border border-neutral-200 bg-white px-3 flex items-center">
              <span className="text-xs text-neutral-300">To: team members...</span>
            </div>
            <div className="mt-1.5 h-16 rounded-lg border border-neutral-200 bg-white px-3 py-2">
              <span className="text-xs text-neutral-300">Message...</span>
            </div>
            <div className="mt-2 flex justify-end">
              <div className="rounded-lg bg-neutral-200 px-4 py-1.5 text-xs font-medium text-neutral-500 cursor-not-allowed">
                Send (coming soon)
              </div>
            </div>
          </div>
        </section>

        {/* ── Team Chat ── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-900">Team Chat</h3>
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              Preview — non-functional
            </span>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            {/* Empty state */}
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-neutral-600">No messages yet</p>
              <p className="mt-1 text-xs text-neutral-400">Real-time team chat integration is planned.</p>
            </div>

            {/* Chat composer placeholder */}
            <div className="border-t border-neutral-200 bg-neutral-50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-300">
                  Type a message... (coming soon)
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-400 cursor-not-allowed">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </div>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-neutral-400">
                Real-time team chat integration planned
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
