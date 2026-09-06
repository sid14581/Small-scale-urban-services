import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PasswordInput from '../components/PasswordInput'
import OtpInput from '../components/OtpInput'
import { useAuth } from '../context/AuthContext'
import { isOtpComplete } from '../utils/otp'
import { getDefaultRoute } from '../utils/roles'
import { getApiErrorMessage } from '../utils/apiError'
import { BRANDING } from '../constants'

export default function Login() {
  const { loginInit, verifyOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ username: '', password: '' })
  const [otpSession, setOtpSession] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpChannel, setOtpChannel] = useState('sms')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const session = await loginInit(form.username, form.password)
      setOtpSession(session)
      setOtpChannel('sms')
      setOtpCode('')
      setStep(2)
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid credentials.')
      } else {
        setError(getApiErrorMessage(err, 'Login failed. Please try again.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const profile = await verifyOtp(otpSession, otpCode)
      navigate(redirectTo || getDefaultRoute(profile), { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid or expired OTP.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    setError('')
    setSubmitting(true)
    try {
      const session = await loginInit(form.username, form.password)
      setOtpSession(session)
      setOtpCode('')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to resend OTP.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="hidden md:flex flex-col items-center justify-center rounded-3xl hero-gradient border border-slate-200 dark:border-slate-700 p-8 overflow-hidden">
            <img
              src={BRANDING.auth}
              alt="Smart city viewpoint"
              className="w-full max-h-72 object-contain mb-4 rounded-2xl"
            />
            <p className="text-muted text-center text-sm max-w-xs">
              Sign in to SCMS to report and track urban service issues.
            </p>
          </div>
          <div className="card">
            <p className="text-primary font-bold text-xs uppercase tracking-[0.18em] mb-2">SCMS</p>
            <img
              src={BRANDING.hero}
              alt=""
              className="w-12 h-12 mx-auto mb-4 md:hidden rounded-xl ring-2 ring-primary/20"
            />
            <h1 className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">
              {step === 1 ? 'Login' : 'Verify your identity'}
            </h1>
            <p className="text-muted text-sm mb-6">
              {step === 1
                ? 'Enter your username and password to continue.'
                : `We sent a verification code via ${otpChannel === 'email' ? 'email' : 'SMS'} to your registered ${otpChannel === 'email' ? 'email address' : 'phone number'}.`}
            </p>
            {error && (
              <p
                className="text-error mb-4 text-sm p-3 rounded-xl bg-red-50 dark:bg-red-900/20"
                role="alert"
              >
                {error}
              </p>
            )}

            {step === 1 ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label
                    className="text-sm font-medium text-slate-700 dark:text-slate-200"
                    htmlFor="login-username"
                  >
                    Username
                  </label>
                  <input
                    id="login-username"
                    className="input mt-1"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label
                    className="text-sm font-medium text-slate-700 dark:text-slate-200"
                    htmlFor="login-password"
                  >
                    Password
                  </label>
                  <div className="mt-1">
                    <PasswordInput
                      id="login-password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? 'Sending code...' : 'Continue'}
                </button>
                <p className="text-sm text-center">
                  <Link to="/forgot-password" className="text-link font-medium">
                    Forgot password?
                  </Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label
                    className="text-sm font-medium text-slate-700 dark:text-slate-200"
                    htmlFor="login-otp"
                  >
                    Verification code
                  </label>
                  <div className="mt-1">
                    <OtpInput
                      id="login-otp"
                      value={otpCode}
                      onChange={setOtpCode}
                      disabled={submitting}
                      channel={otpChannel}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !isOtpComplete(otpCode)}
                  className="btn-primary w-full"
                >
                  {submitting ? 'Verifying...' : 'Verify & Login'}
                </button>
                <div className="flex gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1)
                      setError('')
                    }}
                    className="text-link"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={submitting}
                    className="text-link"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}

            <p className="mt-6 text-sm text-muted text-center">
              No account?{' '}
              <Link to="/register" className="text-link font-medium">
                Register
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
