import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const text = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadDotEnvFile(path.join(ROOT, '.env.e2e'))

export const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:8080'

/** Headed Chromium when E2E_HEADED=1 (also used by auth.setup by default locally). */
export function isHeadedRequested() {
  return process.env.E2E_HEADED === '1' || process.env.E2E_HEADED === 'true'
}

export function creds(role) {
  const map = {
    citizen: {
      username: process.env.E2E_CITIZEN_USER,
      password: process.env.E2E_CITIZEN_PASSWORD,
    },
    staff: {
      username: process.env.E2E_STAFF_USER,
      password: process.env.E2E_STAFF_PASSWORD,
    },
    admin: {
      username: process.env.E2E_ADMIN_USER,
      password: process.env.E2E_ADMIN_PASSWORD,
    },
    citizen2: {
      username: process.env.E2E_CITIZEN2_USER,
      password: process.env.E2E_CITIZEN2_PASSWORD,
    },
  }
  return map[role] || { username: undefined, password: undefined }
}

export function hasCreds(role) {
  const { username, password } = creds(role)
  return Boolean(username && password)
}

export function requireCreds(role) {
  const c = creds(role)
  if (!c.username || !c.password) {
    throw new Error(
      `Missing E2E credentials for "${role}". Copy .env.e2e.example → .env.e2e and set passwords.`,
    )
  }
  return c
}

/** Optional one-shot OTP from env (never commit real codes). Consumed once per process. */
export function otpCode() {
  return (process.env.E2E_OTP || '').trim()
}

export function hasOtp() {
  return otpCode().length >= 4
}

/** Take E2E_OTP for one verify step so multi-role setup does not reuse a spent code. */
export function consumeOtpFromEnv() {
  const code = otpCode()
  if (!code) return ''
  delete process.env.E2E_OTP
  return code
}

export function uniqueSuffix() {
  return `${Date.now()}_${Math.floor(Math.random() * 1e6)}`
}
