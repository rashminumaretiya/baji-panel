import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  selectIsMcvYellowTheme,
  selectIsYellowTheme,
} from '../../../store/slices/commonSlice.js'
import Modal from '../Modal.jsx'

// Tailwind-only port of loginModel.scss. Uses the in-house Modal primitive
// instead of react-bootstrap (matches the project-wide migration).
export default function LoginModel({ isOpen, onClose }) {
  const { t } = useTranslation()
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const isMcwCasinoTheme = useSelector(selectIsMcvYellowTheme)

  // Replaces `.btn.btn-primary` (+ optional `.yellow-btn` / `.mcw-btn` theme
  // overrides). Width was 50.4285714286% in the original SCSS — preserved
  // verbatim so the button keeps its centred half-width footprint.
  const btnBaseClass =
    'inline-block w-[50.4285714286%] mx-auto mt-[7px] py-1.5 px-3 rounded text-white font-semibold cursor-pointer transition-colors'
  const themeClass = isYellowTheme
    ? 'bg-(--primary-yellow) text-(--dark) hover:bg-(--md-primary-yellow)'
    : isMcwCasinoTheme
      ? 'bg-[var(--mcw-primary,var(--primary))] hover:opacity-90'
      : 'bg-(--primary) hover:opacity-90'

  return (
    <Modal
      isOpen={!!isOpen}
      size="xs"
      centered
      closeOnBackdrop={false}
      closeOnEscape={false}
      hideClose
      innerClass="shadow-[0_4px_5px_rgba(var(--black-rgb),0.5)]!"
    >
      {/* `.no-login` container — SCSS: `max-width: 320px; margin: 0 auto;`.
          The `.no-login .modal-content { box-shadow }` rule targeted bootstrap's
          card chrome; the in-house Modal primitive already supplies its own
          card shadow so we don't re-add an inner one. */}
      <div className="no-login mx-auto max-w-[320px] text-center">
        {/* SCSS: `h4 { font-size: 15px; font-weight: 700; line-height: 20px }` */}
        <h4 className="pt-1 pb-2 text-[15px] leading-5 font-bold">
          {t('common.pleaseLogin', 'Please login to proceed')}
        </h4>
        <div>
          <button
            type="button"
            className={`${btnBaseClass} ${themeClass}`}
            onClick={onClose}
          >
            {t('common.ok', 'OK')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
