import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test as setup, expect } from '@playwright/test'
import { uiLogin } from './helpers/auth.js'
import { hasCreds, isHeadedRequested } from './helpers/env.js'

const AUTH_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.auth')

// Interactive OTP (SMS / Inspector / readline) can take several minutes per role.
setup.setTimeout(5 * 60_000)

// Match playwright.config setup project: headed locally; CI stays headless unless E2E_HEADED=1.
const PREFER_PAUSE = !process.env.CI || isHeadedRequested()

function ensureAuthDir() {
  fs.mkdirSync(AUTH_DIR, { recursive: true })
}

/**
 * Session setup goes through the real login + OTP UI (not `/api/auth/login/` cookie shortcut).
 * OTP: E2E_OTP (once) → headed page.pause() → readline. See helpers/auth.js.
 */
async function loginViaUiAndSave(page, role, fileName) {
  setup.skip(!hasCreds(role), `Missing ${role} credentials in .env.e2e`)

  let result = await uiLogin(page, role, { completeOtp: true, preferPause: PREFER_PAUSE })

  if (result.throttled) {
    const match = /available in (\d+)/i.exec(result.message || '')
    const waitSec = Math.min(Number(match?.[1] || 60) + 2, 90)
    // eslint-disable-next-line no-console
    console.log(`[e2e] Auth throttle for ${role} — waiting ${waitSec}s then retrying once.`)
    await page.waitForTimeout(waitSec * 1000)
    result = await uiLogin(page, role, { completeOtp: true, preferPause: PREFER_PAUSE })
  }

  if (result.throttled) {
    throw new Error(`Auth still throttled for ${role}: ${result.message}`)
  }
  if (result.error) {
    throw new Error(`UI login failed for ${role}: ${result.error}`)
  }
  if (!result.otpCompleted) {
    throw new Error(`OTP was not completed for ${role} — session not saved.`)
  }

  await expect(page.getByText(result.username, { exact: true }).first()).toBeVisible({
    timeout: 20000,
  })
  ensureAuthDir()
  await page.context().storageState({ path: path.join(AUTH_DIR, fileName) })
}

setup('authenticate citizen', async ({ page }) => {
  await loginViaUiAndSave(page, 'citizen', 'citizen.json')
})

setup('authenticate staff', async ({ page }) => {
  // Stay under OTP / login-init rate limits between roles.
  await page.waitForTimeout(1500)
  await loginViaUiAndSave(page, 'staff', 'staff.json')
})

setup('authenticate admin', async ({ page }) => {
  await page.waitForTimeout(1500)
  await loginViaUiAndSave(page, 'admin', 'admin.json')
})
