import { Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import SubmitComplaint from './pages/SubmitComplaint'
import MyComplaints from './pages/MyComplaints'
import FeedbackPage from './pages/FeedbackPage'
import StaffDashboard from './pages/StaffDashboard'
import ComplaintList from './pages/ComplaintList'
import ComplaintDetail from './pages/ComplaintDetail'
import StaffFeedback from './pages/StaffFeedback'
import Profile from './pages/Profile'
import { useAuth } from './context/AuthContext'

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/complaints" element={<Navigate to="/" replace />} />
      <Route path="/complaints/new/:category" element={<PrivateRoute citizenOnly><SubmitComplaint /></PrivateRoute>} />
      <Route path="/my-complaints" element={<PrivateRoute citizenOnly><MyComplaints /></PrivateRoute>} />
      <Route path="/feedback" element={<PrivateRoute citizenOnly><FeedbackPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute citizenOnly><Profile /></PrivateRoute>} />
      <Route path="/staff" element={<PrivateRoute staffOnly><StaffDashboard /></PrivateRoute>} />
      <Route path="/staff/complaints" element={<PrivateRoute staffOnly><ComplaintList /></PrivateRoute>} />
      <Route path="/staff/complaints/:id" element={<PrivateRoute staffOnly><ComplaintDetail /></PrivateRoute>} />
      <Route path="/staff/feedback" element={<PrivateRoute staffOnly><StaffFeedback /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return <AppRoutes />
}
