import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Modal from '../../shared/components/Modal.jsx'
import './addWhatsAppModal.scss'

const RESEND_SECONDS = 60

export default function VerifyPrimaryNumberModal({ isOpen, onClose, onSuccess }) {
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
      { headers: { Authorization: `Bearer ${token}` } },
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
    sendOtp()
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
        { headers: { Authorization: `Bearer ${token}` } },
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
    <Modal isOpen={isOpen} onClose={onClose} title="Verify Primary Number" size="md">
      <form onSubmit={handleVerify} className="whatsapp-form">
        <div className="form-group mb-2">
          <label className="form-label">Enter Otp :</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Otp"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            onBlur={() => setTouched(true)}
          />
          {showRequiredError && (
            <span className="otp-error">Otp is required</span>
          )}
        </div>
        <div className="text-end mb-2">
          {timer > 0 ? (
            <a className="resend-otp">Resend otp in {timer} Seconds</a>
          ) : (
            <a className="cursor-pointer resend-now" onClick={handleResend}>
              Resend Now
            </a>
          )}
        </div>
        <div className="text-center">
          <button
            type="submit"
            className="btn btn-add-number"
            disabled={submitting}
          >
            Verify
          </button>
        </div>
      </form>
    </Modal>
  )
}
