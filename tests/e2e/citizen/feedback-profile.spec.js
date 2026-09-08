import { expect } from '@playwright/test'
import { requireCreds } from '../helpers/auth.js'
import { roleTest } from '../helpers/fixtures.js'
import { uniqueSuffix } from '../helpers/env.js'

const test = roleTest('citizen')

test.describe('Citizen feedback and profile', () => {
  test('submit feedback', async ({ page }) => {
    await page.goto('/feedback')
    await expect(page.getByRole('heading', { name: 'Submit Feedback' })).toBeVisible()
    await page.getByPlaceholder('e.g. App usability, response time').fill(`E2E category ${uniqueSuffix()}`)
    await page.getByPlaceholder('Tell us more...').fill('Playwright feedback comment')
    await page.getByRole('button', { name: 'Submit Feedback' }).click()
    await expect(page.getByText('Thank you!')).toBeVisible({ timeout: 15000 })
  })

  test('update profile fields', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible()
    const nameInput = page.locator('main form').first().locator('input').first()
    const current = await nameInput.inputValue()
    const next = `${current.replace(/\s*E2E\d*$/, '')} E2E${Date.now() % 10000}`.trim().slice(0, 30)
    await nameInput.fill(next)
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page.getByText('Profile updated successfully.')).toBeVisible({ timeout: 15000 })
  })

  test('password change mismatch validation', async ({ page }) => {
    // Seed password `demo1234` fails strength rules as a *new* password, so we
    // do not round-trip change/restore against shared demo accounts.
    const { password } = requireCreds('citizen')
    await page.goto('/profile')
    await expect(page.getByRole('heading', { name: 'Change Password' })).toBeVisible()

    await page.getByPlaceholder('Current password').fill(password)
    await page.getByPlaceholder('New password (min 8 chars)').fill('TempPass123!')
    await page.getByPlaceholder('Confirm new password').fill('DifferentPass123!')
    await page.getByRole('button', { name: 'Update Password' }).click()
    await expect(page.getByText('New passwords do not match.')).toBeVisible()
  })
})
