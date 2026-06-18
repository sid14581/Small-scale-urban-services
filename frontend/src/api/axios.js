import axios from 'axios'
import { isMockAuthBypass } from '../config/authBypass'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
const MAX_RETRIES = 1

const PUBLIC_PATHS = ['/', '/login', '/register']
const AUTH_PROBE_PATHS = ['/auth/profile/', '/auth/login/', '/auth/register/']

function shouldRedirectToLogin(config) {
  if (PUBLIC_PATHS.includes(window.location.pathname)) return false
  const url = config?.url || ''
  return !AUTH_PROBE_PATHS.some((path) => url.includes(path))
}

const api = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  if (isMockAuthBypass()) {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const retryCount = original._retryCount || 0

    if (
      error.response?.status === 401
      && !original._retry
      && retryCount < MAX_RETRIES
      && !isMockAuthBypass()
    ) {
      original._retry = true
      original._retryCount = retryCount + 1
      try {
        await axios.post(`${baseURL}/auth/refresh/`, {}, { withCredentials: true, timeout: 30000 })
        return api(original)
      } catch {
        if (shouldRedirectToLogin(original)) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api
