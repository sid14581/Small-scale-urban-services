import { Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import SubmitComplaint from './pages/SubmitComplaint'
import MyComplaints from './pages/MyComplaints'
import MyComplaintDetail from './pages/MyComplaintDetail'
import FeedbackPage from './pages/FeedbackPage'
import StaffDashboard from './pages/StaffDashboard'
import ComplaintList from './pages/ComplaintList'
import ComplaintDetail from './pages/ComplaintDetail'
import StaffFeedback from './pages/StaffFeedback'
import Profile from './pages/Profile'
import AdminPortal from './pages/AdminPortal'
import AdminStaffList from './pages/AdminStaffList'
import AdminStaffCreate from './pages/AdminStaffCreate'
import AdminStaffDetail from './pages/AdminStaffDetail'
import AdminAuditLogs from './pages/AdminAuditLogs'
import { useAuth } from './context/AuthContext'
import { getDefaultRoute } from './utils/roles'

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={user ? <Navigate to={getDefaultRoute(user)} replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to={getDefaultRoute(user)} replace /> : <Register />}
      />
      <Route
        path="/forgot-password"
        element={user ? <Navigate to={getDefaultRoute(user)} replace /> : <ForgotPassword />}
      />
      <Route
        path="/reset-password"
        element={user ? <Navigate to={getDefaultRoute(user)} replace /> : <ResetPassword />}
      />
      <Route path="/complaints" element={<Navigate to="/" replace />} />
      <Route
        path="/complaints/new/:category"
        element={
          <PrivateRoute citizenOnly>
            <SubmitComplaint />
          </PrivateRoute>
        }
      />
      <Route
        path="/my-complaints"
        element={
          <PrivateRoute citizenOnly>
            <MyComplaints />
          </PrivateRoute>
        }
      />
      <Route
        path="/my-complaints/:id"
        element={
          <PrivateRoute citizenOnly>
            <MyComplaintDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/feedback"
        element={
          <PrivateRoute citizenOnly>
            <FeedbackPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <PrivateRoute staffOnly>
            <StaffDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/staff/complaints"
        element={
          <PrivateRoute staffOnly>
            <ComplaintList />
          </PrivateRoute>
        }
      />
      <Route
        path="/staff/complaints/:id"
        element={
          <PrivateRoute staffOnly>
            <ComplaintDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/staff/feedback"
        element={
          <PrivateRoute staffOnly>
            <StaffFeedback />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin-portal"
        element={
          <PrivateRoute adminOnly>
            <AdminPortal />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin-portal/staff"
        element={
          <PrivateRoute adminOnly>
            <AdminStaffList />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin-portal/staff/new"
        element={
          <PrivateRoute adminOnly>
            <AdminStaffCreate />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin-portal/staff/:id"
        element={
          <PrivateRoute adminOnly>
            <AdminStaffDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin-portal/audit-logs"
        element={
          <PrivateRoute adminOnly>
            <AdminAuditLogs />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return <AppRoutes />
}
