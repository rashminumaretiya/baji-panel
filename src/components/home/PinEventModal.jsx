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
          className="mb-2 block text-[14px] font-medium"
        >
          {t('common.aliasName')}
        </label>
        <input
          id="aliasInput"
          type="text"
          className="block w-full rounded border border-(--input-group-border) bg-white px-3 py-1.5 text-sm leading-normal text-(--dark) focus:border-(--blue) focus:shadow-[0_0_4px_2px_rgba(var(--blue-rgb),0.8)] focus:outline-none max-md:rounded-[1.6vw] max-md:px-[1.86vw] max-md:py-[2.66vw] max-md:text-[4vw]"
          placeholder={t('common.aliasName')}
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
        />
      </div>
      <div className="mt-3 flex justify-end gap-2 border-t border-[#e5e5e5] pt-3">
        <button
          type="button"
          className="rounded border border-black bg-gradient-to-b from-(--xxl-black) to-(--black) px-2 py-[5px] text-[11px] leading-3 font-bold text-white"
          onClick={onCancel}
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          className="rounded border border-(--lg-primary) bg-gradient-to-b from-(--xs-primary) to-(--xxs-primary) px-2 py-[5px] text-[11px] leading-3 font-bold text-white hover:bg-gradient-to-b hover:from-(--xxs-primary) hover:to-(--xs-primary) disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isInvalid}
          onClick={handleConfirm}
        >
          {t('common.confirm')}
        </button>
      </div>
    </Modal>
  )
}
