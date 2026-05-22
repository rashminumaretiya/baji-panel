import { useSelector } from 'react-redux'
import { Modal as BsModal } from 'react-bootstrap'
import {
  selectIsMcvYellowTheme,
  selectIsYellowTheme,
} from '../../../store/slices/commonSlice.js'
import './loginModel.scss'

export default function LoginModel({ isOpen, onClose }) {
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const isMcwCasinoTheme = useSelector(selectIsMcvYellowTheme)

  const btnClass = [
    'btn',
    'btn-primary',
    isYellowTheme && 'yellow-btn',
    isMcwCasinoTheme && 'mcw-btn',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <BsModal
      show={!!isOpen}
      onHide={onClose}
      size="md"
      centered
      backdrop="static"
      keyboard={false}
      dialogClassName="no-login"
    >
      <BsModal.Body>
        <div className="no-login text-center">
          <h4 className="pt-1 pb-2">Please login to proceed</h4>
          <div>
            <button type="button" className={btnClass} onClick={onClose}>
              OK
            </button>
          </div>
        </div>
      </BsModal.Body>
    </BsModal>
  )
}
