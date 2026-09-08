import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import PrivateRoute from '../../src/components/PrivateRoute'

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../src/context/AuthContext'

function renderWithAuth(authValue, { path = '/protected', flags = {} } = {}) {
  useAuth.mockReturnValue({
    user: null,
    loading: false,
    isAdmin: false,
    canAccessStaff: false,
    canAccessCitizen: false,
    ...authValue,
  })

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <PrivateRoute {...flags}>
              <div>Protected content</div>
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/staff" element={<div>Staff page</div>} />
        <Route path="/" element={<div>Home page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PrivateRoute', () => {
  it('shows loading while auth resolves', () => {
    renderWithAuth({ loading: true })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to login', () => {
    renderWithAuth({ user: null })
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('adminOnly redirects non-admin staff to staff', () => {
    renderWithAuth(
      {
        user: { role: 'staff' },
        canAccessStaff: true,
      },
      { flags: { adminOnly: true } },
    )
    expect(screen.getByText('Staff page')).toBeInTheDocument()
  })

  it('adminOnly redirects citizen to home', () => {
    renderWithAuth(
      {
        user: { role: 'citizen' },
        canAccessCitizen: true,
      },
      { flags: { adminOnly: true } },
    )
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })

  it('staffOnly redirects citizen to home', () => {
    renderWithAuth(
      {
        user: { role: 'citizen' },
        canAccessCitizen: true,
      },
      { flags: { staffOnly: true } },
    )
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })

  it('citizenOnly redirects staff to staff', () => {
    renderWithAuth(
      {
        user: { role: 'staff' },
        canAccessStaff: true,
      },
      { flags: { citizenOnly: true } },
    )
    expect(screen.getByText('Staff page')).toBeInTheDocument()
  })

  it('allows matching role through', () => {
    renderWithAuth(
      {
        user: { role: 'admin' },
        isAdmin: true,
        canAccessStaff: true,
        canAccessCitizen: true,
      },
      { flags: { adminOnly: true } },
    )
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})
