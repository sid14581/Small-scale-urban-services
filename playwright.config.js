import { defineConfig, devices } from '@playwright/test'
import { isHeadedRequested } from './tests/e2e/helpers/env.js'

/**
 * E2E against the compose stack (nginx → frontend/backend) on port 8080.
 * Assumes `docker compose up` (or equivalent) is already running — no webServer.
 * Credentials: copy `.env.e2e.example` → `.env.e2e` (gitignored).
 *
 * Auth setup uses the real login + OTP UI (headed locally) and saves storageState.
 * OTP: E2E_OTP → page.pause() in headed mode → readline. See tests/e2e/helpers/auth.js.
 */
const headed = isHeadedRequested()
// Auth setup is headed outside CI so page.pause() works for OTP entry.
const setupHeaded = !process.env.CI || headed

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    headless: headed ? false : undefined,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
      timeout: 5 * 60_000,
      use: {
        ...devices['Desktop Chrome'],
        headless: setupHeaded ? false : true,
      },
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.js/,
      use: {
        ...devices['Desktop Chrome'],
        headless: headed ? false : undefined,
      },
    },
  ],
})
