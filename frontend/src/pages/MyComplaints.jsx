import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { getApiErrorMessage } from '../utils/apiError'

const STATUS_CLASS = {
  open: 'badge-open',
  in_progress: 'badge-in_progress',
  resolved: 'badge-resolved',
}

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api.get('/complaints/')
      .then(({ data }) => setComplaints(data.results || data))
      .catch((err) => setError(getApiErrorMessage(err, 'Failed to load complaints.')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-primary font-bold text-xs uppercase tracking-[0.18em] mb-2">SCMS</p>
            <h1 className="page-header">My Complaints</h1>
            <p className="page-subtitle">Track the status of your submitted reports.</p>
          </div>
          <Link to="/" className="btn-primary text-sm">Report an issue</Link>
        </header>
        {loading && <p className="text-muted">Loading...</p>}
        {error && <p className="text-error text-sm mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20" role="alert">{error}</p>}
        {!loading && !error && complaints.length === 0 && (
          <div className="border border-dashed border-surface-variant dark:border-slate-700 rounded-2xl px-6 py-14 text-center bg-surface-muted/40 dark:bg-slate-900/40">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No complaints yet</h2>
            <p className="text-muted text-sm mb-6 max-w-md mx-auto">
              When you report an urban service issue, it will appear here with a reference ID and status.
            </p>
            <Link to="/" className="btn-primary">Browse categories</Link>
          </div>
        )}
        {!loading && !error && complaints.length > 0 && (
          <ul className="divide-y divide-surface-variant dark:divide-slate-800 border border-surface-variant dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            {complaints.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/my-complaints/${c.id}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-4 hover:bg-surface-muted/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span className="font-mono text-sm text-primary dark:text-primary-light shrink-0">
                    {c.reference_id}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium text-slate-900 dark:text-white truncate">
                      {c.complain}
                    </span>
                    <span className="text-muted text-sm">
                      {c.category_display} · {c.area}
                    </span>
                  </span>
                  <span className={`${STATUS_CLASS[c.status] || 'badge'} shrink-0`}>
                    {c.status_display}
                  </span>
                  <span className="text-muted text-xs sm:text-sm shrink-0">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
