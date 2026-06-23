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
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-8">
          <h1 className="page-header">My Complaints</h1>
          <p className="page-subtitle">Track the status of your submitted reports.</p>
        </header>
        {loading && <p className="text-muted">Loading...</p>}
        {error && <p className="text-error text-sm mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">{error}</p>}
        {!loading && !error && complaints.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-muted">No complaints submitted yet.</p>
          </div>
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
