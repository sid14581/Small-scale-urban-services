import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { getApiErrorMessage } from '../utils/apiError'
import { normalizeExternalUrl } from '../utils/url'

export default function ComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    api.get(`/complaints/${id}/`)
      .then(({ data }) => {
        setComplaint(data)
        setStatus(data.status)
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setError('Complaint not found.')
        } else {
          setError(getApiErrorMessage(err, 'Failed to load complaint.'))
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleUpdate = async () => {
    setUpdateError('')
    setSaving(true)
    try {
      await api.patch(`/complaints/${id}/status/`, { status })
      navigate('/staff/complaints')
    } catch (err) {
      setUpdateError(getApiErrorMessage(err, 'Failed to update status.'))
    } finally {
      setSaving(false)
    }
  }

  const driveUrl = complaint?.link ? normalizeExternalUrl(complaint.link) : ''

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8">
        {loading && <p className="text-muted">Loading...</p>}
        {error && (
          <div className="card">
            <p className="text-error">{error}</p>
          </div>
        )}
        {complaint && (
          <div className="card">
            <p className="text-link font-mono">{complaint.reference_id}</p>
            <h2 className="text-2xl font-bold mt-2">{complaint.complain}</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-muted">Category</dt><dd>{complaint.category_display}</dd></div>
              <div><dt className="text-muted">Phone</dt><dd>{complaint.phone}</dd></div>
              <div><dt className="text-muted">Address</dt><dd>{complaint.address}</dd></div>
              <div><dt className="text-muted">Area</dt><dd>{complaint.area}</dd></div>
              {driveUrl && (
                <div>
                  <dt className="text-muted">Google Drive Link</dt>
                  <dd>
                    <a
                      href={driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link underline break-all"
                    >
                      {complaint.link}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-6">
              <label className="text-sm text-muted">Update Status</label>
              <select className="input mt-1" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              {updateError && <p className="text-error text-sm mt-2">{updateError}</p>}
              <button onClick={handleUpdate} disabled={saving} className="btn-primary w-full mt-4">
                {saving ? 'Saving...' : 'Save Status'}
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
