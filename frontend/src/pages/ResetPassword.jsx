import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PasswordInput from '../components/PasswordInput'
import OtpInput from '../components/OtpInput'
import { isOtpComplete } from '../utils/otp'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../utils/apiError'
import { BRANDING } from '../constants'

export default function ResetPassword() {
  const { resetPassword, forgotPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const otpSessionFromState = location.state?.otpSession || ''
  const channel = location.state?.channel || 'email'
  const identifier = location.state?.identifier || ''

  const [otpSession, setOtpSession] = useState(otpSessionFromState)
  const [otpCode, setOtpCode] = useState('')
  const [form, setForm] = useState({ new_password: '', new_password_confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!otpSessionFromState && !otpSession) {
    return <Navigate to="/forgot-password" replace />
  }

  const channelLabel = channel === 'sms' ? 'SMS' : 'email'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (form.new_password !== form.new_password_confirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await resetPassword({
        otp_session: otpSession,
        code: otpCode,
        new_password: form.new_password,
        new_password_confirm: form.new_password_confirm,
      })
      setSuccess('Password updated. You can log in with your new password.')
      setTimeout(() => navigate('/login', { replace: true }), 1200)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid or expired code. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!identifier) {
      setError('Start again from Forgot Password to resend a code.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const payload = { channel }
      if (identifier.includes('@')) payload.email = identifier
      else payload.username = identifier
      const session = await forgotPassword(payload)
      setOtpSession(session)
      setOtpCode('')
      setSuccess(`A new code was sent via ${channelLabel}.`)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to resend code.'))
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
              Enter the verification code and choose a new password.
            </p>
          </div>
          <div className="card">
            <p className="text-primary font-bold text-xs uppercase tracking-[0.18em] mb-2">SCMS</p>
            <h1 className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">
              Reset Password
            </h1>
            <p className="text-muted text-sm mb-6">
              Code sent via {channelLabel}. After reset you will return to login.
            </p>
            {error && (
              <p
                className="text-error mb-4 text-sm p-3 rounded-xl bg-red-50 dark:bg-red-900/20"
                role="alert"
              >
                {error}
              </p>
            )}
            {success && (
              <p
                className="text-success mb-4 text-sm p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20"
                role="status"
              >
                {success}
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  htmlFor="reset-otp"
                >
                  Verification code
                </label>
                <div className="mt-1">
                  <OtpInput
                    id="reset-otp"
                    value={otpCode}
                    onChange={setOtpCode}
                    disabled={submitting}
                    channel={channel}
                  />
                </div>
              </div>
              <div>
                <label
                  className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  htmlFor="reset-password"
                >
                  New password
                </label>
                <div className="mt-1">
                  <PasswordInput
                    id="reset-password"
                    placeholder="At least 8 characters"
                    value={form.new_password}
                    onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <div>
                <label
                  className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  htmlFor="reset-password-confirm"
                >
                  Confirm new password
                </label>
                <div className="mt-1">
                  <PasswordInput
                    id="reset-password-confirm"
                    value={form.new_password_confirm}
                    onChange={(e) => setForm({ ...form, new_password_confirm: e.target.value })}
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting || !isOtpComplete(otpCode)}
                className="btn-primary w-full"
              >
                {submitting ? 'Updating...' : 'Set new password'}
              </button>
              <div className="flex gap-3 text-sm">
                <Link to="/forgot-password" className="text-link">
                  Back
                </Link>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={submitting}
                  className="text-link"
                >
                  Resend {channelLabel} code
                </button>
              </div>
            </form>
            <p className="mt-6 text-sm text-muted text-center">
              <Link to="/login" className="text-link font-medium">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
