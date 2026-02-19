export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-8 px-6 py-16">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-orange-700">
            Inspire2Live Platform
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Operational collaboration layer for Inspire2Live
          </h1>
          <p className="max-w-2xl text-lg text-neutral-600">
            The public website at <strong>www.inspire2live.com</strong> remains the
            primary storytelling and outreach channel. This platform complements it
            with authenticated initiative workspaces, governance, and execution.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <a
            href="/login"
            className="rounded-lg bg-orange-600 px-5 py-3 font-medium text-white hover:bg-orange-700"
          >
            Platform login
          </a>
          <a
            href="https://www.inspire2live.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-neutral-300 bg-white px-5 py-3 font-medium text-neutral-800 hover:bg-neutral-100"
          >
            Visit public website
          </a>
        </div>
      </main>
    </div>
  )
}
