import { useEffect } from 'react'
import { createPortal } from 'react-dom'

// Hand-rolled replacement for the previous react-bootstrap Modal. Keeps the
// same public API (NgbModal defaults: backdrop='static', keyboard=false).
const SIZE_CLASS = {
  sm: 'max-w-[300px]',
  md: 'max-w-[500px]',
  lg: 'max-w-[800px]',
  xl: 'max-w-[1140px]',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  closeOnBackdrop = false,
  closeOnEscape = false,
  centered = false,
  // Opt-in header variants — defaults keep the existing left-title + close X look.
  centerTitle = false,
  hideClose = false,
}) {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, closeOnEscape, onClose])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdrop = () => {
    if (closeOnBackdrop) onClose?.()
  }

  const sizeClass = SIZE_CLASS[size] ?? SIZE_CLASS.md

  return createPortal(
    <div
      className="fixed inset-0 z-[1050] overflow-x-hidden overflow-y-auto bg-black/50"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`mx-auto my-[1.75rem] ${centered ? 'min-h-[calc(100%-3.5rem)] flex items-center' : ''}`}
      >
        <div
          className={`relative mx-auto w-full ${sizeClass} bg-white rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.2)]`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[#e5e5e5] px-4 py-3">
            <h4
              className={`m-0 text-base font-bold text-[#3b5160] font-[Tahoma,Helvetica,sans-serif] ${centerTitle ? 'flex-1 text-center' : ''}`}
            >
              {title}
            </h4>
            {!hideClose && (
              <span
                className="cursor-pointer leading-none text-[#3b5160]"
                onClick={onClose}
                role="button"
                aria-label="Close"
              >
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
              </span>
            )}
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  )
}
