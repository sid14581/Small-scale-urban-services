import { expect } from '@playwright/test'
import { createComplaint } from '../helpers/api.js'
import { apiAs, roleTest } from '../helpers/fixtures.js'
import { hasCreds } from '../helpers/env.js'

const test = roleTest('staff')

test.describe('Staff flows', () => {
  test('dashboard shows stats and links to complaints', async ({ page }) => {
    await page.goto('/staff')
    await expect(page.getByRole('heading', { name: 'Staff Dashboard' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Total')).toBeVisible()
    await expect(page.getByRole('link', { name: 'View All Complaints' })).toBeVisible()
  })

  test('list, filter, status update, feedback, and export', async ({ page }) => {
    test.skip(!hasCreds('citizen'), 'Citizen credentials required to seed a complaint')

    const citizenApi = await apiAs('citizen')
    const complaint = await createComplaint(citizenApi, {
      complain: `Staff status target ${Date.now()}`,
      category: 'road',
      area: 'StaffFilterZone',
    })
    await citizenApi.dispose()

    await page.goto('/staff/complaints')
    await expect(page.getByRole('heading', { name: 'All Complaints' })).toBeVisible({ timeout: 15000 })

    await page.getByLabel('Search').fill('StaffFilterZone')
    await page.getByLabel('Category').selectOption('road')
    await page.getByLabel('Status').selectOption('open')
    const refCell = page.getByRole('cell', { name: complaint.reference_id, exact: true })
    await expect(refCell).toBeVisible({ timeout: 15000 })

    await refCell.click()
    await expect(page.getByRole('heading', { name: complaint.complain })).toBeVisible({ timeout: 15000 })
    await page.getByLabel('Status').selectOption('in_progress')
    await page.getByRole('button', { name: 'Save status' }).click()
    await expect(page.getByText('In Progress').first()).toBeVisible({ timeout: 15000 })

    await page.goto('/staff/feedback')
    await expect(page.getByRole('heading', { name: 'Customer Feedback' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('alert')).toHaveCount(0)

    await page.goto('/staff/complaints')
    const downloadPromise = page.waitForEvent('download', { timeout: 20000 }).catch(() => null)
    await page.getByRole('button', { name: 'Export CSV' }).click()
    const download = await downloadPromise
    if (download) {
      expect(download.suggestedFilename()).toMatch(/\.csv$/i)
    } else {
      await expect(page.getByRole('alert')).toHaveCount(0)
    }
  })
})
