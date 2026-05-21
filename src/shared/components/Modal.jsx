import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './modal.scss'

export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  closeOnBackdrop = false,
  closeOnEscape = false,
}) {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, closeOnEscape, onClose])

  useEffect(() => {
    if (!isOpen) return
    const { body } = document
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const prevOverflow = body.style.overflow
    const prevPaddingRight = body.style.paddingRight
    body.classList.add('modal-open')
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`
    return () => {
      body.classList.remove('modal-open')
      body.style.overflow = prevOverflow
      body.style.paddingRight = prevPaddingRight
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <>
      <div className="modal-backdrop fade show" />
      <div
        className="modal fade show d-block"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        onClick={(e) => {
          if (closeOnBackdrop && e.target === e.currentTarget) onClose?.()
        }}
      >
        <div
          className={`modal-dialog modal-${size}`}
          role="document"
        >
          <div className="modal-content">
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
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
