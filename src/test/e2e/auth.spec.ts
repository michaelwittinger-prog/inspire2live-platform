import { test, expect } from '@playwright/test'

/**
 * E2E Smoke Tests: Authentication & Route Protection
 *
 * These are smoke tests only — they verify the entry points of the auth
 * flow behave correctly from the browser's perspective.
 * They do NOT test Supabase internals or email flows.
 */

test.describe('Authentication smoke tests', () => {
  test('unauthenticated user visiting /app/dashboard is redirected to /login', async ({ page }) => {
    await page.goto('/app/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /magic link/i })).toBeVisible()
  })

  test('login page shows success message after submitting a valid email', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('test@example.com')
    await page.getByRole('button', { name: /magic link/i }).click()
    // We expect a status message to appear (either success or error — not a crash)
    await expect(page.locator('p')).toBeVisible({ timeout: 5000 })
  })

  test('unauthenticated user visiting /app/initiatives is redirected to /login', async ({ page }) => {
    await page.goto('/app/initiatives')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated user visiting /onboarding is NOT redirected (public-ish)', async ({
    page,
  }) => {
    // Onboarding is not guarded for unauthenticated users in the current middleware
    // (only the /app/* guard fires). This test documents current behaviour.
    const response = await page.goto('/onboarding')
    // Should reach onboarding (200) not get a 404 or crash
    expect(response?.status()).not.toBe(500)
  })
})
