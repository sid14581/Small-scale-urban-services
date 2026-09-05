import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../utils/apiError'

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ first_name: '', email: '' })
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirm: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({ first_name: user.first_name || '', email: user.email || '' })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      await updateProfile(form)
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update profile.'))
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (passwordForm.new_password !== passwordForm.new_password_confirm) {
      setPasswordError('New passwords do not match.')
      return
    }
    setChangingPassword(true)
    try {
      await changePassword(passwordForm)
      setPasswordSuccess('Password changed successfully.')
      setPasswordForm({ current_password: '', new_password: '', new_password_confirm: '' })
    } catch (err) {
      setPasswordError(getApiErrorMessage(err, 'Failed to change password.'))
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8 md:py-12 space-y-6">
        <div className="card">
          <h2 className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">My Profile</h2>
          <p className="text-muted text-sm mb-6">
            Username: <span className="font-medium text-slate-700 dark:text-slate-200">{user?.username}</span>
          </p>
          {error && <p className="text-error mb-4 text-sm p-3 rounded-xl bg-red-50 dark:bg-red-900/20">{error}</p>}
          {success && <p className="text-success mb-4 text-sm p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">{success}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted">First Name</label>
              <input
                className="input mt-1"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm text-muted">Email</label>
              <input
                className="input mt-1"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn-outline">
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">Change Password</h3>
          <p className="text-muted text-sm mb-6">
            Update your password for this account. Customers, staff, and admins can all change passwords here.
          </p>
          {passwordError && (
            <p className="text-error mb-4 text-sm p-3 rounded-xl bg-red-50 dark:bg-red-900/20">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-success mb-4 text-sm p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">{passwordSuccess}</p>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <PasswordInput
              placeholder="Current password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              required
            />
            <PasswordInput
              placeholder="New password (min 8 chars)"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              minLength={8}
              required
            />
            <PasswordInput
              placeholder="Confirm new password"
              value={passwordForm.new_password_confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirm: e.target.value })}
              minLength={8}
              required
            />
            <button type="submit" disabled={changingPassword} className="btn-primary w-full">
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
