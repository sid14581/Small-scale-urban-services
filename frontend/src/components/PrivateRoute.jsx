import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children, staffOnly = false, citizenOnly = false }) {
  const { user, loading, canAccessStaff, canAccessCitizen } = useAuth()
  const location = useLocation()

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (staffOnly && !canAccessStaff) return <Navigate to="/" replace />
  if (citizenOnly && !canAccessCitizen) return <Navigate to="/staff" replace />

  return children
}
