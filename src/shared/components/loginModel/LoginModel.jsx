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
    ? 'bg-[var(--primary-yellow)] text-[var(--dark)] hover:bg-[var(--md-primary-yellow)]'
    : isMcwCasinoTheme
      ? 'bg-[var(--mcw-primary,var(--primary))] hover:opacity-90'
      : 'bg-[var(--primary)] hover:opacity-90'

  return (
    <Modal
      isOpen={!!isOpen}
      onClose={onClose}
      size="md"
      centered
      closeOnBackdrop={false}
      closeOnEscape={false}
    >
      {/* `.no-login` container — SCSS: `max-width: 320px; margin: 0 auto;`.
          The `.no-login .modal-content { box-shadow }` rule targeted bootstrap's
          card chrome; the in-house Modal primitive already supplies its own
          card shadow so we don't re-add an inner one. */}
      <div className="no-login max-w-[320px] mx-auto text-center">
        {/* SCSS: `h4 { font-size: 15px; font-weight: 700; line-height: 20px }` */}
        <h4 className="pt-1 pb-2 text-[15px] font-bold leading-5">
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
