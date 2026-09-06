import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { listStaff } from '../api/adminStaff'
import { getApiErrorMessage } from '../utils/apiError'

export default function AdminStaffList() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    listStaff()
      .then(({ data }) => setStaff(Array.isArray(data) ? data : data.results || []))
      .catch((err) => setError(getApiErrorMessage(err, 'Failed to load staff list.')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="staff-badge mb-2">Admin Portal</span>
            <h1 className="page-header">Staff Management</h1>
            <p className="page-subtitle">Create and manage staff accounts.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin-portal" className="btn-outline text-sm">
              Dashboard
            </Link>
            <Link to="/admin-portal/staff/new" className="btn-primary text-sm">
              Create staff
            </Link>
          </div>
        </header>

        {loading && <p className="text-muted">Loading...</p>}
        {error && (
          <p className="text-error text-sm mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-surface-variant dark:border-slate-700 text-muted">
                  <th className="py-2 pr-3 font-medium">Username</th>
                  <th className="py-2 pr-3 font-medium">Email</th>
                  <th className="py-2 pr-3 font-medium">Phone</th>
                  <th className="py-2 pr-3 font-medium">Active</th>
                  <th className="py-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-muted text-center">
                      No staff accounts yet.
                    </td>
                  </tr>
                ) : (
                  staff.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-surface-variant/60 dark:border-slate-800"
                    >
                      <td className="py-3 pr-3">
                        <Link
                          to={`/admin-portal/staff/${row.id}`}
                          className="text-link font-medium"
                        >
                          {row.username}
                        </Link>
                      </td>
                      <td className="py-3 pr-3 text-slate-700 dark:text-slate-200">
                        {row.email || '—'}
                      </td>
                      <td className="py-3 pr-3 text-slate-700 dark:text-slate-200">
                        {row.phone || '—'}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={
                            row.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'
                          }
                        >
                          {row.is_active ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-3 text-muted">
                        {row.date_joined ? new Date(row.date_joined).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  )
}
