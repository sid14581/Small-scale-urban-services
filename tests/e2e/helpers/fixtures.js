import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test as base, request as playwrightRequest } from '@playwright/test'
import { BASE_URL, hasCreds } from './env.js'

const AUTH_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.auth')

export function authFile(role) {
  return path.join(AUTH_DIR, `${role}.json`)
}

/**
 * Role-scoped test that uses storageState from auth.setup.js.
 */
export function roleTest(role) {
  return base.extend({
    storageState: async ({}, use, testInfo) => {
      if (!hasCreds(role)) {
        testInfo.skip(true, `Set E2E credentials for "${role}" in .env.e2e`)
      }
      await use(authFile(role))
    },
  })
}

/** API client for another role without touching the page's cookies / rate limit. */
export async function apiAs(role) {
  if (!hasCreds(role)) {
    throw new Error(`Missing credentials for ${role}`)
  }
  return playwrightRequest.newContext({
    baseURL: BASE_URL,
    storageState: authFile(role),
  })
}
