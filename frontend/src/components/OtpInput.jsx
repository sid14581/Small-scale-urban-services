const OTP_MIN = 4
const OTP_MAX = 8

export function isOtpComplete(code) {
  const len = code.length
  return len >= OTP_MIN && len <= OTP_MAX
}

export default function OtpInput({ value, onChange, disabled }) {
  return (
    <input
      className="input text-center text-lg tracking-widest font-mono"
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={OTP_MAX}
      placeholder="Enter code"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, OTP_MAX))}
      disabled={disabled}
      required
      autoComplete="one-time-code"
    />
  )
}

export { OTP_MIN, OTP_MAX }
