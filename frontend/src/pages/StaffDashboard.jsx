import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { getApiErrorMessage } from '../utils/apiError'

export default function StaffDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api.get('/stats/')
      .then(({ data }) => setStats(data))
      .catch((err) => setError(getApiErrorMessage(err, 'Failed to load dashboard stats.')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="staff-badge mb-2">Staff Portal</span>
            <h1 className="page-header">Staff Dashboard</h1>
            <p className="page-subtitle">Overview of complaint volume and status.</p>
          </div>
        </header>
        {loading && <p className="text-muted">Loading...</p>}
        {error && <p className="text-error text-sm mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">{error}</p>}
        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                ['Total', stats.total, 'stat-total'],
                ['Open', stats.open, 'text-amber-600 dark:text-amber-400'],
                ['In Progress', stats.in_progress, 'text-sky-600 dark:text-sky-400'],
                ['Resolved', stats.resolved, 'text-emerald-600 dark:text-emerald-400'],
              ].map(([label, val, color]) => (
                <div key={label} className="card text-center">
                  <p className={`text-3xl font-bold ${color}`}>{val}</p>
                  <p className="text-muted text-sm mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="card mb-6">
              <h2 className="font-semibold mb-4 text-slate-900 dark:text-white">By Category</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {stats.by_category.map((c) => (
                  <Link key={c.category} to={`/staff/complaints?category=${c.category}`}
                    className="flex justify-between items-center p-3 rounded-xl hover:bg-surface-muted dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-primary/20">
                    <span className="text-slate-700 dark:text-slate-200">{c.label}</span>
                    <span className="text-link font-semibold">{c.count}</span>
                  </Link>
                ))}
              </div>
            </div>
            <Link to="/staff/complaints" className="btn-primary">View All Complaints</Link>
          </>
        )}
      </main>
    </>
  )
}
