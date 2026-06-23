import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { getApiErrorMessage } from '../utils/apiError'

export default function StaffFeedback() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api.get('/feedback/')
      .then(({ data }) => setFeedbacks(data.results || data))
      .catch((err) => setError(getApiErrorMessage(err, 'Failed to load feedback.')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-8">
          <span className="staff-badge mb-2">Staff Portal</span>
          <h1 className="page-header">Citizen Feedback</h1>
          <p className="page-subtitle">Review suggestions from community members.</p>
        </header>
        {loading && <p className="text-muted">Loading...</p>}
        {error && <p className="text-error text-sm mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">{error}</p>}
        {!loading && !error && feedbacks.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-muted">No feedback submitted yet.</p>
          </div>
        )}
        {!loading && !error && feedbacks.length > 0 && (
          <div className="space-y-4">
            {feedbacks.map((fb) => (
              <div key={fb.id} className="card">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{fb.problem}</h3>
                <p className="text-muted mt-2 leading-relaxed">{fb.comment}</p>
                <p className="text-muted text-xs mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                  {fb.submitted_by_username} · {new Date(fb.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
