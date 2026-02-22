import { NextResponse } from 'next/server'

/**
 * Small introspection endpoint to verify which build is currently deployed.
 *
 * Useful when Vercel deployments appear to be on “the wrong commit”.
 *
 * Values are populated automatically by Vercel for Git deployments.
 * https://vercel.com/docs/projects/environment-variables/system-environment-variables
 */
export function GET() {
  const payload = {
    now: new Date().toISOString(),
    vercel: {
      env: process.env.VERCEL_ENV ?? null,
      url: process.env.VERCEL_URL ?? null,
      git: {
        provider: process.env.VERCEL_GIT_PROVIDER ?? null,
        repo: process.env.VERCEL_GIT_REPO_SLUG ?? null,
        owner: process.env.VERCEL_GIT_REPO_OWNER ?? null,
        branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
        sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        message: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
      },
    },
  }

  return NextResponse.json(payload)
}
