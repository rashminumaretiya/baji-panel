import { useEffect, useState } from 'react'
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

export default function AddBackupNumberModal({ isOpen, onClose, onSuccess }) {
  const token = useSelector(selectToken)
  const [countryCode, setCountryCode] = useState('+880')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setCountryCode('+880')
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
      title="Add Backup Number"
      size="md"
    >
      <form onSubmit={handleAdd} className="whatsapp-form">
        <div className="form-group mb-3">
          <label className="form-label">Backup Number :</label>
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
    </Modal>
  )
}
