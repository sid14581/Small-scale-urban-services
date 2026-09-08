import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { expect } from '@playwright/test'
import {
  consumeOtpFromEnv,
  hasCreds,
  hasOtp,
  isHeadedRequested,
  otpCode,
  requireCreds,
} from './env.js'

/**
 * Interactive OTP strategy (no auth bypass / no `/api/auth/login/` cookie shortcut):
 *
 * 1. If `E2E_OTP` is set → fill that code (consumed once so multi-role setup prompts next).
 * 2. Else if headed (`E2E_HEADED=1` or `preferPause` from auth.setup) → `page.pause()` so you
 *    type the OTP in the real UI, click Verify (or leave it filled), then Resume in Inspector.
 * 3. Else if stdin is a TTY → Node readline prompt for the OTP value.
 * 4. Else → fail with a clear error (do not skip OTP).
 */

async function promptOtpViaReadline(purpose) {
  if (!input.isTTY) {
    throw new Error(
      `OTP required for ${purpose}, but no E2E_OTP and no TTY. `
        + 'Set E2E_OTP, or run headed (`E2E_HEADED=1` / auth setup) and enter OTP in the browser.',
    )
  }
  const rl = readline.createInterface({ input, output })
  try {
    const code = (await rl.question(`[e2e] Enter OTP for ${purpose}: `)).trim()
    if (code.length < 4) {
      throw new Error(`OTP for ${purpose} looks too short (got ${code.length} chars).`)
    }
    return code
  } finally {
    rl.close()
  }
}

function otpInput(page) {
  return page.getByLabel('One-time verification code')
}

/**
 * Complete the OTP step after credentials/register already advanced to the verify UI.
 * @returns {{ method: 'env'|'pause'|'readline', otpCompleted: true }}
 */
export async function completeOtpStep(
  page,
  { purpose = 'login', submitButtonName, preferPause = false } = {},
) {
  const heading = page.getByRole('heading', { name: /Verify your (identity|phone)/i })
  await expect(heading).toBeVisible({ timeout: 15000 })

  const fromEnv = consumeOtpFromEnv()
  if (fromEnv) {
    await otpInput(page).fill(fromEnv)
    await page.getByRole('button', { name: submitButtonName }).click()
    await expect(page).not.toHaveURL(/\/(login|register)/, { timeout: 20000 })
    return { method: 'env', otpCompleted: true }
  }

  const usePause = preferPause || isHeadedRequested()
  if (usePause) {
    // eslint-disable-next-line no-console
    console.log(
      `\n[e2e] OTP needed for ${purpose}.`
        + '\n  → Enter the code in the browser (and click Verify if you want),'
        + '\n  → then click Resume in the Playwright Inspector.\n',
    )
    await page.pause()

    // User may have already submitted during the pause.
    if (!/\/(login|register)/.test(page.url())) {
      return { method: 'pause', otpCompleted: true }
    }

    const typed = (await otpInput(page).inputValue()).trim()
    if (typed.length >= 4) {
      await page.getByRole('button', { name: submitButtonName }).click()
      await expect(page).not.toHaveURL(/\/(login|register)/, { timeout: 20000 })
      return { method: 'pause', otpCompleted: true }
    }

    throw new Error(
      `OTP for ${purpose} was not completed during page.pause(). `
        + 'Enter the code in the browser (or set E2E_OTP) and Resume again.',
    )
  }

  const code = await promptOtpViaReadline(purpose)
  await otpInput(page).fill(code)
  await page.getByRole('button', { name: submitButtonName }).click()
  await expect(page).not.toHaveURL(/\/(login|register)/, { timeout: 20000 })
  return { method: 'readline', otpCompleted: true }
}

export async function expectLoggedInAs(page, username) {
  await page.goto('/')
  await expect(page.getByText(username, { exact: true }).first()).toBeVisible({ timeout: 15000 })
}

/**
 * Full UI login: credentials → OTP (env / headed pause / readline). Never uses cookie login API.
 */
export async function uiLogin(page, role, { completeOtp = true, preferPause = false } = {}) {
  const { username, password } = requireCreds(role)
  await page.goto('/login')
  await page.getByLabel('Username').fill(username)
  await page.locator('#login-password').fill(password)
  await page.getByRole('button', { name: 'Continue' }).click()

  const otpHeading = page.getByRole('heading', { name: 'Verify your identity' })
  const alert = page.getByRole('alert')
  await expect(otpHeading.or(alert)).toBeVisible({ timeout: 15000 })

  if (await alert.isVisible()) {
    const message = (await alert.textContent()) || ''
    if (/throttled|too many/i.test(message)) {
      return { username, password, otpCompleted: false, throttled: true, message }
    }
    if (!(await otpHeading.isVisible())) {
      return { username, password, otpCompleted: false, error: message }
    }
  }

  if (!completeOtp) {
    return { username, password, otpCompleted: false }
  }

  const otp = await completeOtpStep(page, {
    purpose: `${role} login`,
    submitButtonName: 'Verify & Login',
    preferPause,
  })
  return { username, password, ...otp }
}

export function skipIfMissingCreds(test, role) {
  test.skip(!hasCreds(role), `Set E2E credentials for "${role}" in .env.e2e (see .env.e2e.example)`)
}

export { hasCreds, hasOtp, otpCode, requireCreds }
