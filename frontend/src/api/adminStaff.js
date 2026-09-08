import api from './axios'

export function listStaff() {
  return api.get('/admin/staff/')
}

export function createStaff(payload) {
  return api.post('/admin/staff/', payload)
}

export function getStaff(id) {
  return api.get(`/admin/staff/${id}/`)
}

export function updateStaff(id, payload) {
  return api.patch(`/admin/staff/${id}/`, payload)
}

export function resetStaffCredentials(id, payload = {}) {
  return api.post(`/admin/staff/${id}/reset-credentials/`, payload)
}
