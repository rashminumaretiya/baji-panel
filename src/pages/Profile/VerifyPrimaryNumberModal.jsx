import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Modal from '../../shared/components/Modal.jsx'

const RESEND_SECONDS = 60

// Same shared Tailwind class strings used by AddWhatsAppModal /
// AddBackupNumberModal — duplicated here so this modal is standalone.
const labelClass = 'block text-[13px] text-[#1e1e1e] mb-[6px]'
const inputBaseClass =
  'block w-full px-3 py-[6px] text-[14px] leading-[1.5] text-[#212529] bg-white border border-[#ced4da] rounded focus:outline-none focus:border-(--light-gray)'
const addNumberBtnClass =
  'inline-block px-[18px] py-[6px] font-semibold text-white border border-(--lg-primary) rounded bg-gradient-to-b from-(--xs-primary) to-(--xxs-primary) hover:from-(--xxs-primary) hover:to-(--xs-primary) hover:brightness-95 focus:from-(--xxs-primary) focus:to-(--xs-primary) focus:brightness-95 disabled:opacity-65 disabled:cursor-not-allowed'
const resendLinkClass = 'text-[#1e6fff] underline text-[13px]'
const otpErrorClass = 'block text-[#d33] text-[12px] mt-[4px]'

export default function VerifyPrimaryNumberModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  const token = useSelector(selectToken)
  const [otp, setOtp] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [timer, setTimer] = useState(0)
  const timerRef = useRef(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startTimer = () => {
    setTimer(RESEND_SECONDS)
    clearTimer()
    timerRef.current = setInterval(() => {
      setTimer((s) => {
        if (s <= 1) {
          clearTimer()
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  const sendOtp = async () => {
    if (!token) return
    await http.post(
      'user/send-otp-primary-number',
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    startTimer()
  }

  useEffect(() => {
    if (!isOpen) {
      clearTimer()
      setOtp('')
      setTouched(false)
      setSubmitting(false)
      setTimer(0)
      return
    }
    // OTP is sent by the caller before the modal opens; just start the timer here.
    startTimer()
    return () => clearTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleVerify = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (!otp || !token || submitting) return
    setSubmitting(true)
    try {
      await http.post(
        'user/verify-user-primary-number',
        { otp },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onSuccess?.()
      onClose?.()
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (timer > 0 || submitting) return
    setSubmitting(true)
    try {
      await sendOtp()
    } finally {
      setSubmitting(false)
    }
  }

  const showRequiredError = touched && !otp

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Primary Number"
      size="md"
    >
      <form onSubmit={handleVerify}>
        <div className="mb-2">
          <label className={labelClass}>Enter Otp :</label>
          <input
            type="text"
            className={inputBaseClass}
            placeholder="Enter Otp"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            onBlur={() => setTouched(true)}
          />
          {showRequiredError && (
            <span className={otpErrorClass}>Otp is required</span>
          )}
        </div>
        <div className="mb-2 text-right">
          {timer > 0 ? (
            <a className={resendLinkClass}>Resend otp in {timer} Seconds</a>
          ) : (
            <a
              className={`${resendLinkClass} cursor-pointer`}
              onClick={handleResend}
            >
              Resend Now
            </a>
          )}
        </div>
        <div className="text-center">
          <button
            type="submit"
            className={addNumberBtnClass}
            disabled={submitting}
          >
            Verify
          </button>
        </div>
      </form>
    </Modal>
  )
}
