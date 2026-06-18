import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PasswordInput from '../components/PasswordInput'
import OtpInput, { isOtpComplete } from '../components/OtpInput'
import { useAuth, getDefaultRoute } from '../context/AuthContext'
import { getApiErrorMessage } from '../utils/apiError'
import { BRANDING } from '../constants'

export default function Login() {
  const { loginInit, verifyOtp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ username: '', password: '' })
  const [otpSession, setOtpSession] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const session = await loginInit(form.username, form.password)
      setOtpSession(session)
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
      navigate(getDefaultRoute(profile))
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
          <div className="hidden md:flex flex-col items-center justify-center rounded-2xl panel-accent p-8 overflow-hidden">
            <img
              src={BRANDING.auth}
              alt="Smart city viewpoint"
              className="w-full max-h-72 object-contain mb-4"
            />
            <p className="text-muted text-center text-sm">
              Welcome back to the Smart City Management System
            </p>
          </div>
          <div className="card">
            <img
              src={BRANDING.hero}
              alt="SCMS"
              className="w-12 h-12 mx-auto mb-4 md:hidden"
            />
            <h2 className="text-2xl font-bold mb-6">Login</h2>
            {error && <p className="text-error mb-4 text-sm">{error}</p>}

            {step === 1 ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <input
                  className="input"
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
                <PasswordInput
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? 'Sending OTP...' : 'Continue'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <p className="text-muted text-sm">
                  Enter the verification code sent to your registered phone number.
                </p>
                <OtpInput value={otpCode} onChange={setOtpCode} disabled={submitting} />
                <button type="submit" disabled={submitting || !isOtpComplete(otpCode)} className="btn-primary w-full">
                  {submitting ? 'Verifying...' : 'Verify & Login'}
                </button>
                <div className="flex gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError('') }}
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
                    Resend OTP
                  </button>
                </div>
              </form>
            )}

            <p className="mt-4 text-sm text-muted">
              No account? <Link to="/register" className="text-link">Register</Link>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
