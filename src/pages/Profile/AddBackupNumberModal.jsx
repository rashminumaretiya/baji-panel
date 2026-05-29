import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Modal from '../../shared/components/Modal.jsx'
import {
  COUNTRY_CODES,
  getDefaultCountryCode,
} from '../../config/countryCodes.js'

// Shared with AddWhatsAppModal / VerifyPrimaryNumberModal — kept inline so
// each modal file stays standalone (no shared CSS file to leak across pages).
const labelClass = 'block text-[13px] text-[#1e1e1e] mb-[6px]'
const countryCodeSelectClass =
  'block w-[80px] shrink-0 px-3 pr-[1.4rem] py-[6px] text-[14px] leading-[1.5] text-[#212529] bg-white border border-[#ced4da] rounded-l border-r-0 focus:outline-none appearance-none bg-no-repeat bg-[position:right_0.4rem_center] bg-[length:16px_12px] bg-[url("data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2016%2016%27%3e%3cpath%20fill=%27none%27%20stroke=%27%23343a40%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%20stroke-width=%272%27%20d=%27M2%205l6%206%206-6%27/%3e%3c/svg%3e")]'
const phoneInputClass =
  'block w-full px-3 py-[6px] text-[14px] leading-[1.5] text-[#212529] bg-white border border-[#ced4da] rounded-r focus:outline-none focus:border-(--light-gray)'
const addNumberBtnClass =
  'text-[11px] px-[8px] py-[5px] cursor-pointer inline-block font-semibold text-white border border-(--lg-primary) rounded bg-gradient-to-b from-(--xs-primary) to-(--xxs-primary) hover:from-(--xxs-primary) hover:to-(--xs-primary) hover:brightness-95 focus:from-(--xxs-primary) focus:to-(--xs-primary) focus:brightness-95 disabled:opacity-65 disabled:cursor-not-allowed'

export default function AddBackupNumberModal({ isOpen, onClose, onSuccess }) {
  const { t } = useTranslation()
  const token = useSelector(selectToken)
  const [countryCode, setCountryCode] = useState(getDefaultCountryCode)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setCountryCode(getDefaultCountryCode())
      setPhoneNumber('')
      setSubmitting(false)
    }
  }, [isOpen])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!phoneNumber || !token || submitting) return
    setSubmitting(true)
    try {
      await http.post(
        'user/backup-account-number',
        { countryCode, phoneNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onSuccess?.()
      onClose?.()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('modal.title.addBackupNo', 'Add Backup Number')}
      size="md"
    >
      <form onSubmit={handleAdd}>
        <div className="mb-3">
          <label className={labelClass} htmlFor="backupPhoneNumber">
            {t('profile.backupNumber', 'Backup Number')} :
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
              id="backupPhoneNumber"
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
    </Modal>
  )
}
