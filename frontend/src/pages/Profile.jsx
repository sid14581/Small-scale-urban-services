import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../utils/apiError'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ first_name: '', email: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

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

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8 md:py-12">
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
      </main>
    </>
  )
}
