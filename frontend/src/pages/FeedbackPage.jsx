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
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Submit Feedback</h2>
          {sent ? (
            <p className="text-green-400">Thank you! Your feedback has been recorded.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-error text-sm">{error}</p>}
              <input className="input" placeholder="Problem category" value={form.problem}
                onChange={(e) => setForm({ ...form, problem: e.target.value })} required />
              <textarea className="input" rows={4} placeholder="Your feedback" value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })} required />
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  )
}
