import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Modal from '../../shared/components/Modal.jsx'
import {
  COUNTRY_CODES,
  getDefaultCountryCode,
} from '../../config/countryCodes.js'

const RESEND_SECONDS = 42

const labelClass = 'block text-[13px] text-[#1e1e1e] mb-[6px]'

const inputBaseClass =
  'block w-full px-3 py-[6px] text-[14px] leading-[1.5] text-[#212529] bg-white border border-[#ced4da] rounded focus:outline-none focus:border-(--light-gray)'

const countryCodeSelectClass =
  'block w-[80px] shrink-0 px-3 pr-[1.4rem] py-[6px] text-[14px] leading-[1.5] text-[#212529] bg-white border border-[#ced4da] rounded-l border-r-0 focus:outline-none appearance-none bg-no-repeat bg-[position:right_0.4rem_center] bg-[length:16px_12px] bg-[url("data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2016%2016%27%3e%3cpath%20fill=%27none%27%20stroke=%27%23343a40%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%20stroke-width=%272%27%20d=%27M2%205l6%206%206-6%27/%3e%3c/svg%3e")]'
const phoneInputClass =
  'block w-full px-3 py-[6px] text-[14px] leading-[1.5] text-[#212529] bg-white border border-[#ced4da] rounded-r focus:outline-none focus:border-(--light-gray)'

const addNumberBtnClass =
  'text-[11px] px-[8px] py-[5px] cursor-pointer inline-block font-semibold text-white border border-(--lg-primary) rounded bg-gradient-to-b from-(--xs-primary) to-(--xxs-primary) hover:from-(--xxs-primary) hover:to-(--xs-primary) hover:brightness-95 focus:from-(--xxs-primary) focus:to-(--xs-primary) focus:brightness-95 disabled:opacity-65 disabled:cursor-not-allowed'
const resendLinkClass = 'text-[#1e6fff] underline text-[13px]'

function AddWhatsAppModalForm({ onClose, onSuccess }) {
  const { t } = useTranslation()
  const token = useSelector(selectToken)
  const [step, setStep] = useState('add')
  const [countryCode, setCountryCode] = useState(getDefaultCountryCode)
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

  useEffect(() => () => clearTimer(), [])

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

  if (step === 'add') {
    return (
      <form onSubmit={handleAdd}>
        <div className="mb-3">
          <label className={labelClass} htmlFor="waPhoneNumber">
            {t('common.phoneNumber', 'Phone Number')} :
          </label>
          <div className="relative flex items-stretch">
            <select
              className={countryCodeSelectClass}
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              aria-label={t('common.countryCode', 'Country code')}
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
            <input
              id="waPhoneNumber"
              type="tel"
              className={phoneInputClass}
              placeholder={t(
                'common.placeholder.phoneNumber',
                'Enter Phone Number'
              )}
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
            className={addNumberBtnClass}
            disabled={submitting}
          >
            {t('common.button.addNumber', 'Add Number')}
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleVerify}>
      <div className="mb-3">
        <label className={labelClass} htmlFor="waOtp">
          {t('common.placeholder.otp', 'Enter Otp')} :
        </label>
        <input
          id="waOtp"
          type="text"
          className={inputBaseClass}
          placeholder={t('common.placeholder.otp', 'Enter Otp')}
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
        />
      </div>
      <div className="mb-2 text-right">
        {timer > 0 ? (
          <a className={resendLinkClass}>
            {t('common.resendOtpIn', 'Resend otp in')} {timer}{' '}
            {t('common.seconds', 'Seconds')}
          </a>
        ) : (
          <a
            className={`${resendLinkClass} cursor-pointer`}
            onClick={handleResend}
          >
            {t('common.resendNow', 'Resend Now')}
          </a>
        )}
      </div>
      <div className="text-center">
        <button
          type="submit"
          className={addNumberBtnClass}
          disabled={submitting}
        >
          {t('common.verify', 'Verify')}
        </button>
      </div>
    </form>
  )
}

export default function AddWhatsAppModal({ isOpen, onClose, onSuccess }) {
  const { t } = useTranslation()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('modal.title.addWhatsappNo', 'Add Whatsapp Number')}
      size="md"
    >
      {isOpen ? (
        <AddWhatsAppModalForm onClose={onClose} onSuccess={onSuccess} />
      ) : null}
    </Modal>
  )
}
