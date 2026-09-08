import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { getApiErrorMessage } from '../utils/apiError'

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [eventType, setEventType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const pageSize = 20

  useEffect(() => {
    setLoading(true)
    setError('')
    const params = { page, page_size: pageSize }
    if (eventType) params.event_type = eventType
    api
      .get('/audit-logs/', { params })
      .then(({ data }) => {
        setLogs(data.results || [])
        setCount(data.count || 0)
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Failed to load audit logs.')))
      .finally(() => setLoading(false))
  }, [page, eventType])

  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="staff-badge mb-2">Admin Portal</span>
            <h1 className="page-header">Audit Logs</h1>
            <p className="page-subtitle">Authentication and security events from the API.</p>
          </div>
          <Link to="/admin-portal" className="btn-outline text-sm">
            Dashboard
          </Link>
        </header>

        <div className="mb-4">
          <label
            className="text-sm font-medium text-slate-700 dark:text-slate-200"
            htmlFor="audit-event-type"
          >
            Event type
          </label>
          <select
            id="audit-event-type"
            className="input mt-1 max-w-xs"
            value={eventType}
            onChange={(e) => {
              setPage(1)
              setEventType(e.target.value)
            }}
          >
            <option value="">All events</option>
            <option value="otp_sent">OTP Sent</option>
            <option value="otp_failed">OTP Failed</option>
            <option value="login_failed">Login Failed</option>
            <option value="register_init">Register Initiated</option>
            <option value="password_change">Password Change</option>
            <option value="password_forgot">Password Forgot</option>
            <option value="password_reset">Password Reset</option>
            <option value="password_failed">Password Failed</option>
            <option value="token_refresh">Token Refresh</option>
          </select>
        </div>

        {loading && <p className="text-muted">Loading...</p>}
        {error && (
          <p
            className="text-error text-sm mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20"
            role="alert"
          >
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <div className="border border-surface-variant dark:border-slate-700 rounded-2xl overflow-x-auto bg-white dark:bg-slate-900">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-muted/80 dark:bg-slate-800/80 text-muted">
                  <tr>
                    <th className="py-2.5 px-3 font-medium">When</th>
                    <th className="py-2.5 px-3 font-medium">Event</th>
                    <th className="py-2.5 px-3 font-medium">User</th>
                    <th className="py-2.5 px-3 font-medium">IP</th>
                    <th className="py-2.5 px-3 font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-muted">
                        No audit events found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-surface-variant/70 dark:border-slate-800"
                      >
                        <td className="py-2.5 px-3 text-muted whitespace-nowrap">
                          {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                          {row.event_type_display || row.event_type}
                        </td>
                        <td className="py-2.5 px-3">{row.user_username || row.username || '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-xs">{row.ip_address || '—'}</td>
                        <td
                          className="py-2.5 px-3 text-muted max-w-xs truncate"
                          title={row.detail || ''}
                        >
                          {row.detail || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {count > 0 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-muted text-sm">
                  Page {page} of {totalPages} ({count} total)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-outline text-sm disabled:opacity-40"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn-primary text-sm disabled:opacity-40"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
