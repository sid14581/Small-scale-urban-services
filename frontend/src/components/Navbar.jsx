import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BRANDING } from '../constants'
import { isAuthBypass, canSwitchBypassRole } from '../config/authBypass'

export default function Navbar() {
  const {
    user,
    logout,
    isAdmin,
    isStaff,
    isCitizen,
    authBypassMode,
    switchBypassRole,
  } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleRoleSwitch = (role) => {
    switchBypassRole(role)
    navigate(role === 'staff' ? '/staff' : '/complaints')
  }

  const showStaffNav = isAdmin || isStaff
  const showCitizenNav = isAdmin || isCitizen

  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-4 py-3">
      {isAuthBypass() && (
        <div className="max-w-6xl mx-auto mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-block text-xs px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700">
            Dev: auth bypass ({authBypassMode})
          </span>
          {canSwitchBypassRole() && user && (
            <span className="flex gap-1 text-xs">
              <button
                type="button"
                onClick={() => handleRoleSwitch('citizen')}
                className={`px-2 py-0.5 rounded border ${
                  isCitizen
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'border-slate-600 text-muted hover:border-slate-500'
                }`}
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('staff')}
                className={`px-2 py-0.5 rounded border ${
                  isStaff
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'border-slate-600 text-muted hover:border-slate-500'
                }`}
              >
                Staff
              </button>
            </span>
          )}
        </div>
      )}
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-link">
          <img src={BRANDING.hero} alt="" className="w-8 h-8 object-contain" />
          SCMS
        </Link>
        <div className="flex items-center gap-4 text-sm flex-wrap justify-end">
          {user ? (
            <>
              {showStaffNav && (
                <>
                  <Link to="/staff" className="hover:text-indigo-300">Dashboard</Link>
                  <Link to="/staff/complaints" className="hover:text-indigo-300">Staff Complaints</Link>
                  <Link to="/staff/feedback" className="hover:text-indigo-300">Staff Feedback</Link>
                </>
              )}
              {showCitizenNav && (
                <>
                  <Link to="/complaints" className="hover:text-indigo-300">File Complaint</Link>
                  <Link to="/my-complaints" className="hover:text-indigo-300">My Complaints</Link>
                  <Link to="/feedback" className="hover:text-indigo-300">Feedback</Link>
                  <Link to="/profile" className="hover:text-indigo-300">Profile</Link>
                </>
              )}
              <span className="text-muted">Hi, {user.username}</span>
              <button onClick={handleLogout} className="btn-outline text-xs py-1">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-indigo-300">Login</Link>
              <Link to="/register" className="btn-primary text-xs py-1">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
