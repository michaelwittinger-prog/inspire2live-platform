import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  linkEventInitiative,
  saveEventDetails,
  toggleEventOutputItem,
  transitionEventStage,
} from '@/app/app/comms/events/actions'
import { triggerEventTeamsStub } from '@/app/app/comms/integration-actions'
import { IntegrationStubForm } from '@/components/comms/integration-stub-form'
import { StatusBadge } from '@/components/ui/status-badge'
import { getIntegrationStubFlags } from '@/lib/comms-integrations'
import { EVENT_STAGE_META, type EventStage } from '@/lib/comms-workflow'
import { createClient } from '@/lib/supabase/server'

const EVENT_DETAIL_SELECT =
  'id, name, event_type, start_date, end_date, location_city, location_country, organiser, stage, is_annual_congress, is_i2l_organised, attendance_kind, presentation_summary, presentation_asset_url, event_image_url, event_website_url, push_to_group_calendar, initiative_ids, i2l_representatives, output_report_drafted, output_linkedin_published, output_newsletter_mentioned, output_media_stored, notes'
const EVENT_DETAIL_FALLBACK_SELECT =
  'id, name, event_type, start_date, end_date, location_city, location_country, organiser, stage, is_annual_congress, initiative_ids, i2l_representatives, output_report_drafted, output_linkedin_published, output_newsletter_mentioned, output_media_stored, notes'

function formatDateRange(startDate: string, endDate: string | null) {
  const formatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' })
  if (!endDate || endDate === startDate) return formatter.format(new Date(startDate))
  return `${formatter.format(new Date(startDate))} - ${formatter.format(new Date(endDate))}`
}

const OUTPUT_FIELDS = [
  { field: 'output_report_drafted', label: 'Report drafted' },
  { field: 'output_linkedin_published', label: 'LinkedIn published' },
  { field: 'output_newsletter_mentioned', label: 'Newsletter mentioned' },
  { field: 'output_media_stored', label: 'Media stored' },
] as const

export default async function CommsEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: eventWithOwnership, error: eventWithOwnershipError } = await supabase
    .from('events')
    .select(EVENT_DETAIL_SELECT)
    .eq('id', id)
    .maybeSingle()
  let event = eventWithOwnership
  if (eventWithOwnershipError) {
    const { data: fallbackEvent } = await supabase
      .from('events')
      .select(EVENT_DETAIL_FALLBACK_SELECT)
      .eq('id', id)
      .maybeSingle()
    event = fallbackEvent
      ? {
          ...fallbackEvent,
          is_i2l_organised: false,
          attendance_kind: 'visitor',
          presentation_summary: null,
          presentation_asset_url: null,
          event_image_url: null,
          event_website_url: null,
          push_to_group_calendar: false,
        }
      : null
  }

  if (!event) notFound()

  const [{ data: profiles }, { data: initiatives }, { data: linkedCalendar }] = await Promise.all([
    supabase.from('profiles').select('id, name, email').order('name'),
    supabase.from('initiatives').select('id, title').order('title'),
    supabase.from('content_calendar').select('id, title, status, scheduled_at').eq('source_event_id', id).order('scheduled_at', { ascending: false }),
  ])

  const representativeSet = new Set(event.i2l_representatives ?? [])
  const linkedInitiativeSet = new Set(event.initiative_ids ?? [])
  const linkedInitiatives = (initiatives ?? []).filter((initiative) => linkedInitiativeSet.has(initiative.id))
  const stubFlags = getIntegrationStubFlags()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/app/comms/events" className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700 hover:text-orange-800">
        ← Back to event pipeline
      </Link>

      {event.is_annual_congress && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">Annual Congress linkage</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-violet-950">{event.name}</h1>
              <p className="text-sm text-violet-800">This event is linked to the existing Congress workspace and keeps that surface unchanged.</p>
            </div>
            <Link href="/app/congress" className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800">
              Open Congress workspace
            </Link>
          </div>
        </div>
      )}

      {!event.is_annual_congress && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={EVENT_STAGE_META[event.stage as EventStage]?.label ?? event.stage} tone={EVENT_STAGE_META[event.stage as EventStage]?.tone ?? 'neutral'} />
            <StatusBadge label={event.event_type} tone="blue" />
            <StatusBadge label={event.is_i2l_organised ? 'I2L own' : 'Networking'} tone={event.is_i2l_organised ? 'green' : 'neutral'} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900">{event.name}</h1>
            <p className="text-sm text-neutral-500">{formatDateRange(event.start_date, event.end_date)}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <form action={saveEventDetails} className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <input type="hidden" name="event_id" value={event.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-neutral-800">Event name</span>
              <input name="name" defaultValue={event.name} required className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-neutral-800">Event type</span>
              <select name="event_type" defaultValue={event.event_type} className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm">
                {['conference', 'workshop', 'congress', 'symposium', 'webinar', 'other'].map((eventType) => (
                  <option key={eventType} value={eventType}>
                    {eventType.charAt(0).toUpperCase() + eventType.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-neutral-800">Organiser</span>
              <input name="organiser" defaultValue={event.organiser ?? ''} className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-neutral-800">Start date</span>
              <input type="date" name="start_date" defaultValue={event.start_date} required className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-neutral-800">End date</span>
              <input type="date" name="end_date" defaultValue={event.end_date ?? ''} className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-neutral-800">City</span>
              <input name="location_city" defaultValue={event.location_city ?? ''} className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-neutral-800">Country</span>
              <input name="location_country" defaultValue={event.location_country ?? ''} className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-neutral-800">Kind of attending</span>
              <select name="attendance_kind" defaultValue={event.attendance_kind ?? 'visitor'} className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm">
                {['visitor', 'presenter', 'chair', 'organiser', 'sponsor', 'speaker'].map((kind) => (
                  <option key={kind} value={kind}>
                    {kind.charAt(0).toUpperCase() + kind.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-neutral-800">Event website</span>
              <input type="url" name="event_website_url" defaultValue={event.event_website_url ?? ''} placeholder="https://example.org/event" className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" />
            </label>
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-900">
            <input type="checkbox" name="is_annual_congress" value="true" defaultChecked={event.is_annual_congress} />
            Annual Congress event
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
            <input type="checkbox" name="is_i2l_organised" value="true" defaultChecked={event.is_i2l_organised} />
            I2L-organised event
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-900">
            <input type="checkbox" name="push_to_group_calendar" value="true" defaultChecked={event.push_to_group_calendar} />
            Push to group calendar
          </label>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-neutral-800">Person attending</legend>
            <div className="grid gap-2 md:grid-cols-2">
              {(profiles ?? []).map((profile) => (
                <label key={profile.id} className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm">
                  <input type="checkbox" name="i2l_representatives" value={profile.id} defaultChecked={representativeSet.has(profile.id)} />
                  <span>{profile.name ?? profile.email}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-neutral-800">Picture upload / image link</span>
              <input
                type="url"
                name="event_image_url"
                defaultValue={event.event_image_url ?? ''}
                placeholder="Example: event photo, invitation image, or SharePoint image URL"
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-neutral-800">Upload presentation / slide link</span>
              <input
                type="url"
                name="presentation_asset_url"
                defaultValue={event.presentation_asset_url ?? ''}
                placeholder="Example: deck, PDF, or SharePoint presentation URL"
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          {event.event_image_url && (
            <div
              aria-label="Event image"
              className="h-48 w-full rounded-xl border border-neutral-200 bg-cover bg-center"
              style={{ backgroundImage: `url(${event.event_image_url})` }}
            />
          )}

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-neutral-800">Summary of presentation</span>
            <textarea
              name="presentation_summary"
              rows={4}
              defaultValue={event.presentation_summary ?? ''}
              placeholder="Required when the kind of attending is Presenter."
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-neutral-800">Notes</span>
            <textarea name="notes" rows={8} defaultValue={event.notes ?? ''} className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" />
          </label>

          <div className="flex justify-end">
            <button type="submit" className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
              Save event details
            </button>
          </div>
        </form>

        <div className="space-y-5">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Event links</h2>
            <div className="mt-4 grid gap-2">
              {event.event_website_url && (
                <a href={event.event_website_url} target="_blank" rel="noreferrer" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-100">
                  Open event website
                </a>
              )}
              {event.presentation_asset_url && (
                <a href={event.presentation_asset_url} target="_blank" rel="noreferrer" className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800 hover:bg-violet-100">
                  Open presentation
                </a>
              )}
              <p className={`rounded-xl border px-4 py-3 text-sm font-semibold ${event.push_to_group_calendar ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-neutral-200 bg-neutral-50 text-neutral-600'}`}>
                {event.push_to_group_calendar ? 'Ready for group calendar' : 'Not pushed to group calendar'}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Lifecycle</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.keys(EVENT_STAGE_META) as EventStage[]).map((stage) => (
                <form key={stage} action={transitionEventStage}>
                  <input type="hidden" name="event_id" value={event.id} />
                  <input type="hidden" name="next_stage" value={stage} />
                  <button
                    type="submit"
                    disabled={stage === event.stage}
                    className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Move to {EVENT_STAGE_META[stage].label}
                  </button>
                </form>
              ))}
            </div>
            {stubFlags.teams && (
              <div className="mt-4">
                <IntegrationStubForm
                  action={triggerEventTeamsStub}
                  entityId={event.id}
                  buttonLabel="Teams meeting stub"
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Output checklist</h2>
            <div className="mt-4 grid gap-3">
              {OUTPUT_FIELDS.map((item) => {
                const done = Boolean(event[item.field])
                return (
                  <form key={item.field} action={toggleEventOutputItem} className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{item.label}</p>
                      <p className={`text-xs ${done ? 'text-emerald-700' : 'text-neutral-500'}`}>{done ? 'Completed' : 'Pending'}</p>
                    </div>
                    <input type="hidden" name="event_id" value={event.id} />
                    <input type="hidden" name="field" value={item.field} />
                    <input type="hidden" name="next_value" value={done ? 'false' : 'true'} />
                    <button type="submit" className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
                      {done ? 'Mark pending' : 'Mark done'}
                    </button>
                  </form>
                )
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Initiatives</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {linkedInitiatives.length === 0 ? (
                <p className="text-sm text-neutral-500">No initiative linked yet.</p>
              ) : (
                linkedInitiatives.map((initiative) => (
                  <span key={initiative.id} className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                    {initiative.title}
                  </span>
                ))
              )}
            </div>

            <form action={linkEventInitiative} className="mt-4 flex flex-wrap gap-3">
              <input type="hidden" name="event_id" value={event.id} />
              <select name="initiative_id" className="min-w-[220px] rounded-xl border border-neutral-200 px-3 py-2 text-sm">
                {(initiatives ?? [])
                  .filter((initiative) => !linkedInitiativeSet.has(initiative.id))
                  .map((initiative) => (
                    <option key={initiative.id} value={initiative.id}>
                      {initiative.title}
                    </option>
                  ))}
              </select>
              <button type="submit" className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50">
                Link initiative
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Calendar entries</h2>
            <div className="mt-3 space-y-3">
              {(linkedCalendar ?? []).length === 0 ? (
                <p className="text-sm text-neutral-500">No content calendar cards linked to this event yet.</p>
              ) : (
                linkedCalendar?.map((entry) => (
                  <Link key={entry.id} href="/app/comms/calendar" className="block rounded-xl border border-neutral-200 px-4 py-3 hover:bg-neutral-50">
                    <p className="text-sm font-semibold text-neutral-900">{entry.title}</p>
                    <p className="text-xs text-neutral-500">
                      {entry.status} · {entry.scheduled_at ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.scheduled_at)) : 'Unscheduled'}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
