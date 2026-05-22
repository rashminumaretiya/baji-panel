import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../../shared/components/Modal.jsx'

export default function PinEventModal({
  show,
  eventName,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation()
  const [alias, setAlias] = useState(eventName || '')

  const isInvalid = alias.trim().length === 0

  function handleConfirm() {
    if (isInvalid) return
    onConfirm(alias.trim())
  }

  return (
    <Modal
      isOpen={show}
      onClose={onCancel}
      title={t('common.pinEvent')}
      size="md"
      centered
    >
      <div className="mb-3">
        <label
          htmlFor="aliasInput"
          className="block mb-2 text-[14px] font-medium"
        >
          {t('common.aliasName')}
        </label>
        <input
          id="aliasInput"
          type="text"
          className="block w-full px-3 py-1.5 text-sm leading-normal text-[var(--dark)] bg-white border border-[var(--input-group-border)] rounded focus:outline-none focus:border-[var(--blue)] focus:shadow-[0_0_4px_2px_rgba(var(--blue-rgb),0.8)] max-md:px-[1.86vw] max-md:py-[2.66vw] max-md:text-[4vw] max-md:rounded-[1.6vw]"
          placeholder={t('common.aliasName')}
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[#e5e5e5]">
        <button
          type="button"
          className="px-2 py-[5px] text-[11px] font-bold leading-3 rounded border text-white border-black bg-gradient-to-b from-[var(--xxl-black)] to-[var(--black)]"
          onClick={onCancel}
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          className="px-2 py-[5px] text-[11px] font-bold leading-3 rounded border text-white border-[var(--lg-primary)] bg-gradient-to-b from-[var(--xs-primary)] to-[var(--xxs-primary)] hover:bg-gradient-to-b hover:from-[var(--xxs-primary)] hover:to-[var(--xs-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isInvalid}
          onClick={handleConfirm}
        >
          {t('common.confirm')}
        </button>
      </div>
    </Modal>
  )
}
