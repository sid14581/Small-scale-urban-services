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
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Citizen Feedback</h1>
        {loading && <p className="text-muted">Loading...</p>}
        {error && <p className="text-error text-sm mb-4">{error}</p>}
        {!loading && !error && feedbacks.length === 0 && (
          <p className="text-muted">No feedback submitted yet.</p>
        )}
        {!loading && !error && feedbacks.length > 0 && (
          <div className="space-y-4">
            {feedbacks.map((fb) => (
              <div key={fb.id} className="card">
                <h3 className="font-semibold">{fb.problem}</h3>
                <p className="text-muted mt-2">{fb.comment}</p>
                <p className="text-muted text-xs mt-2">
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
