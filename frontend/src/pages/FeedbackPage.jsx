import { useState } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { getApiErrorMessage } from '../utils/apiError'

export default function FeedbackPage() {
  const [form, setForm] = useState({ problem: '', comment: '' })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/feedback/', form)
      setSent(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit feedback.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8 md:py-12">
        <div className="card">
          <h2 className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">Submit Feedback</h2>
          <p className="text-muted text-sm mb-6">Share suggestions to help improve city services.</p>
          {sent ? (
            <div className="text-center py-8">
              <p className="text-success text-lg font-medium">Thank you!</p>
              <p className="text-muted mt-2">Your feedback has been recorded.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-error text-sm p-3 rounded-xl bg-red-50 dark:bg-red-900/20">{error}</p>}
              <div>
                <label className="text-sm text-muted">Problem category</label>
                <input className="input mt-1" placeholder="e.g. App usability, response time" value={form.problem}
                  onChange={(e) => setForm({ ...form, problem: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm text-muted">Your feedback</label>
                <textarea className="input mt-1" rows={4} placeholder="Tell us more..." value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })} required />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  )
}
