import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../utils/apiError'
import { BRANDING } from '../constants'

export default function ForgotPassword() {
  const { forgotPassword } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [channel, setChannel] = useState('email')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const trimmed = identifier.trim()
      const payload = { channel }
      if (trimmed.includes('@')) {
        payload.email = trimmed
      } else {
        payload.username = trimmed
      }
      const otpSession = await forgotPassword(payload)
      navigate('/reset-password', {
        replace: true,
        state: { otpSession, channel, identifier: trimmed },
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to start password reset. Please try again.'))
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
              Reset your password using a one-time code sent by email or SMS.
            </p>
          </div>
          <div className="card">
            <p className="text-primary font-bold text-xs uppercase tracking-[0.18em] mb-2">SCMS</p>
            <h1 className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">Forgot Password</h1>
            <p className="text-muted text-sm mb-6">
              Enter your username or email, then choose how to receive a verification code.
            </p>
            {error && <p className="text-error mb-4 text-sm p-3 rounded-xl bg-red-50 dark:bg-red-900/20" role="alert">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="forgot-identifier">
                  Username or email
                </label>
                <input
                  id="forgot-identifier"
                  className="input mt-1"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <fieldset>
                <legend className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Send code via
                </legend>
                <div className="flex gap-3">
                  {[
                    ['email', 'Email'],
                    ['sms', 'SMS'],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-colors min-h-[44px] ${
                        channel === value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-slate-200 dark:border-slate-700 text-muted hover:border-primary/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="channel"
                        value={value}
                        checked={channel === value}
                        onChange={() => setChannel(value)}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Sending code...' : 'Send reset code'}
              </button>
            </form>
            <p className="mt-6 text-sm text-muted text-center">
              Remembered it? <Link to="/login" className="text-link font-medium">Back to Login</Link>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
