import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PasswordInput from '../components/PasswordInput'
import { createStaff } from '../api/adminStaff'
import { getApiErrorMessage } from '../utils/apiError'

export default function AdminStaffCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    phone: '',
    password: '',
    notify: false,
    notify_channel: 'email',
  })
  const [credentials, setCredentials] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        phone: form.phone.trim(),
        notify: form.notify,
      }
      if (form.password) payload.password = form.password
      if (form.notify) payload.notify_channel = form.notify_channel
      const { data } = await createStaff(payload)
      setCredentials({
        username: data.username || payload.username,
        password: data.password || form.password || '(server-generated — check API response)',
        id: data.id,
        notify_status: data.notify_status,
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create staff account.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8 md:py-12">
        <header className="mb-6">
          <span className="staff-badge mb-2">Admin Portal</span>
          <h1 className="page-header">Create Staff</h1>
          <p className="page-subtitle">Leave password blank to let the server generate one.</p>
        </header>

        {credentials ? (
          <div className="card space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Credentials created
            </h2>
            <p className="text-muted text-sm">
              Copy these now. The plaintext password is shown only once.
            </p>
            <div className="p-3 rounded-xl bg-surface-muted dark:bg-slate-800/60 text-sm space-y-2">
              <p>
                <span className="text-muted">Username:</span>{' '}
                <span className="font-medium">{credentials.username}</span>
              </p>
              <p>
                <span className="text-muted">Password:</span>{' '}
                <span className="font-mono font-medium break-all">{credentials.password}</span>
              </p>
              {credentials.notify_status && (
                <p>
                  <span className="text-muted">Notify:</span>{' '}
                  <span className="font-medium">{credentials.notify_status}</span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {credentials.id && (
                <Link
                  to={`/admin-portal/staff/${credentials.id}`}
                  className="btn-primary flex-1 text-center"
                >
                  View staff
                </Link>
              )}
              <Link to="/admin-portal/staff" className="btn-outline">
                Back to list
              </Link>
            </div>
          </div>
        ) : (
          <div className="card">
            {error && (
              <p
                className="text-error mb-4 text-sm p-3 rounded-xl bg-red-50 dark:bg-red-900/20"
                role="alert"
              >
                {error}
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  htmlFor="create-username"
                >
                  Username
                </label>
                <input
                  id="create-username"
                  className="input mt-1"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <label
                  className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  htmlFor="create-email"
                >
                  Email
                </label>
                <input
                  id="create-email"
                  className="input mt-1"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label
                  className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  htmlFor="create-first-name"
                >
                  First name
                </label>
                <input
                  id="create-first-name"
                  className="input mt-1"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
              </div>
              <div>
                <label
                  className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  htmlFor="create-phone"
                >
                  Phone (E.164)
                </label>
                <input
                  id="create-phone"
                  className="input mt-1"
                  placeholder="+15551234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label
                  className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  htmlFor="create-password"
                >
                  Password (optional)
                </label>
                <div className="mt-1">
                  <PasswordInput
                    id="create-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    minLength={8}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 min-h-[44px]">
                <input
                  type="checkbox"
                  checked={form.notify}
                  onChange={(e) => setForm({ ...form, notify: e.target.checked })}
                  className="accent-primary w-4 h-4"
                />
                Notify staff of credentials
              </label>
              {form.notify && (
                <fieldset>
                  <legend className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                    Notify via
                  </legend>
                  <div className="flex gap-3">
                    {[
                      ['email', 'Email'],
                      ['sms', 'SMS'],
                    ].map(([value, label]) => (
                      <label
                        key={value}
                        className={`flex-1 flex items-center justify-center px-3 py-2.5 rounded-xl border cursor-pointer text-sm font-medium min-h-[44px] ${
                          form.notify_channel === value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-slate-200 dark:border-slate-700 text-muted'
                        }`}
                      >
                        <input
                          type="radio"
                          name="notify_channel"
                          value={value}
                          checked={form.notify_channel === value}
                          onChange={() => setForm({ ...form, notify_channel: value })}
                          className="sr-only"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Creating...' : 'Create staff'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin-portal/staff')}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </>
  )
}
