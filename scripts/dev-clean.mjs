import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'

const lockPath = path.join(process.cwd(), '.next', 'dev', 'lock')

if (existsSync(lockPath)) {
  rmSync(lockPath, { force: true })
  console.log(`[dev:clean] Removed stale lock: ${lockPath}`)
} else {
  console.log('[dev:clean] No lock file found. Nothing to clean.')
}
