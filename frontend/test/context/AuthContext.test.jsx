import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../src/context/AuthContext'

vi.mock('../../src/api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

vi.mock('../../src/config/authBypass', () => ({
  AUTH_BYPASS: 'off',
  getInitialMockRole: () => 'citizen',
  getMockUser: () => ({ role: 'citizen' }),
  isMockAuthBypass: () => false,
}))

import api from '../../src/api/axios'

function Probe({ onReady }) {
  const auth = useAuth()
  if (!auth.loading) onReady(auth)
  return null
}

describe('AuthContext password helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: null })
  })

  it('changePassword posts to password change endpoint', async () => {
    api.get.mockResolvedValue({
      data: { id: 1, username: 'citizen', role: 'citizen' },
    })
    api.post.mockResolvedValue({ data: { detail: 'Password updated.' } })

    let authApi
    render(
      <AuthProvider>
        <Probe
          onReady={(auth) => {
            authApi = auth
          }}
        />
      </AuthProvider>,
    )

    await waitFor(() => expect(authApi).toBeTruthy())
    await authApi.changePassword({
      current_password: 'Pass12345',
      new_password: 'NewPass99',
      new_password_confirm: 'NewPass99',
    })

    expect(api.post).toHaveBeenCalledWith('/auth/password/change/', {
      current_password: 'Pass12345',
      new_password: 'NewPass99',
      new_password_confirm: 'NewPass99',
    })
  })

  it('forgotPassword posts channel payload and returns otp_session', async () => {
    api.get.mockResolvedValue({ data: null })
    api.post.mockResolvedValue({ data: { otp_session: 'sess-abc' } })

    let authApi
    render(
      <AuthProvider>
        <Probe
          onReady={(auth) => {
            authApi = auth
          }}
        />
      </AuthProvider>,
    )

    await waitFor(() => expect(authApi).toBeTruthy())
    const session = await authApi.forgotPassword({
      username: 'citizen',
      channel: 'email',
    })

    expect(session).toBe('sess-abc')
    expect(api.post).toHaveBeenCalledWith('/auth/password/forgot/', {
      channel: 'email',
      username: 'citizen',
    })
  })

  it('resetPassword posts otp payload', async () => {
    api.get.mockResolvedValue({ data: null })
    api.post.mockResolvedValue({ data: { detail: 'Password has been reset. You can log in now.' } })

    let authApi
    render(
      <AuthProvider>
        <Probe
          onReady={(auth) => {
            authApi = auth
          }}
        />
      </AuthProvider>,
    )

    await waitFor(() => expect(authApi).toBeTruthy())
    await authApi.resetPassword({
      otp_session: 'sess-abc',
      code: '123456',
      new_password: 'ResetPass1',
      new_password_confirm: 'ResetPass1',
    })

    expect(api.post).toHaveBeenCalledWith('/auth/password/reset/', {
      otp_session: 'sess-abc',
      code: '123456',
      new_password: 'ResetPass1',
      new_password_confirm: 'ResetPass1',
    })
  })
})
