const OTP_MIN = 4
const OTP_MAX = 8

export function isOtpComplete(code) {
  const len = code.length
  return len >= OTP_MIN && len <= OTP_MAX
}

export { OTP_MIN, OTP_MAX }
