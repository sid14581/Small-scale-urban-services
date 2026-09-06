import { defineConfig, devices } from '@playwright/test'
import base from './playwright.config.js'

export default defineConfig({
  ...base,
  reporter: [
    ['line'],
    ['html', { open: 'never', outputFolder: 'tests/TestReport/e2e/html' }],
    ['json', { outputFile: 'tests/TestReport/e2e/playwright-results.json' }],
    ['junit', { outputFile: 'tests/TestReport/e2e/playwright-junit.xml' }],
  ],
})
