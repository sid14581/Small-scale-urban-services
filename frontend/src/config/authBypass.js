export const AUTH_BYPASS = import.meta.env.VITE_AUTH_BYPASS || 'off'

export const isAuthBypass = () => AUTH_BYPASS !== 'off'

export const isMockAuthBypass = () =>
  AUTH_BYPASS === 'mock' || AUTH_BYPASS === 'mock-staff'

export const MOCK_USERS = {
  citizen: {
    id: 0,
    username: 'citizen',
    email: 'citizen@demo.com',
    first_name: 'Demo',
    role: 'citizen',
  },
  staff: {
    id: 0,
    username: 'staff',
    email: 'staff@demo.com',
    first_name: 'Demo',
    role: 'staff',
  },
}

export const getMockUser = (role) =>
  MOCK_USERS[role === 'staff' ? 'staff' : 'citizen']

export const getInitialMockRole = () =>
  AUTH_BYPASS === 'mock-staff' ? 'staff' : 'citizen'

export const canSwitchBypassRole = () =>
  isMockAuthBypass() || AUTH_BYPASS === 'citizen' || AUTH_BYPASS === 'staff'
