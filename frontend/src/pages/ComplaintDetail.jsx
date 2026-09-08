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
    api
      .get(`/complaints/${id}/`)
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
      const { data } = await api.patch(`/complaints/${id}/status/`, { status })
      setComplaint(data)
      setStatus(data.status)
    } catch (err) {
      setUpdateError(getApiErrorMessage(err, 'Failed to update status.'))
    } finally {
      setSaving(false)
    }
  }

  const driveUrl = complaint?.link ? normalizeExternalUrl(complaint.link) : ''
  const dirty = complaint && status !== complaint.status

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <Link to="/staff/complaints" className="text-link text-sm mb-4 inline-block">
          ← Back to complaints
        </Link>
        {loading && <p className="text-muted">Loading...</p>}
        {error && (
          <div className="border border-red-200 dark:border-red-900 rounded-2xl p-4 bg-red-50 dark:bg-red-900/20">
            <p className="text-error" role="alert">
              {error}
            </p>
          </div>
        )}
        {complaint && (
          <div className="grid md:grid-cols-[1fr_16rem] gap-6 items-start">
            <article className="space-y-5">
              <header className="space-y-3">
                <span className="staff-badge">Status workspace</span>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-mono text-sm text-primary dark:text-primary-light">
                    {complaint.reference_id}
                  </p>
                  <span className={STATUS_CLASS[complaint.status] || 'badge'}>
                    {complaint.status_display}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-snug">
                  {complaint.complain}
                </h1>
              </header>

              <dl className="border border-surface-variant dark:border-slate-700 rounded-2xl divide-y divide-surface-variant dark:divide-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                {[
                  ['Category', complaint.category_display],
                  ['Phone', complaint.phone],
                  ['Address', complaint.address],
                  ['Area', complaint.area],
                  ['Submitted', new Date(complaint.created_at).toLocaleString()],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="px-4 py-3 grid sm:grid-cols-[8rem_1fr] gap-1 sm:gap-3 text-sm"
                  >
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-medium text-slate-900 dark:text-slate-100">{value}</dd>
                  </div>
                ))}
                {driveUrl && (
                  <div className="px-4 py-3 grid sm:grid-cols-[8rem_1fr] gap-1 sm:gap-3 text-sm">
                    <dt className="text-muted">Drive link</dt>
                    <dd>
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
            </article>

            <aside className="border border-surface-variant dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-900 sticky top-20 space-y-4">
              <h2 className="font-semibold text-slate-900 dark:text-white">Update status</h2>
              <p className="text-muted text-xs">
                Open → In Progress → Resolved. Invalid jumps are rejected by the API.
              </p>
              <div>
                <label
                  className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  htmlFor="detail-status"
                >
                  Status
                </label>
                <select
                  id="detail-status"
                  className="input mt-1"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              {updateError && (
                <p className="text-error text-sm" role="alert">
                  {updateError}
                </p>
              )}
              <button
                type="button"
                onClick={handleUpdate}
                disabled={saving || !dirty}
                className="btn-primary w-full"
              >
                {saving ? 'Saving...' : dirty ? 'Save status' : 'No changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/staff/complaints')}
                className="btn-outline w-full text-sm"
              >
                Back to list
              </button>
            </aside>
          </div>
        )}
      </main>
    </>
  )
}
