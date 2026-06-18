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
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="card">
          <h2 className="text-2xl font-bold mb-2">My Profile</h2>
          <p className="text-muted text-sm mb-6">
            Username: <span className="text-slate-200">{user?.username}</span>
          </p>
          {error && <p className="text-error mb-4 text-sm">{error}</p>}
          {success && <p className="text-green-400 mb-4 text-sm">{success}</p>}
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
            <div className="flex gap-3">
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
