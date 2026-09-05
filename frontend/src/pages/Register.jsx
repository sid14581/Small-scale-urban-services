import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PasswordInput from '../components/PasswordInput'
import OtpInput, { isOtpComplete } from '../components/OtpInput'
import { useAuth, getDefaultRoute } from '../context/AuthContext'
import { getApiErrorMessage } from '../utils/apiError'
import { BRANDING } from '../constants'

function maskPhone(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.length < 4) return phone || 'your phone'
  return `•••• ${digits.slice(-4)}`
}

export default function Register() {
  const { registerInit, verifyOtp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    username: '', email: '', first_name: '', phone: '', password: '', password_confirm: '',
  })
  const [otpSession, setOtpSession] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleDetailsSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password_confirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      const session = await registerInit(form)
      setOtpSession(session)
      setOtpCode('')
      setStep(2)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Please try again.'))
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
      navigate(getDefaultRoute(profile), { replace: true })
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
      const session = await registerInit(form)
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
              Create a citizen account to file complaints and track city responses.
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
              {step === 1 ? 'Register' : 'Verify your phone'}
            </h1>
            <p className="text-muted text-sm mb-6">
              {step === 1
                ? 'Create a Customer account to file complaints and feedback.'
                : `Enter the SMS code sent to ${maskPhone(form.phone)}.`}
            </p>
            {error && <p className="text-error mb-4 text-sm p-3 rounded-xl bg-red-50 dark:bg-red-900/20" role="alert">{error}</p>}

            {step === 1 ? (
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="reg-first-name">
                    First name
                  </label>
                  <input
                    id="reg-first-name"
                    className="input mt-1"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="reg-email">
                    Email
                  </label>
                  <input
                    id="reg-email"
                    className="input mt-1"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="reg-username">
                    Username
                  </label>
                  <input
                    id="reg-username"
                    className="input mt-1"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="reg-phone">
                    Phone (E.164)
                  </label>
                  <input
                    id="reg-phone"
                    className="input mt-1"
                    placeholder="+15551234567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="reg-password">
                    Password
                  </label>
                  <div className="mt-1">
                    <PasswordInput
                      id="reg-password"
                      placeholder="At least 8 characters"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      minLength={8}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="reg-password-confirm">
                    Confirm password
                  </label>
                  <div className="mt-1">
                    <PasswordInput
                      id="reg-password-confirm"
                      value={form.password_confirm}
                      onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                      minLength={8}
                      required
                    />
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? 'Sending SMS code...' : 'Send SMS code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="reg-otp">
                    Verification code
                  </label>
                  <div className="mt-1">
                    <OtpInput
                      id="reg-otp"
                      value={otpCode}
                      onChange={setOtpCode}
                      disabled={submitting}
                      channel="sms"
                    />
                  </div>
                </div>
                <button type="submit" disabled={submitting || !isOtpComplete(otpCode)} className="btn-primary w-full">
                  {submitting ? 'Verifying...' : 'Verify & Create Account'}
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
                    Resend SMS code
                  </button>
                </div>
              </form>
            )}

            <p className="mt-6 text-sm text-muted text-center">
              Have an account? <Link to="/login" className="text-link font-medium">Login</Link>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
