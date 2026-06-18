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
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Staff Dashboard</h1>
        {loading && <p className="text-muted">Loading...</p>}
        {error && <p className="text-error text-sm mb-4">{error}</p>}
        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                ['Total', stats.total, 'stat-total'],
                ['Open', stats.open, 'text-yellow-400'],
                ['In Progress', stats.in_progress, 'text-blue-400'],
                ['Resolved', stats.resolved, 'text-green-400'],
              ].map(([label, val, color]) => (
                <div key={label} className="card text-center">
                  <p className={`text-3xl font-bold ${color}`}>{val}</p>
                  <p className="text-muted text-sm">{label}</p>
                </div>
              ))}
            </div>
            <div className="card mb-6">
              <h2 className="font-semibold mb-4">By Category</h2>
              <div className="grid grid-cols-2 gap-2">
                {stats.by_category.map((c) => (
                  <Link key={c.category} to={`/staff/complaints?category=${c.category}`}
                    className="flex justify-between p-2 rounded hover:bg-slate-700">
                    <span>{c.label}</span>
                    <span className="text-link">{c.count}</span>
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
