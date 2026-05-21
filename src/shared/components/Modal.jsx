import { Modal as BsModal } from 'react-bootstrap'
import './modal.scss'

// Ported from Archive (Angular NgbModal usage):
//   NgbModal.open(Cmp, { size: 'md', keyboard: false, backdrop: 'static', centered: true })
// Defaults here mirror the Angular options exactly. `centered` is opt-in so the
// modal sits near the top of the viewport (matches the user's earlier ask).
export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  closeOnBackdrop = false,
  closeOnEscape = false,
  centered = false,
}) {
  return (
    <BsModal
      show={!!isOpen}
      onHide={onClose}
      size={size}
      centered={centered}
      backdrop={closeOnBackdrop ? true : 'static'}
      keyboard={closeOnEscape}
      dialogClassName={`modal-${size}`}
    >
      <div className="modal-header justify-content-between">
        <h4 className="modal-title title-text mb-0">{title}</h4>
        <span
          className="close-modal cursor-pointer"
          onClick={onClose}
          role="button"
          aria-label="Close"
        >
          <i className="close-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              width="16"
              height="16"
              viewBox="0 0 16 16"
            >
              <path
                d="M0 14.545L1.455 16 8 9.455 14.545 16 16 14.545 9.455 8 16 1.455 14.545 0 8 6.545 1.455 0 0 1.455 6.545 8z"
                fillRule="evenodd"
              />
            </svg>
          </i>
        </span>
      </div>
      <div className="modal-body">{children}</div>
    </BsModal>
  )
}
