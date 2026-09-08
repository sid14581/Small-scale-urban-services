/**
 * Authenticated API helpers. Pass Playwright `APIRequestContext` (`page.request` or standalone).
 */

export async function createComplaint(request, payload = {}) {
  const body = {
    category: 'waste',
    complain: payload.complain || `E2E complaint ${Date.now()}`,
    phone: payload.phone || '+15551234567',
    address: payload.address || '100 Test Street',
    area: payload.area || 'E2E Area',
    link: payload.link || '',
    ...payload,
  }
  const response = await request.post('/api/complaints/', { data: body })
  if (!response.ok()) {
    throw new Error(`createComplaint failed (${response.status()}): ${await response.text()}`)
  }
  return response.json()
}

export async function createFeedback(request, payload = {}) {
  const body = {
    problem: payload.problem || 'E2E feedback',
    comment: payload.comment || `Automated feedback ${Date.now()}`,
  }
  const response = await request.post('/api/feedback/', { data: body })
  if (!response.ok()) {
    throw new Error(`createFeedback failed (${response.status()}): ${await response.text()}`)
  }
  return response.json()
}

export async function listComplaints(request, params = {}) {
  const response = await request.get('/api/complaints/', { params })
  if (!response.ok()) {
    throw new Error(`listComplaints failed (${response.status()}): ${await response.text()}`)
  }
  const data = await response.json()
  return data.results || data
}

export async function getComplaint(request, id) {
  return request.get(`/api/complaints/${id}/`)
}

export async function createStaff(request, payload) {
  const response = await request.post('/api/admin/staff/', { data: payload })
  if (!response.ok()) {
    throw new Error(`createStaff failed (${response.status()}): ${await response.text()}`)
  }
  return response.json()
}
