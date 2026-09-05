import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ForgotPassword from '../../src/pages/ForgotPassword'

vi.mock('../../src/components/Navbar', () => ({
  default: () => <nav>Navbar</nav>,
}))

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../src/context/AuthContext'

describe('ForgotPassword', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      forgotPassword: vi.fn().mockResolvedValue('otp-session-1'),
    })
  })

  it('renders Email and SMS channel options', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    )
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('SMS')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset code/i })).toBeInTheDocument()
  })

  it('submits with selected SMS channel', async () => {
    const user = userEvent.setup()
    const forgotPassword = vi.fn().mockResolvedValue('otp-session-1')
    useAuth.mockReturnValue({ forgotPassword })

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText(/username or email/i), 'citizen')
    await user.click(screen.getByText('SMS'))
    await user.click(screen.getByRole('button', { name: /send reset code/i }))

    expect(forgotPassword).toHaveBeenCalledWith({
      channel: 'sms',
      username: 'citizen',
    })
  })
})
