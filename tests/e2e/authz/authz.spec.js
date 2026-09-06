import { test, expect } from '@playwright/test'
import { createComplaint, getComplaint } from '../helpers/api.js'
import { apiAs, roleTest } from '../helpers/fixtures.js'
import { hasCreds } from '../helpers/env.js'

const citizenTest = roleTest('citizen')
const staffTest = roleTest('staff')

test.describe('Authorization negatives', () => {
  test('unauthenticated users are sent to login', async ({ page }) => {
    await page.goto('/my-complaints')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
    await page.goto('/staff')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
    await page.goto('/admin-portal')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  })

  citizenTest('citizen blocked from staff and admin routes', async ({ page }) => {
    await page.goto('/staff')
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 })
    await expect(page.getByRole('heading', { name: /Report urban service issues/i })).toBeVisible()

    await page.goto('/admin-portal')
    await expect(page).not.toHaveURL(/\/admin-portal/, { timeout: 15000 })
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 })

    await page.goto('/staff/complaints')
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 })
  })

  staffTest('staff blocked from admin-only routes', async ({ page }) => {
    await page.goto('/admin-portal')
    await expect(page).toHaveURL(/\/staff\/?$/, { timeout: 15000 })

    await page.goto('/admin-portal/staff')
    await expect(page).toHaveURL(/\/staff\/?$/, { timeout: 15000 })

    await page.goto('/admin-portal/audit-logs')
    await expect(page).toHaveURL(/\/staff\/?$/, { timeout: 15000 })
  })

  citizenTest('citizen cannot open another user complaint', async ({ page }) => {
    test.skip(!hasCreds('admin'), 'Admin credentials required to create a foreign complaint')

    const adminApi = await apiAs('admin')
    const foreign = await createComplaint(adminApi, {
      complain: `Foreign complaint ${Date.now()}`,
      area: 'AuthzZone',
    })
    await adminApi.dispose()

    const apiRes = await getComplaint(page.request, foreign.id)
    expect([403, 404]).toContain(apiRes.status())

    await page.goto(`/my-complaints/${foreign.id}`)
    await expect(page.getByText(/Complaint not found|Failed to load complaint/i)).toBeVisible({
      timeout: 15000,
    })
  })
})
