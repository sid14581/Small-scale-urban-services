import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { getApiErrorMessage } from '../utils/apiError'
import { normalizeExternalUrl } from '../utils/url'

const STATUS_CLASS = {
  open: 'badge-open',
  in_progress: 'badge-in_progress',
  resolved: 'badge-resolved',
}

export default function MyComplaintDetail() {
  const { id } = useParams()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api
      .get(`/complaints/${id}/`)
      .then(({ data }) => setComplaint(data))
      .catch((err) => {
        if (err.response?.status === 404) {
          setError('Complaint not found.')
        } else {
          setError(getApiErrorMessage(err, 'Failed to load complaint.'))
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const driveUrl = complaint?.link ? normalizeExternalUrl(complaint.link) : ''

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8 md:py-12">
        <Link to="/my-complaints" className="text-link text-sm mb-4 inline-block">
          ← Back to my complaints
        </Link>
        {loading && <p className="text-muted">Loading...</p>}
        {error && (
          <div className="card">
            <p className="text-error" role="alert">
              {error}
            </p>
          </div>
        )}
        {complaint && (
          <article className="space-y-4">
            <header className="space-y-3">
              <p className="text-primary font-bold text-xs uppercase tracking-[0.18em]">SCMS</p>
              <div className="flex items-start justify-between gap-3">
                <p className="font-mono text-sm text-primary dark:text-primary-light">
                  {complaint.reference_id}
                </p>
                <span className={STATUS_CLASS[complaint.status] || 'badge'}>
                  {complaint.status_display}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-snug">
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
                <div key={label} className="px-4 py-3 grid grid-cols-[7rem_1fr] gap-3 text-sm">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-100">{value}</dd>
                </div>
              ))}
              {driveUrl && (
                <div className="px-4 py-3 grid grid-cols-[7rem_1fr] gap-3 text-sm">
                  <dt className="text-muted">Attachment</dt>
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
            <p className="text-muted text-sm">
              Status updates appear here after staff review. Keep your reference ID for phone
              follow-up.
            </p>
          </article>
        )}
      </main>
    </>
  )
}
