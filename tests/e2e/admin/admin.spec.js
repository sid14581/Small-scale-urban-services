import { expect } from '@playwright/test'
import { roleTest } from '../helpers/fixtures.js'
import { uniqueSuffix } from '../helpers/env.js'

const test = roleTest('admin')

test.describe('Admin flows', () => {
  test('admin portal dashboard', async ({ page }) => {
    await page.goto('/admin-portal')
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: 'Staff management' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Audit logs' })).toBeVisible()
  })

  test('staff CRUD create + edit', async ({ page }) => {
    const suffix = uniqueSuffix()
    const username = `e2e_staff_${suffix}`.slice(0, 30)

    await page.goto('/admin-portal/staff')
    await expect(page.getByRole('heading', { name: 'Staff Management' })).toBeVisible({ timeout: 15000 })
    await page.getByRole('link', { name: 'Create staff' }).click()

    await page.getByLabel('Username').fill(username)
    await page.getByLabel('Email').fill(`${username}@example.com`)
    await page.getByLabel('First name').fill('E2E Staff')
    await page.getByLabel('Phone (E.164)').fill('+1555987' + String(Date.now()).slice(-4))
    await page.locator('#create-password').fill('StaffTemp1!')
    await page.getByRole('button', { name: 'Create staff' }).click()

    await expect(page.getByRole('heading', { name: 'Credentials created' })).toBeVisible({
      timeout: 20000,
    })
    await page.getByRole('link', { name: 'View staff' }).click()

    await expect(page.getByRole('heading', { name: 'Edit Staff' })).toBeVisible({ timeout: 15000 })
    await page.getByLabel('First name').fill('E2E Staff Updated')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Staff account updated.')).toBeVisible({ timeout: 15000 })

    await page.goto('/admin-portal/staff')
    await expect(page.getByRole('link', { name: username })).toBeVisible({ timeout: 15000 })
  })

  test('audit logs page loads and filters', async ({ page }) => {
    await page.goto('/admin-portal/audit-logs')
    await expect(page.getByRole('heading', { name: 'Audit Logs' })).toBeVisible({ timeout: 15000 })
    await page.getByLabel('Event type').selectOption('login_failed')
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(
      page.getByText('No audit events found.').or(page.locator('table tbody tr').first()),
    ).toBeVisible({ timeout: 15000 })
  })
})
