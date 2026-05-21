import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Modal from '../../shared/components/Modal.jsx'
import './addWhatsAppModal.scss'

const COUNTRY_CODES = [
  { code: '+880', label: '+880' },
  { code: '+91', label: '+91' },
  { code: '+1', label: '+1' },
  { code: '+44', label: '+44' },
  { code: '+971', label: '+971' },
]

const RESEND_SECONDS = 42

export default function AddWhatsAppModal({ isOpen, onClose, onSuccess }) {
  const token = useSelector(selectToken)
  const [step, setStep] = useState('add')
  const [countryCode, setCountryCode] = useState('+880')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
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

  useEffect(() => {
    if (!isOpen) {
      clearTimer()
      setStep('add')
      setPhoneNumber('')
      setOtp('')
      setSubmitting(false)
      setTimer(0)
    }
  }, [isOpen])

  const requestHeaders = { headers: { Authorization: `Bearer ${token}` } }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!phoneNumber || !token || submitting) return
    setSubmitting(true)
    try {
      await http.post(
        'user/add-whatsapp-number',
        { countryCode, phoneNumber },
        requestHeaders
      )
      setStep('verify')
      startTimer()
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!otp || !token || submitting) return
    setSubmitting(true)
    try {
      await http.post(
        'user/verify-user-whatsapp-number',
        { otp },
        requestHeaders
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
      await http.post('user/send-otp-whatsapp-number', {}, requestHeaders)
      startTimer()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add WhatsApp Number"
      size="md"
    >
      {step === 'add' ? (
        <form onSubmit={handleAdd} className="whatsapp-form">
          <div className="form-group mb-3">
            <label className="form-label">Phone Number :</label>
            <div className="phone-wrapper">
              <select
                className="form-select country-code-select"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                className="form-control phone-input"
                placeholder="Enter Contact number"
                value={phoneNumber}
                onChange={(e) =>
                  setPhoneNumber(e.target.value.replace(/\D/g, ''))
                }
              />
            </div>
          </div>
          <div className="text-center">
            <button
              type="submit"
              className="btn btn-add-number"
              disabled={submitting}
            >
              Add Number
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="whatsapp-form">
          <div className="form-group mb-3">
            <label className="form-label">Enter Otp :</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter Otp"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            />
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
      )}
    </Modal>
  )
}
