import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Hand-rolled replacement for the previous react-bootstrap Modal. Keeps the
// same public API (NgbModal defaults: backdrop='static', keyboard=false).
const SIZE_CLASS = {
  xs: 'max-w-[320px]',
  sm: 'max-w-[300px]',
  md: 'max-w-[500px]',
  lg: 'max-w-[800px]',
  xl: 'max-w-[1140px]',
}

const ANIM_MS = 300

const PHASE = {
  CLOSED: 'closed',
  ENTERING: 'entering',
  OPEN: 'open',
  EXITING: 'exiting',
}

const BACKDROP_CLASS = {
  [PHASE.ENTERING]: 'modal-backdrop-enter',
  [PHASE.OPEN]: 'modal-backdrop-open',
  [PHASE.EXITING]: 'modal-backdrop-exit',
}

const PANEL_CLASS = {
  [PHASE.ENTERING]: 'modal-panel-enter',
  [PHASE.OPEN]: 'modal-panel-open',
  [PHASE.EXITING]: 'modal-panel-exit',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  centered = false,
  centerTitle = false,
  hideClose = false,
  innerClass = '',
}) {
  const [phase, setPhase] = useState(() =>
    isOpen ? PHASE.ENTERING : PHASE.CLOSED
  )
  const cardRef = useRef(null)
  const prevIsOpenRef = useRef(isOpen)

  const isVisible = phase !== PHASE.CLOSED

  const finishClose = useCallback(() => {
    setPhase((current) => {
      if (current === PHASE.CLOSED) return current
      onClose?.()
      return PHASE.CLOSED
    })
  }, [onClose])

  const startClose = useCallback(() => {
    setPhase((current) => {
      if (current === PHASE.EXITING || current === PHASE.CLOSED) return current
      return PHASE.EXITING
    })
  }, [])

  useEffect(() => {
    const wasOpen = prevIsOpenRef.current
    prevIsOpenRef.current = isOpen

    if (isOpen && !wasOpen) {
      setPhase(PHASE.ENTERING)
      return
    }

    if (!isOpen && wasOpen) {
      startClose()
    }
  }, [isOpen, startClose])

  useEffect(() => {
    if (!isVisible) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isVisible])

  useEffect(() => {
    if (phase !== PHASE.ENTERING && phase !== PHASE.EXITING) return

    const timer = setTimeout(() => {
      if (phase === PHASE.ENTERING) {
        setPhase((current) =>
          current === PHASE.ENTERING ? PHASE.OPEN : current
        )
      }
      if (phase === PHASE.EXITING) {
        finishClose()
      }
    }, ANIM_MS + 50)

    return () => clearTimeout(timer)
  }, [phase, finishClose])

  const handlePanelAnimationEnd = (e) => {
    if (e.target !== e.currentTarget) return
    if (e.animationName !== 'modal-slide-down' && e.animationName !== 'modal-slide-up') {
      return
    }

    if (phase === PHASE.ENTERING) {
      setPhase(PHASE.OPEN)
      return
    }

    if (phase === PHASE.EXITING) {
      finishClose()
    }
  }

  const handleBackdropClick = () => {
    if (phase !== PHASE.OPEN) return

    const card = cardRef.current
    if (!card || card.classList.contains('modal-panel-shake')) return

    card.classList.add('modal-panel-shake')

    const removeShake = () => {
      card.classList.remove('modal-panel-shake')
      card.removeEventListener('animationend', removeShake)
    }

    card.addEventListener('animationend', removeShake)
  }

  if (!isVisible) return null

  const sizeClass = SIZE_CLASS[size] ?? SIZE_CLASS.md
  const backdropClass = BACKDROP_CLASS[phase] ?? ''
  const panelClass = PANEL_CLASS[phase] ?? ''

  return createPortal(
    <div
      className="fixed inset-0 z-1050 overflow-x-hidden overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`fixed inset-0 bg-black/50 ${backdropClass}`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div
        className={`pointer-events-none relative z-10 mx-auto my-7 ${centered ? 'flex min-h-[calc(100%-3.5rem)] items-center' : ''}`}
      >
        <div
          className={`pointer-events-auto relative mx-auto w-full ${sizeClass} ${panelClass}`}
          onAnimationEnd={handlePanelAnimationEnd}
        >
          <div
            ref={cardRef}
            className={`rounded-md bg-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] ${innerClass}`}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-[#e5e5e5] px-4 py-3">
                <h4
                  className={`m-0 font-[Tahoma,Helvetica,sans-serif] text-base font-bold text-[#3b5160] ${centerTitle ? 'flex-1 text-center' : ''}`}
                >
                  {title}
                </h4>
                {!hideClose && (
                  <span
                    className="cursor-pointer leading-none text-[#3b5160]"
                    onClick={startClose}
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
            )}
            <div className="p-4">{children}</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
