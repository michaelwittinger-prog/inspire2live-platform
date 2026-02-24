import { describe, expect, it } from 'vitest'
import { getAuthBaseUrl, getAuthCallbackUrl } from '@/lib/auth-redirect-url'

describe('auth redirect URL helpers', () => {
  it('uses configured production app URL when provided', () => {
    const base = getAuthBaseUrl({
      configuredAppUrl: 'https://inspire2live-platform.vercel.app',
      browserOrigin: 'http://localhost:3000',
    })

    expect(base).toBe('https://inspire2live-platform.vercel.app')
  })

  it('ignores configured localhost URL when browser origin is production', () => {
    const base = getAuthBaseUrl({
      configuredAppUrl: 'http://localhost:3000',
      browserOrigin: 'https://inspire2live-platform.vercel.app',
    })

    expect(base).toBe('https://inspire2live-platform.vercel.app')
  })

  it('returns localhost when both configured URL and browser origin are localhost', () => {
    const base = getAuthBaseUrl({
      configuredAppUrl: 'http://localhost:3000',
      browserOrigin: 'http://localhost:3000',
    })

    expect(base).toBe('http://localhost:3000')
  })

  it('builds callback URL from resolved base URL', () => {
    const callback = getAuthCallbackUrl({
      configuredAppUrl: 'https://inspire2live-platform.vercel.app/',
      browserOrigin: 'http://localhost:3000',
    })

    expect(callback).toBe('https://inspire2live-platform.vercel.app/auth/callback')
  })
})
