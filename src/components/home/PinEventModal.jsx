import { useState } from 'react'
import { Modal } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

export default function PinEventModal({ show, eventName, onConfirm, onCancel }) {
  const { t } = useTranslation()
  const [alias, setAlias] = useState(eventName || '')

  const isInvalid = alias.trim().length === 0

  function handleConfirm() {
    if (isInvalid) return
    onConfirm(alias.trim())
  }

  return (
    <Modal show={show} onHide={onCancel} centered backdrop="static" keyboard={false}>
      <div className="modal-header position-relative d-flex align-items-center justify-content-between">
        <h6 className="mb-0">{t('common.pinEvent')}</h6>
        <img
          src="/img/modal-close.png"
          alt="close"
          onClick={onCancel}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
        />
      </div>
      <div className="modal-body">
        <div className="mb-3">
          <label htmlFor="aliasInput" className="form-label">{t('common.aliasName')}</label>
          <input
            id="aliasInput"
            type="text"
            className="form-control"
            placeholder={t('common.aliasName')}
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
          />
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn btn-primary" disabled={isInvalid} onClick={handleConfirm}>
          {t('common.confirm')}
        </button>
      </div>
    </Modal>
  )
}
