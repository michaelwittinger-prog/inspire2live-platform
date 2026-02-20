import Link from 'next/link'

/* ── Static demo data (renders without DB) ── */
const STATS = [
  { label: 'Active Initiatives', value: '6', icon: '🔬' },
  { label: 'Countries', value: '14', icon: '🌍' },
  { label: 'Team Members', value: '48', icon: '👥' },
  { label: 'Evidence Items', value: '127', icon: '📄' },
]

const INITIATIVES = [
  {
    title: 'Multi-Cancer Early Detection',
    pillar: 'Inspire2Go',
    phase: 'Execution',
    status: 'active',
    countries: ['NL', 'DE', 'FR', 'AT', 'BE'],
    cancerTypes: ['Breast', 'Colorectal', 'Lung', 'Pancreatic'],
    lead: 'Dr. Kai Bergmann',
    leadRole: 'Researcher · Berlin',
    milestones: { done: 2, total: 4 },
    tasks: { open: 3, done: 2 },
    description:
      'Accelerating patient access to MCED blood tests across Europe by connecting patient advocates, researchers, and policymakers.',
  },
  {
    title: 'Molecular Diagnostics Access EU',
    pillar: 'Inspire2Live',
    phase: 'Planning',
    status: 'active',
    countries: ['PL', 'CZ', 'HU', 'RO', 'SK'],
    cancerTypes: ['Lung', 'Colorectal', 'Breast'],
    lead: 'Dr. Nadia Rousseau',
    leadRole: 'Clinician · Paris',
    milestones: { done: 0, total: 4 },
    tasks: { open: 3, done: 2 },
    description:
      'Closing the access gap for molecular diagnostic testing for cancer patients across Central and Eastern Europe.',
  },
  {
    title: 'Patient-Reported Outcome Measures',
    pillar: 'World Campus',
    phase: 'Execution',
    status: 'active',
    countries: ['FR', 'NL', 'DE', 'IT'],
    cancerTypes: ['Breast', 'Lung', 'Haematological'],
    lead: 'Dr. Nadia Rousseau',
    leadRole: 'Clinician · Paris',
    milestones: { done: 2, total: 5 },
    tasks: { open: 4, done: 2 },
    description:
      'Ensuring patient-reported outcomes are routinely collected and used to improve clinical decisions in European oncology centres.',
  },
]

const PERSONAS = [
  { name: 'Sophie van der Berg', role: 'Hub Coordinator', org: 'Inspire2Live Foundation', country: 'NL', initials: 'SB', color: 'bg-orange-100 text-orange-700' },
  { name: 'Maria Hofer', role: 'Patient Advocate', org: 'Austrian Cancer Aid', country: 'AT', initials: 'MH', color: 'bg-rose-100 text-rose-700' },
  { name: 'Dr. Kai Bergmann', role: 'Researcher', org: 'Charité Berlin', country: 'DE', initials: 'KB', color: 'bg-blue-100 text-blue-700' },
  { name: 'Dr. Nadia Rousseau', role: 'Clinician', org: 'Institut Gustave Roussy', country: 'FR', initials: 'NR', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Peter Lindqvist', role: 'Board Member', org: 'Nordic Oncology Foundation', country: 'SE', initials: 'PL', color: 'bg-violet-100 text-violet-700' },
  { name: 'Amara Okonkwo', role: 'Hub Coordinator', org: 'Lagos Hub', country: 'NG', initials: 'AO', color: 'bg-amber-100 text-amber-700' },
]

const HUBS = [
  { name: 'Netherlands Hub', country: '🇳🇱', status: 'active', members: 12, initiatives: 3, coordinator: 'Sophie van der Berg' },
  { name: 'Ghana Hub', country: '🇬🇭', status: 'active', members: 8, initiatives: 2, coordinator: 'Dr. Kwame Asante' },
  { name: 'Nigeria Hub — Lagos', country: '🇳🇬', status: 'active', members: 6, initiatives: 2, coordinator: 'Amara Okonkwo' },
  { name: 'Japan Hub', country: '🇯🇵', status: 'forming', members: 3, initiatives: 1, coordinator: 'Hiroshi Tanaka' },
]

const CONGRESS = {
  year: 2026,
  theme: 'Closing the Gap: Early Detection for All',
  dates: 'October 15–17, 2026',
  location: 'Amsterdam, Netherlands',
  topics: [
    { title: 'MCED reimbursement pathways across Europe', votes: 12, status: 'accepted' },
    { title: 'Patient voice in HTA submissions', votes: 9, status: 'accepted' },
    { title: 'Community screening models for Sub-Saharan Africa', votes: 8, status: 'under_review' },
  ],
}

const RECENT_ACTIVITY = [
  { actor: 'Dr. Kai Bergmann', action: 'completed milestone', target: 'Landscape review of MCED assays', time: '2 days ago' },
  { actor: 'Sophie van der Berg', action: 'assigned task', target: 'Draft NL patient position paper', time: '3 days ago' },
  { actor: 'Dr. Nadia Rousseau', action: 'started discussion', target: 'Should we split NGS and liquid biopsy in mapping?', time: '4 days ago' },
  { actor: 'Maria Hofer', action: 'uploaded evidence', target: 'Patient Advisory Group Meeting Notes', time: '5 days ago' },
  { actor: 'Sophie van der Berg', action: 'updated task status', target: 'Train site staff on REDCap PROM tool', time: '6 days ago' },
]

function pillarColor(pillar: string) {
  if (pillar.toLowerCase().includes('go')) return 'bg-blue-100 text-blue-700'
  if (pillar.toLowerCase().includes('campus')) return 'bg-emerald-100 text-emerald-700'
  return 'bg-orange-100 text-orange-700'
}

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* ── Hero ── */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-600 text-sm font-bold text-white">
              I2L
            </span>
            <span className="text-base font-semibold">Inspire2Live Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.inspire2live.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              Public website ↗
            </a>
            <Link
              href="/login"
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-12">
        {/* ── Hero section ── */}
        <section className="text-center space-y-4 py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-orange-700">
            Operational Collaboration Platform
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-balance">
            Where patient advocates, researchers &amp; clinicians drive cancer initiatives forward
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-600">
            Manage initiatives, track milestones, share evidence, and coordinate across 14 countries.
            Built by and for the Inspire2Live community.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="rounded-lg bg-orange-600 px-6 py-3 font-medium text-white hover:bg-orange-700"
            >
              Get started
            </Link>
            <a
              href="#initiatives"
              className="rounded-lg border border-neutral-300 bg-white px-6 py-3 font-medium text-neutral-800 hover:bg-neutral-100"
            >
              Explore initiatives
            </a>
          </div>
        </section>

        {/* ── Live Stats ── */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map(({ label, value, icon }) => (
            <div key={label} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm text-center">
              <span className="text-2xl">{icon}</span>
              <p className="mt-2 text-3xl font-bold text-neutral-900">{value}</p>
              <p className="mt-1 text-sm text-neutral-500">{label}</p>
            </div>
          ))}
        </section>

        {/* ── Initiatives ── */}
        <section id="initiatives" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Active Initiatives</h2>
            <span className="text-sm text-neutral-400">Showing 3 of 6 initiatives</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {INITIATIVES.map((init) => (
              <div key={init.title} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${pillarColor(init.pillar)}`}>
                    {init.pillar}
                  </span>
                  <span className="rounded px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 capitalize">
                    {init.phase}
                  </span>
                </div>
                <h3 className="text-base font-bold text-neutral-900 leading-snug">{init.title}</h3>
                <p className="text-sm text-neutral-600 line-clamp-2">{init.description}</p>

                <div className="flex flex-wrap gap-1">
                  {init.countries.map((c) => (
                    <span key={c} className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600">{c}</span>
                  ))}
                </div>

                <div className="mt-auto pt-3 border-t border-neutral-100 grid grid-cols-2 gap-2 text-xs text-neutral-500">
                  <div>
                    <span className="font-semibold text-neutral-800">{init.milestones.done}/{init.milestones.total}</span> milestones
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">{init.tasks.open}</span> open tasks
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-600">
                    {init.lead.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-700">{init.lead}</span>
                    <span className="text-neutral-400"> · {init.leadRole}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Recent Activity Feed ── */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Recent Activity</h2>
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <ul className="divide-y divide-neutral-100">
              {RECENT_ACTIVITY.map((item, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-600">
                    {item.actor.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="font-semibold text-neutral-900">{item.actor}</span>{' '}
                    <span className="text-neutral-500">{item.action}</span>{' '}
                    <span className="font-medium text-neutral-700">&ldquo;{item.target}&rdquo;</span>
                  </div>
                  <span className="shrink-0 text-xs text-neutral-400">{item.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Global Hubs ── */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Global Hubs</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HUBS.map((hub) => (
              <div key={hub.name} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{hub.country}</span>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">{hub.name}</h3>
                    <span className={`text-xs font-medium capitalize ${hub.status === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
                      {hub.status}
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-500">
                  <div><span className="font-semibold text-neutral-800">{hub.members}</span> members</div>
                  <div><span className="font-semibold text-neutral-800">{hub.initiatives}</span> initiatives</div>
                </div>
                <p className="mt-2 text-xs text-neutral-400">Coordinator: {hub.coordinator}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Team / Personas ── */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Platform Community</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PERSONAS.map((p) => (
              <div key={p.name} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${p.color}`}>
                  {p.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">{p.name}</p>
                  <p className="text-xs text-neutral-500 truncate">{p.role} · {p.org}</p>
                  <p className="text-xs text-neutral-400">{p.country}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Congress Preview ── */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Upcoming Congress</h2>
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                  Congress {CONGRESS.year}
                </span>
                <h3 className="mt-2 text-xl font-bold text-neutral-900">{CONGRESS.theme}</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  📅 {CONGRESS.dates} · 📍 {CONGRESS.location}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <h4 className="text-sm font-semibold text-neutral-700 mb-2">Top Proposed Topics</h4>
              <ul className="space-y-2">
                {CONGRESS.topics.map((topic) => (
                  <li key={topic.title} className="flex items-center gap-3 text-sm">
                    <span className="shrink-0 rounded bg-neutral-100 px-2 py-0.5 text-xs font-bold text-neutral-600">
                      {topic.votes} votes
                    </span>
                    <span className="flex-1 text-neutral-800">{topic.title}</span>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                      topic.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {topic.status.replace('_', ' ')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="rounded-xl border border-orange-200 bg-orange-50 p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900">Ready to collaborate?</h2>
          <p className="text-neutral-600 max-w-lg mx-auto">
            Join the Inspire2Live platform to manage initiatives, track progress, and contribute to cancer
            research and advocacy across the globe.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-orange-600 px-8 py-3 font-medium text-white hover:bg-orange-700"
          >
            Sign in to the platform
          </Link>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-neutral-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-wrap items-center justify-between gap-4 text-sm text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-orange-600 text-xs font-bold text-white">
              I2L
            </span>
            <span>Inspire2Live Platform</span>
          </div>
          <div className="flex gap-4">
            <a href="https://www.inspire2live.org" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-700">
              inspire2live.org
            </a>
            <span>·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
