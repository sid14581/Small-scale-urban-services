import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PasswordInput from '../components/PasswordInput'
import OtpInput, { isOtpComplete } from '../components/OtpInput'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../utils/apiError'
import { BRANDING } from '../constants'

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
      await verifyOtp(otpSession, otpCode)
      navigate('/complaints')
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
          <div className="hidden md:flex flex-col items-center justify-center rounded-2xl panel-accent p-8 overflow-hidden">
            <img
              src={BRANDING.auth}
              alt="Smart city viewpoint"
              className="w-full max-h-72 object-contain mb-4"
            />
            <p className="text-muted text-center text-sm">
              Join your community in building a smarter city
            </p>
          </div>
          <div className="card">
            <img
              src={BRANDING.hero}
              alt="SCMS"
              className="w-12 h-12 mx-auto mb-4 md:hidden"
            />
            <h2 className="text-2xl font-bold mb-6">Register</h2>
            <p className="text-muted text-sm mb-4">Create a citizen account to file complaints and feedback.</p>
            {error && <p className="text-error mb-4 text-sm">{error}</p>}

            {step === 1 ? (
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <input className="input" placeholder="First Name" value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
                <input className="input" type="email" placeholder="Email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                <input className="input" placeholder="Username" value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                <input className="input" placeholder="Phone (E.164, e.g. +15551234567)" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                <PasswordInput placeholder="Password (min 8 chars)" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
                <PasswordInput placeholder="Confirm password" value={form.password_confirm}
                  onChange={(e) => setForm({ ...form, password_confirm: e.target.value })} minLength={8} required />
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <p className="text-muted text-sm">
                  Enter the verification code sent to {form.phone}.
                </p>
                <OtpInput value={otpCode} onChange={setOtpCode} disabled={submitting} />
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
                    Resend OTP
                  </button>
                </div>
              </form>
            )}

            <p className="mt-4 text-sm text-muted">
              Have an account? <Link to="/login" className="text-link">Login</Link>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
