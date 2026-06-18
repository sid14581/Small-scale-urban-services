export function getApiErrorMessage(err, fallback = 'Request failed. Please try again.') {
  if (!err.response) {
    return 'Cannot reach server. Is the backend running? (docker compose up)'
  }
  if (err.response.status === 502 || err.response.status >= 500) {
    return 'Server error. Check: docker compose logs backend'
  }
  const data = err.response.data
  if (typeof data === 'string' && data.includes('Bad Gateway')) {
    return 'Server error. Check: docker compose logs backend'
  }
  if (typeof data === 'object' && data !== null) {
    if (typeof data.detail === 'string') return data.detail
    const parts = Object.entries(data).map(([key, value]) => {
      if (Array.isArray(value)) return `${key}: ${value.join(', ')}`
      return `${key}: ${value}`
    })
    if (parts.length) return parts.join(' | ')
  }
  return fallback
}
