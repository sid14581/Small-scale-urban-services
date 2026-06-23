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

  if (!cat) return <p className="p-8 text-muted">Invalid category</p>

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
      <main className="max-w-lg mx-auto px-4 py-8 md:py-12">
        <div className="card">
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <img src={cat.image} alt={cat.label} className="w-14 h-14 object-cover rounded-xl ring-2 ring-primary/20" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{cat.label}</h2>
              <p className="text-muted text-sm">Complaint form</p>
            </div>
          </div>
          <Link to="/" className="text-link text-sm inline-flex items-center gap-1">← Back to categories</Link>
          {error && <p className="text-error mt-4 text-sm p-3 rounded-xl bg-red-50 dark:bg-red-900/20">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm text-muted">Description</label>
              <input className="input mt-1" placeholder="Describe your complaint" value={form.complain}
                onChange={(e) => setForm({ ...form, complain: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm text-muted">Phone number</label>
              <input className="input mt-1" placeholder="Phone number" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm text-muted">Address</label>
              <input className="input mt-1" placeholder="Address" value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm text-muted">Area / locality</label>
              <input className="input mt-1" placeholder="Area / locality" value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })} required />
            </div>
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
