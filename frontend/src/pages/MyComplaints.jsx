import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import ComplaintCard from '../components/ComplaintCard'
import api from '../api/axios'
import { getApiErrorMessage } from '../utils/apiError'

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api.get('/complaints/')
      .then(({ data }) => setComplaints(data.results || data))
      .catch((err) => setError(getApiErrorMessage(err, 'Failed to load complaints.')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Complaints</h1>
        {loading && <p className="text-muted">Loading...</p>}
        {error && <p className="text-error text-sm mb-4">{error}</p>}
        {!loading && !error && complaints.length === 0 && (
          <p className="text-muted">No complaints submitted yet.</p>
        )}
        {!loading && !error && complaints.length > 0 && (
          <div className="grid gap-4">
            {complaints.map((c) => <ComplaintCard key={c.id} complaint={c} />)}
          </div>
        )}
      </main>
    </>
  )
}
