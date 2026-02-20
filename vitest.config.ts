import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    include: ['src/test/unit/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/test/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      // Unit tests in this repo focus on business logic in src/lib.
      // UI (src/app, src/components) is validated via E2E smoke tests.
      include: ['src/lib/**/*.{ts,tsx}'],
      exclude: [
        // Demo / seed content is intentionally large and not unit-tested.
        'src/lib/demo-data.ts',
        // Thin wrappers around Next/Supabase runtime.
        'src/lib/supabase/**',
        // Depends on Next.js runtime cookies(); cover via E2E.
        'src/lib/view-as.ts',
        'src/types/**',
        'src/app/globals.css',
        '**/*.d.ts',
        'src/test/**',
        'src/app/layout.tsx',
        'src/app/app/layout.tsx',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
