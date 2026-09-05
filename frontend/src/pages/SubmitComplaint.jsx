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
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState(null)

  if (!cat) return <p className="p-8 text-muted">Invalid category</p>

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { data } = await api.post('/complaints/', { ...form, category })
      setConfirmation(data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Submission failed. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmation) {
    return (
      <>
        <Navbar />
        <main className="max-w-lg mx-auto px-4 py-8 md:py-12">
          <div className="card text-center space-y-5">
            <p className="text-primary font-bold text-xs uppercase tracking-[0.18em]">SCMS</p>
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 text-2xl font-bold" aria-hidden>
              ✓
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Complaint submitted</h1>
            <p className="text-muted text-sm">
              Your {cat.label.toLowerCase()} report is with city staff.
            </p>
            <div className="p-4 rounded-xl bg-surface-muted dark:bg-slate-800/60 border border-surface-variant dark:border-slate-700">
              <p className="text-xs uppercase tracking-wide text-muted mb-1">Reference ID</p>
              <p className="font-mono text-xl font-bold text-primary dark:text-primary-light">
                {confirmation.reference_id}
              </p>
            </div>
            <ol className="text-left text-sm text-muted space-y-2 list-decimal list-inside">
              <li>Staff will review your report within 2 business days.</li>
              <li>Track status anytime under My Complaints.</li>
              <li>Keep your reference ID for follow-up calls.</li>
            </ol>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/my-complaints" className="btn-primary flex-1 text-center">
                View my complaints
              </Link>
              <button
                type="button"
                className="btn-outline flex-1"
                onClick={() => navigate('/')}
              >
                Submit another
              </button>
            </div>
            {confirmation.id && (
              <Link
                to={`/my-complaints/${confirmation.id}`}
                className="text-link text-sm inline-block"
              >
                Open this complaint →
              </Link>
            )}
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8 md:py-12">
        <div className="card">
          <p className="text-primary font-bold text-xs uppercase tracking-[0.18em] mb-3">SCMS</p>
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <img src={cat.image} alt="" className="w-14 h-14 object-cover rounded-xl ring-2 ring-primary/20" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{cat.label}</h1>
              <p className="text-muted text-sm">Submit a complaint</p>
            </div>
          </div>
          <Link to="/" className="text-link text-sm inline-flex items-center gap-1">← Back to categories</Link>
          {error && <p className="text-error mt-4 text-sm p-3 rounded-xl bg-red-50 dark:bg-red-900/20" role="alert">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="complain-desc">
                Description
              </label>
              <textarea
                id="complain-desc"
                className="input mt-1 min-h-[6rem] py-3"
                placeholder="Describe the issue clearly"
                value={form.complain}
                onChange={(e) => setForm({ ...form, complain: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="complain-phone">
                Phone number
              </label>
              <input
                id="complain-phone"
                className="input mt-1"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="complain-address">
                Address
              </label>
              <input
                id="complain-address"
                className="input mt-1"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                autoComplete="street-address"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="complain-area">
                Area / locality
              </label>
              <input
                id="complain-area"
                className="input mt-1"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="complain-link">
                Google Drive / Docs link (optional)
              </label>
              <input
                id="complain-link"
                className="input mt-1"
                placeholder="https://drive.google.com/..."
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
