import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript errors are caught by the dedicated `pnpm typecheck` CI step.
  // Disabling the redundant check inside `next build` avoids build-time
  // failures caused by missing next-env.d.ts in a fresh CI checkout.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
