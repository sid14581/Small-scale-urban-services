import { describe, expect, it } from 'vitest'
import { getDefaultRoute, getRoleFlags } from '../../src/utils/roles'

describe('getDefaultRoute', () => {
  it('routes admin to admin-portal', () => {
    expect(getDefaultRoute({ role: 'admin' })).toBe('/admin-portal')
  })

  it('routes staff to staff', () => {
    expect(getDefaultRoute({ role: 'staff' })).toBe('/staff')
  })

  it('routes citizen to home', () => {
    expect(getDefaultRoute({ role: 'citizen' })).toBe('/')
  })

  it('routes missing user to login', () => {
    expect(getDefaultRoute(null)).toBe('/login')
  })
})

describe('getRoleFlags', () => {
  it('flags admin access', () => {
    expect(getRoleFlags({ role: 'admin' })).toMatchObject({
      isAdmin: true,
      isStaff: false,
      isCitizen: false,
      canAccessStaff: true,
      canAccessCitizen: true,
    })
  })

  it('flags staff access', () => {
    expect(getRoleFlags({ role: 'staff' })).toMatchObject({
      isAdmin: false,
      isStaff: true,
      canAccessStaff: true,
      canAccessCitizen: false,
    })
  })

  it('flags citizen access', () => {
    expect(getRoleFlags({ role: 'citizen' })).toMatchObject({
      isCitizen: true,
      canAccessStaff: false,
      canAccessCitizen: true,
    })
  })
})
