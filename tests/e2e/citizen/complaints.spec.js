import { expect } from '@playwright/test'
import { createComplaint } from '../helpers/api.js'
import { roleTest } from '../helpers/fixtures.js'
import { uniqueSuffix } from '../helpers/env.js'

const test = roleTest('citizen')

test.describe('Citizen complaints', () => {
  test('dashboard categories and create + view + track complaint', async ({ page }) => {
    await page.goto('/complaints/new/waste')
    await expect(page.getByRole('heading', { name: 'Waste Management' })).toBeVisible({ timeout: 15000 })

    const desc = `E2E waste issue ${uniqueSuffix()}`
    await page.getByLabel('Description').fill(desc)
    await page.getByLabel('Phone number').fill('+15551234567')
    await page.getByLabel('Address').fill('42 Civic Ave')
    await page.getByLabel('Area / locality').fill('Downtown')
    await page.getByRole('button', { name: 'Submit Complaint' }).click()

    await expect(page.getByRole('heading', { name: 'Complaint submitted' })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByText('Reference ID', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'View my complaints' }).click()

    await expect(page.getByRole('heading', { name: 'My Complaints' })).toBeVisible()
    await expect(page.getByText(desc)).toBeVisible({ timeout: 15000 })
    await page.getByText(desc).click()
    await expect(page.getByText(desc)).toBeVisible()
    await expect(page.getByText('Downtown')).toBeVisible()
  })

  test('my complaints list shows API-created complaint', async ({ page }) => {
    const complaint = await createComplaint(page.request, {
      complain: `API track ${uniqueSuffix()}`,
      area: 'TrackArea',
    })
    await page.goto('/my-complaints')
    await expect(page.getByText(complaint.reference_id)).toBeVisible({ timeout: 15000 })
    await page.goto(`/my-complaints/${complaint.id}`)
    await expect(page.getByText(complaint.complain)).toBeVisible()
  })
})
