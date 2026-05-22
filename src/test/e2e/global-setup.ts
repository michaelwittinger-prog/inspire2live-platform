import { chromium, type FullConfig } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'admin@inspire2live.org'
const ADMIN_PASSWORD = 'demo1234'
export const AUTH_STATE_PATH = 'src/test/e2e/.auth-state.json'

export default async function globalSetup(config: FullConfig) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // The seed-demo.sql is never applied in CI/production — only schema
  // migrations run — so the admin@inspire2live.org account doesn't exist
  // unless we create it here. We also force-reset the password and profile
  // on every run so the test is idempotent regardless of prior state.
  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error(
      'E2E globalSetup requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars'
    )
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Try to create the user. If it already exists, createUser returns an
  // error — we then look it up and force-update the password below.
  const createResult = await adminClient.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  })

  let userId = createResult.data?.user?.id
  if (!userId) {
    const { data: list } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
    userId = list?.users.find((u) => u.email === ADMIN_EMAIL)?.id
  }

  if (!userId) {
    throw new Error(
      `Failed to create or find admin user ${ADMIN_EMAIL}: ${createResult.error?.message ?? 'unknown error'}`
    )
  }

  // Force-reset password + confirm email every run. This is the critical
  // step: if the user pre-existed from an earlier run with a different
  // password (or was created manually), login through the UI would fail.
  // Confirming the email also unblocks signInWithPassword for any user
  // created without email_confirm.
  const updateResult = await adminClient.auth.admin.updateUserById(userId, {
    password: ADMIN_PASSWORD,
    email_confirm: true,
  })
  if (updateResult.error) {
    throw new Error(
      `Failed to reset admin user password: ${updateResult.error.message}`
    )
  }

  const profileResult = await adminClient.from('profiles').upsert(
    {
      id: userId,
      name: 'Platform Admin',
      email: ADMIN_EMAIL,
      role: 'PlatformAdmin',
      organization: 'Inspire2Live',
      country: 'NL',
      onboarding_completed: true,
      comms_team: false,
    },
    { onConflict: 'id' }
  )
  if (profileResult.error) {
    throw new Error(
      `Failed to upsert admin profile: ${profileResult.error.message}`
    )
  }

  // Sign in via the UI so Next.js sets the SSR session cookies correctly,
  // then persist the storage state for reuse across all tests.
  const baseURL = config.projects.find((p) => p.name === 'chromium')?.use.baseURL ?? 'http://localhost:3000'
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto(`${baseURL}/login`)
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL)
  await page.getByLabel(/^password$/i).fill(ADMIN_PASSWORD)
  await page.locator('form').getByRole('button', { name: /^sign in$/i }).click()

  // Wait for the post-login redirect. The middleware sends PlatformAdmin
  // to /app/comms/intake and other roles to /app/dashboard — match either.
  // If login fails the page stays on /login with an error; surface that
  // explicitly instead of letting waitForURL time out silently.
  try {
    await page.waitForURL(/\/app\//, { timeout: 30_000 })
  } catch (err) {
    const currentUrl = page.url()
    const errorText = await page
      .locator('p.bg-red-50, p.text-red-700')
      .first()
      .textContent()
      .catch(() => null)
    await browser.close()
    throw new Error(
      `E2E login failed. URL=${currentUrl} formError=${errorText ?? '<none>'} original=${(err as Error).message}`
    )
  }

  await page.context().storageState({ path: AUTH_STATE_PATH })
  await browser.close()
}
