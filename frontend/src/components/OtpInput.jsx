import { OTP_MAX, OTP_MIN } from '../utils/otp'

export default function OtpInput({ value, onChange, disabled, channel = 'sms', id }) {
  const via = channel === 'email' ? 'email' : 'SMS'
  return (
    <div className="space-y-2">
      <input
        id={id}
        className="input text-center text-2xl tracking-[0.4em] font-mono"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={OTP_MAX}
        placeholder="• • • •"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, OTP_MAX))}
        disabled={disabled}
        required
        autoComplete="one-time-code"
        aria-label="One-time verification code"
      />
      <p className="text-xs text-muted text-center">
        Enter the {OTP_MIN}–{OTP_MAX} digit code from {via}
      </p>
    </div>
  )
}
