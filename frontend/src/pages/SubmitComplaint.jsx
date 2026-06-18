import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { CATEGORIES } from '../constants'
import { getApiErrorMessage } from '../utils/apiError'

export default function SubmitComplaint() {
  const { category } = useParams()
  const navigate = useNavigate()
  const cat = CATEGORIES.find((c) => c.value === category)
  const [form, setForm] = useState({ complain: '', phone: '', address: '', area: '', link: '' })
  const [error, setError] = useState('')

  if (!cat) return <p className="p-8">Invalid category</p>

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/complaints/', { ...form, category })
      navigate('/my-complaints')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Submission failed. Please try again.'))
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="card">
          <div className="flex items-center gap-4 mb-2">
            <img src={cat.image} alt={cat.label} className="w-14 h-14 object-contain" />
            <h2 className="text-2xl font-bold">{cat.label} Complaint</h2>
          </div>
          <Link to="/complaints" className="text-link text-sm">← Back to categories</Link>
          {error && <p className="text-error mt-4 text-sm">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <input className="input" placeholder="Describe your complaint" value={form.complain}
              onChange={(e) => setForm({ ...form, complain: e.target.value })} required />
            <input className="input" placeholder="Phone number" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <input className="input" placeholder="Address" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            <input className="input" placeholder="Area / locality" value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })} required />
            <div>
              <label className="text-sm text-muted">Google Drive / Docs link (optional)</label>
              <input
                className="input mt-1"
                placeholder="https://drive.google.com/..."
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary w-full">Submit Complaint</button>
          </form>
        </div>
      </main>
    </>
  )
}
