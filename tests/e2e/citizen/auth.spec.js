import { test, expect } from '@playwright/test'
import { completeOtpStep, skipIfMissingCreds, uiLogin } from '../helpers/auth.js'
import { roleTest } from '../helpers/fixtures.js'
import { uniqueSuffix } from '../helpers/env.js'

const citizenTest = roleTest('citizen')

test.describe('Citizen auth', () => {
  test('home shows guest CTAs', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Report urban service issues/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Get started' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Login' }).first()).toBeVisible()
  })

  test('register form completes SMS OTP', async ({ page }) => {
    test.setTimeout(5 * 60_000)
    const suffix = uniqueSuffix()
    await page.goto('/register')
    await page.getByLabel('First name').fill('E2E')
    await page.getByLabel('Email').fill(`e2e_${suffix}@example.com`)
    await page.getByLabel('Username').fill(`e2e_user_${suffix}`)
    await page.getByLabel('Phone (E.164)').fill('+1555000' + String(Date.now()).slice(-4))
    await page.locator('#reg-password').fill('E2eTestPass1!')
    await page.locator('#reg-password-confirm').fill('E2eTestPass1!')
    await page.getByRole('button', { name: 'Send SMS code' }).click()

    const otpHeading = page.getByRole('heading', { name: 'Verify your phone' })
    const alert = page.getByRole('alert')
    await expect(otpHeading.or(alert)).toBeVisible({ timeout: 20000 })

    if (await alert.isVisible() && !(await otpHeading.isVisible())) {
      const message = (await alert.textContent()) || ''
      if (/throttled|too many|rate/i.test(message)) {
        test.skip(true, `Register OTP throttled: ${message}`)
      }
      throw new Error(`Register failed before OTP: ${message}`)
    }

    await completeOtpStep(page, {
      purpose: 'citizen register',
      submitButtonName: 'Verify & Create Account',
    })
  })

  test('login credentials complete OTP and land authenticated', async ({ page }) => {
    test.setTimeout(5 * 60_000)
    skipIfMissingCreds(test, 'citizen')
    let result = await uiLogin(page, 'citizen', { completeOtp: true })

    if (result.throttled) {
      const match = /available in (\d+)/i.exec(result.message || '')
      const waitSec = Math.min(Number(match?.[1] || 60) + 2, 90)
      test.info().annotations.push({
        type: 'note',
        description: `Auth throttle — waiting ${waitSec}s then retrying once.`,
      })
      await page.waitForTimeout(waitSec * 1000)
      result = await uiLogin(page, 'citizen', { completeOtp: true })
    }

    if (result.throttled) {
      test.skip(true, `Auth still throttled after retry: ${result.message}`)
    }
    if (result.error) {
      throw new Error(`UI login failed: ${result.error}`)
    }
    await expect(page.getByText(result.username, { exact: true }).first()).toBeVisible()
  })

  citizenTest('authenticated session lands on citizen home and logout works', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Report now' })).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'Logout' }).click()
    await expect(page.getByRole('link', { name: 'Get started' })).toBeVisible({ timeout: 15000 })
  })
})
