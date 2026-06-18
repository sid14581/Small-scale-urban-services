import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import {
  AUTH_BYPASS,
  getInitialMockRole,
  getMockUser,
  isMockAuthBypass,
} from '../config/authBypass'
import { getDefaultRoute, getRoleFlags } from '../utils/roles'

const AuthContext = createContext(null)

export { getDefaultRoute }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile/')
      setUser(data)
      return data
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  const loginInit = async (username, password) => {
    const { data } = await api.post('/auth/login/init/', { username, password })
    return data.otp_session
  }

  const registerInit = async (formData) => {
    const { password_confirm, ...payload } = formData
    const { data } = await api.post('/auth/register/init/', { ...payload, password_confirm })
    return data.otp_session
  }

  const verifyOtp = async (otpSession, code) => {
    await api.post('/auth/otp/verify/', { otp_session: otpSession, code })
    return fetchProfile()
  }

  const login = async (username, password) => {
    const session = await loginInit(username, password)
    throw Object.assign(new Error('OTP required'), { otpSession: session })
  }

  const switchBypassRole = async (role) => {
    if (isMockAuthBypass()) {
      setUser(getMockUser(role))
      return
    }
    if (AUTH_BYPASS === 'citizen' || AUTH_BYPASS === 'staff') {
      setLoading(true)
      try {
        await api.post('/auth/login/', { username: role, password: 'demo1234' })
        await fetchProfile()
      } catch {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const init = async () => {
      if (isMockAuthBypass()) {
        setUser(getMockUser(getInitialMockRole()))
        setLoading(false)
        return
      }
      if (AUTH_BYPASS === 'citizen' || AUTH_BYPASS === 'staff') {
        try {
          await api.post('/auth/login/', { username: AUTH_BYPASS, password: 'demo1234' })
          await fetchProfile()
        } catch {
          setLoading(false)
        }
        return
      }
      await fetchProfile()
    }
    init()
  }, [])

  const register = async (formData) => {
    const session = await registerInit(formData)
    throw Object.assign(new Error('OTP required'), { otpSession: session })
  }

  const logout = async () => {
    if (!isMockAuthBypass()) {
      try {
        await api.post('/auth/logout/')
      } catch {
        // ignore logout errors
      }
    }
    setUser(null)
  }

  const updateProfile = async (data) => {
    const { data: updated } = await api.patch('/auth/profile/', data)
    setUser(updated)
    return updated
  }

  const roleFlags = useMemo(() => getRoleFlags(user), [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginInit,
        register,
        registerInit,
        verifyOtp,
        logout,
        updateProfile,
        switchBypassRole,
        authBypassMode: AUTH_BYPASS,
        ...roleFlags,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
