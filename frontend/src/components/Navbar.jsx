import { useEffect, useId, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BRANDING } from '../constants'
import { isAuthBypass, canSwitchBypassRole } from '../config/authBypass'
import { toggleTheme } from '../utils/theme'

function ThemeToggle({ className = '' }) {
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
      className={`btn-outline min-h-[44px] min-w-[44px] px-2.5 py-2 ${className}`}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  )
}

function NavLinkItem({ to, active, onClick, children, className = '' }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`nav-link text-sm min-h-[44px] inline-flex items-center ${active ? 'nav-link-active' : ''} ${className}`}
    >
      {children}
    </Link>
  )
}

export default function Navbar() {
  const { user, logout, isAdmin, isStaff, isCitizen, authBypassMode, switchBypassRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/')
  }

  const handleRoleSwitch = (role) => {
    switchBypassRole(role)
    navigate(role === 'staff' ? '/staff' : '/')
  }

  const showStaffNav = isAdmin || isStaff
  const showCitizenNav = isAdmin || isCitizen
  const closeMenu = () => setMenuOpen(false)

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`)
  const isAdminPortalActive = isActive('/admin-portal')

  const mobileLinks = (
    <>
      {user ? (
        <>
          {isAdmin && (
            <NavLinkItem to="/admin-portal" active={isAdminPortalActive} onClick={closeMenu}>
              Admin Portal
            </NavLinkItem>
          )}
          {showStaffNav && (
            <>
              <p className="text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300 pt-2">
                Staff
              </p>
              <NavLinkItem
                to="/staff"
                active={
                  isActive('/staff') &&
                  !location.pathname.includes('/complaints') &&
                  !location.pathname.includes('/feedback')
                }
                onClick={closeMenu}
              >
                Dashboard
              </NavLinkItem>
              <NavLinkItem
                to="/staff/complaints"
                active={isActive('/staff/complaints')}
                onClick={closeMenu}
              >
                Complaints
              </NavLinkItem>
              <NavLinkItem
                to="/staff/feedback"
                active={isActive('/staff/feedback')}
                onClick={closeMenu}
              >
                Feedback
              </NavLinkItem>
            </>
          )}
          {showCitizenNav && (
            <>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted pt-2">
                Customer
              </p>
              <NavLinkItem to="/#service-categories" active={false} onClick={closeMenu}>
                Report an issue
              </NavLinkItem>
              <NavLinkItem
                to="/my-complaints"
                active={isActive('/my-complaints')}
                onClick={closeMenu}
              >
                My Complaints
              </NavLinkItem>
              <NavLinkItem to="/feedback" active={isActive('/feedback')} onClick={closeMenu}>
                Feedback
              </NavLinkItem>
            </>
          )}
          <NavLinkItem to="/profile" active={isActive('/profile')} onClick={closeMenu}>
            Profile
          </NavLinkItem>
          <button
            type="button"
            onClick={handleLogout}
            className="btn-outline w-full justify-center mt-2"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <NavLinkItem to="/login" active={isActive('/login')} onClick={closeMenu}>
            Login
          </NavLinkItem>
          <Link
            to="/register"
            onClick={closeMenu}
            className="btn-primary w-full justify-center mt-2"
          >
            Sign up
          </Link>
        </>
      )}
    </>
  )

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
            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              SCMS
            </span>
            <span className="hidden sm:block text-[10px] uppercase tracking-wider text-muted font-semibold">
              Smart City Management
            </span>
          </div>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-2 sm:gap-3 text-sm flex-wrap justify-end">
          <ThemeToggle />
          {user ? (
            <>
              {isAdmin && (
                <NavLinkItem to="/admin-portal" active={isAdminPortalActive}>
                  Admin
                </NavLinkItem>
              )}
              {showStaffNav && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                  <NavLinkItem
                    to="/staff"
                    active={
                      isActive('/staff') &&
                      !location.pathname.includes('/complaints') &&
                      !location.pathname.includes('/feedback')
                    }
                  >
                    Dashboard
                  </NavLinkItem>
                  <NavLinkItem to="/staff/complaints" active={isActive('/staff/complaints')}>
                    Complaints
                  </NavLinkItem>
                  <NavLinkItem to="/staff/feedback" active={isActive('/staff/feedback')}>
                    Feedback
                  </NavLinkItem>
                </div>
              )}
              {showCitizenNav && (
                <div className="flex items-center gap-1">
                  <NavLinkItem to="/my-complaints" active={isActive('/my-complaints')}>
                    My Complaints
                  </NavLinkItem>
                  <NavLinkItem to="/feedback" active={isActive('/feedback')}>
                    Feedback
                  </NavLinkItem>
                </div>
              )}
              <NavLinkItem to="/profile" active={isActive('/profile')}>
                Profile
              </NavLinkItem>
              <span className="text-muted text-xs truncate max-w-[8rem]">{user.username}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-outline text-sm min-h-[44px]"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLinkItem to="/login" active={isActive('/login')}>
                Login
              </NavLinkItem>
              <Link to="/register" className="btn-primary text-sm min-h-[44px]">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="btn-outline min-h-[44px] min-w-[44px] px-2.5"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer — civic mobile shell pattern */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            aria-label="Dismiss menu"
            onClick={closeMenu}
          />
          <div
            id={menuId}
            className="absolute top-0 right-0 h-full w-[min(20rem,88vw)] bg-surface-container dark:bg-slate-900 border-l border-surface-variant dark:border-slate-700 shadow-card p-5 flex flex-col gap-1 overflow-y-auto animate-[slideIn_0.2s_ease-out]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-slate-900 dark:text-white">Menu</span>
              <button
                type="button"
                className="btn-outline min-h-[44px] min-w-[44px]"
                aria-label="Close"
                onClick={closeMenu}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {user && (
              <p className="text-sm text-muted mb-2 truncate">Signed in as {user.username}</p>
            )}
            {mobileLinks}
          </div>
        </div>
      )}
    </nav>
  )
}
