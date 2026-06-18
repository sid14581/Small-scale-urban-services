import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children, staffOnly = false, citizenOnly = false }) {
  const { user, loading, canAccessStaff, canAccessCitizen } = useAuth()

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (staffOnly && !canAccessStaff) return <Navigate to="/complaints" replace />
  if (citizenOnly && !canAccessCitizen) return <Navigate to="/staff" replace />

  return children
}
