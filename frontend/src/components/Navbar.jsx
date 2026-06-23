import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BRANDING } from '../constants'
import { isAuthBypass, canSwitchBypassRole } from '../config/authBypass'
import { toggleTheme } from '../utils/theme'

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return (
    <button
      type="button"
      onClick={() => setDark(toggleTheme() === 'dark')}
      className="btn-outline text-xs py-1.5 px-2.5 min-h-0 border"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}

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
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleRoleSwitch = (role) => {
    switchBypassRole(role)
    navigate(role === 'staff' ? '/staff' : '/')
  }

  const showStaffNav = isAdmin || isStaff
  const showCitizenNav = isAdmin || isCitizen

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`)

  return (
    <nav className="sticky top-0 z-50 bg-surface-container/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-surface-variant dark:border-slate-700">
      {isAuthBypass() && (
        <div className="max-w-6xl mx-auto px-4 pt-2 flex flex-wrap items-center gap-2">
          <span className="inline-block text-xs px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
            Dev: auth bypass ({authBypassMode})
          </span>
          {canSwitchBypassRole() && user && (
            <span className="flex gap-1 text-xs">
              <button
                type="button"
                onClick={() => handleRoleSwitch('citizen')}
                className={`px-2 py-0.5 rounded-lg border transition-colors ${
                  isCitizen
                    ? 'bg-primary text-white border-primary'
                    : 'border-slate-300 text-muted hover:border-primary/50 dark:border-slate-600'
                }`}
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('staff')}
                className={`px-2 py-0.5 rounded-lg border transition-colors ${
                  isStaff
                    ? 'bg-primary text-white border-primary'
                    : 'border-slate-300 text-muted hover:border-primary/50 dark:border-slate-600'
                }`}
              >
                Staff
              </button>
            </span>
          )}
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <img
            src={BRANDING.hero}
            alt=""
            className="w-9 h-9 object-cover rounded-xl ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
          />
          <div className="leading-tight">
            <span className="text-lg font-bold text-slate-900 dark:text-white">SCMS</span>
            <span className="hidden sm:block text-[10px] uppercase tracking-wider text-muted font-semibold">
              Urban Services
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 text-sm flex-wrap justify-end">
          <ThemeToggle />
          {user ? (
            <>
              {showStaffNav && (
                <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                  <Link to="/staff" className={`nav-link text-xs ${isActive('/staff') && !location.pathname.includes('/complaints') && !location.pathname.includes('/feedback') ? 'nav-link-active' : ''}`}>
                    Dashboard
                  </Link>
                  <Link to="/staff/complaints" className={`nav-link text-xs ${isActive('/staff/complaints') ? 'nav-link-active' : ''}`}>
                    Complaints
                  </Link>
                  <Link to="/staff/feedback" className={`nav-link text-xs ${isActive('/staff/feedback') ? 'nav-link-active' : ''}`}>
                    Feedback
                  </Link>
                </div>
              )}
              {showCitizenNav && (
                <div className="hidden md:flex items-center gap-1">
                  <Link to="/my-complaints" className={`nav-link text-xs ${isActive('/my-complaints') ? 'nav-link-active' : ''}`}>
                    My Complaints
                  </Link>
                  <Link to="/feedback" className={`nav-link text-xs ${isActive('/feedback') ? 'nav-link-active' : ''}`}>
                    Feedback
                  </Link>
                  <Link to="/profile" className={`nav-link text-xs ${isActive('/profile') ? 'nav-link-active' : ''}`}>
                    Profile
                  </Link>
                </div>
              )}
              <span className="text-muted text-xs hidden sm:inline truncate max-w-[8rem]">
                {user.username}
              </span>
              <button onClick={handleLogout} className="btn-outline text-xs py-1.5 min-h-0">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link text-sm">Login</Link>
              <Link to="/register" className="btn-primary text-xs py-1.5 min-h-0">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
