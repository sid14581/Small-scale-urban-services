import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { getApiErrorMessage } from '../utils/apiError'

const HUB_LINKS = [
  {
    to: '/admin-portal/staff',
    title: 'Staff management',
    description: 'Create, update, and reset credentials for staff accounts.',
  },
  {
    to: '/staff',
    title: 'Staff dashboard',
    description: 'Review complaint volume, status, and staff workflows.',
  },
  {
    to: '/admin-portal/audit-logs',
    title: 'Audit logs',
    description: 'Inspect authentication and password-reset audit events.',
  },
  {
    to: '/',
    title: 'Citizen home',
    description: 'Browse service categories and citizen complaint pages.',
  },
]

export default function AdminPortal() {
  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setStatsError('')
    api.get('/stats/')
      .then(({ data }) => setStats(data))
      .catch((err) => setStatsError(getApiErrorMessage(err, 'Failed to load stats.')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-8">
          <span className="staff-badge mb-2">Admin Portal</span>
          <h1 className="page-header">Admin Dashboard</h1>
          <p className="page-subtitle">
            System overview, staff management, and operational shortcuts.
          </p>
        </header>

        {loading && <p className="text-muted mb-6">Loading stats...</p>}
        {statsError && (
          <p className="text-error text-sm mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-900/20" role="alert">
            {statsError}
          </p>
        )}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {[
              ['Total', stats.total, 'stat-total'],
              ['Open', stats.open, 'text-amber-600 dark:text-amber-400'],
              ['In Progress', stats.in_progress, 'text-sky-600 dark:text-sky-400'],
              ['Resolved', stats.resolved, 'text-emerald-600 dark:text-emerald-400'],
            ].map(([label, val, color]) => (
              <div
                key={label}
                className="rounded-2xl border border-surface-variant dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-5 text-center"
              >
                <p className={`text-3xl font-bold ${color}`}>{val}</p>
                <p className="text-muted text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          {HUB_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block rounded-2xl border border-surface-variant dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-4 hover:border-primary/40 transition-colors"
            >
              <h2 className="font-semibold text-slate-900 dark:text-white mb-1">{item.title}</h2>
              <p className="text-muted text-sm">{item.description}</p>
              <span className="text-link text-sm font-medium mt-3 inline-block">Open →</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
