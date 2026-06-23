import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { getApiErrorMessage } from '../utils/apiError'
import { normalizeExternalUrl } from '../utils/url'

const STATUS_CLASS = {
  open: 'badge-open',
  in_progress: 'badge-in_progress',
  resolved: 'badge-resolved',
}

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
      <main className="max-w-lg mx-auto px-4 py-8 md:py-12">
        <Link to="/staff/complaints" className="text-link text-sm mb-4 inline-block">← Back to complaints</Link>
        {loading && <p className="text-muted">Loading...</p>}
        {error && (
          <div className="card">
            <p className="text-error">{error}</p>
          </div>
        )}
        {complaint && (
          <div className="card">
            <div className="flex items-start justify-between gap-3 mb-4">
              <p className="text-link font-mono text-sm">{complaint.reference_id}</p>
              <span className={STATUS_CLASS[complaint.status] || 'badge'}>{complaint.status_display}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{complaint.complain}</h2>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="p-3 rounded-xl bg-surface-muted dark:bg-slate-800/50">
                <dt className="text-muted text-xs uppercase tracking-wide">Category</dt>
                <dd className="font-medium mt-1">{complaint.category_display}</dd>
              </div>
              <div className="p-3 rounded-xl bg-surface-muted dark:bg-slate-800/50">
                <dt className="text-muted text-xs uppercase tracking-wide">Phone</dt>
                <dd className="mt-1">{complaint.phone}</dd>
              </div>
              <div className="p-3 rounded-xl bg-surface-muted dark:bg-slate-800/50">
                <dt className="text-muted text-xs uppercase tracking-wide">Address</dt>
                <dd className="mt-1">{complaint.address}</dd>
              </div>
              <div className="p-3 rounded-xl bg-surface-muted dark:bg-slate-800/50">
                <dt className="text-muted text-xs uppercase tracking-wide">Area</dt>
                <dd className="mt-1">{complaint.area}</dd>
              </div>
              {driveUrl && (
                <div className="p-3 rounded-xl bg-surface-muted dark:bg-slate-800/50">
                  <dt className="text-muted text-xs uppercase tracking-wide">Google Drive Link</dt>
                  <dd className="mt-1">
                    <a
                      href={driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link break-all"
                    >
                      {complaint.link}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <label className="text-sm text-muted font-medium">Update Status</label>
              <select className="input mt-2" value={status} onChange={(e) => setStatus(e.target.value)}>
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
