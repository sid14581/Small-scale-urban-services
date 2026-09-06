import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PasswordInput from '../components/PasswordInput'
import { getStaff, resetStaffCredentials, updateStaff } from '../api/adminStaff'
import { getApiErrorMessage } from '../utils/apiError'

export default function AdminStaffDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '',
    email: '',
    phone: '',
    is_active: true,
  })
  const [username, setUsername] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [notify, setNotify] = useState(false)
  const [notifyChannel, setNotifyChannel] = useState('email')
  const [oneTimePassword, setOneTimePassword] = useState('')
  const [notifyStatus, setNotifyStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getStaff(id)
      .then(({ data }) => {
        setUsername(data.username || '')
        setForm({
          first_name: data.first_name || '',
          email: data.email || '',
          phone: data.phone || '',
          is_active: data.is_active !== false,
        })
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Failed to load staff member.')))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const { data } = await updateStaff(id, {
        first_name: form.first_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        is_active: form.is_active,
      })
      setForm({
        first_name: data.first_name || form.first_name,
        email: data.email || form.email,
        phone: data.phone || form.phone,
        is_active: data.is_active !== false,
      })
      setSuccess('Staff account updated.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update staff account.'))
    } finally {
      setSaving(false)
    }
  }

  const handleResetCredentials = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setOneTimePassword('')
    setNotifyStatus('')
    setResetting(true)
    try {
      const payload = { notify }
      if (resetPassword) payload.password = resetPassword
      if (notify) payload.notify_channel = notifyChannel
      const { data } = await resetStaffCredentials(id, payload)
      setOneTimePassword(data.password || resetPassword || '')
      setNotifyStatus(data.notify_status || '')
      setResetPassword('')
      setSuccess('Credentials reset. Copy the new password now.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to reset credentials.'))
    } finally {
      setResetting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8 md:py-12 space-y-6">
        <header>
          <span className="staff-badge mb-2">Admin Portal</span>
          <h1 className="page-header">Edit Staff</h1>
          <p className="page-subtitle">
            Username:{' '}
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {username || '…'}
            </span>
          </p>
        </header>

        {loading && <p className="text-muted">Loading...</p>}
        {error && (
          <p
            className="text-error text-sm p-3 rounded-xl bg-red-50 dark:bg-red-900/20"
            role="alert"
          >
            {error}
          </p>
        )}
        {success && (
          <p
            className="text-success text-sm p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20"
            role="status"
          >
            {success}
          </p>
        )}

        {!loading && (
          <>
            <div className="card">
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label
                    className="text-sm font-medium text-slate-700 dark:text-slate-200"
                    htmlFor="edit-first-name"
                  >
                    First name
                  </label>
                  <input
                    id="edit-first-name"
                    className="input mt-1"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label
                    className="text-sm font-medium text-slate-700 dark:text-slate-200"
                    htmlFor="edit-email"
                  >
                    Email
                  </label>
                  <input
                    id="edit-email"
                    className="input mt-1"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label
                    className="text-sm font-medium text-slate-700 dark:text-slate-200"
                    htmlFor="edit-phone"
                  >
                    Phone
                  </label>
                  <input
                    id="edit-phone"
                    className="input mt-1"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="accent-primary w-4 h-4"
                  />
                  Active account
                </label>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/admin-portal/staff')}
                    className="btn-outline"
                  >
                    Back
                  </button>
                </div>
              </form>
            </div>

            <div className="card space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Reset credentials
              </h2>
              <p className="text-muted text-sm">
                Provide a new password or leave blank for a server-generated one. Shown once in the
                response.
              </p>
              {oneTimePassword && (
                <div className="p-3 rounded-xl bg-surface-muted dark:bg-slate-800/60 text-sm space-y-1">
                  <p>
                    <span className="text-muted">New password: </span>
                    <span className="font-mono font-medium break-all">{oneTimePassword}</span>
                  </p>
                  {notifyStatus && (
                    <p>
                      <span className="text-muted">Notify: </span>
                      <span className="font-medium">{notifyStatus}</span>
                    </p>
                  )}
                </div>
              )}
              <form onSubmit={handleResetCredentials} className="space-y-4">
                <div>
                  <label
                    className="text-sm font-medium text-slate-700 dark:text-slate-200"
                    htmlFor="reset-staff-password"
                  >
                    New password (optional)
                  </label>
                  <div className="mt-1">
                    <PasswordInput
                      id="reset-staff-password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      minLength={8}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={notify}
                    onChange={(e) => setNotify(e.target.checked)}
                    className="accent-primary w-4 h-4"
                  />
                  Notify staff of new credentials
                </label>
                {notify && (
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
                            notifyChannel === value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-slate-200 dark:border-slate-700 text-muted'
                          }`}
                        >
                          <input
                            type="radio"
                            name="reset_notify_channel"
                            value={value}
                            checked={notifyChannel === value}
                            onChange={() => setNotifyChannel(value)}
                            className="sr-only"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                <button type="submit" disabled={resetting} className="btn-primary w-full">
                  {resetting ? 'Resetting...' : 'Reset credentials'}
                </button>
              </form>
            </div>

            <Link to="/admin-portal/staff" className="text-link text-sm">
              ← Back to staff list
            </Link>
          </>
        )}
      </main>
    </>
  )
}
