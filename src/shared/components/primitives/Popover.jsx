import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Hand-rolled drop-in for react-bootstrap's Overlay + Popover. Usage mirrors:
//
//   <Overlay show={open} target={targetRef.current} placement="bottom" rootClose
//            onHide={() => setOpen(false)}>
//     <Popover id="x">
//       <Popover.Body>...</Popover.Body>
//     </Popover>
//   </Overlay>
//
// Only the small subset we use in the codebase is implemented:
//   - placement: 'top' | 'bottom' | 'left' | 'right' (defaults to 'bottom')
//   - rootClose: close on outside click
//   - onHide: invoked when rootClose fires
//   - target: HTMLElement to anchor against

function getPlacement(target, popover, placement) {
  const t = target.getBoundingClientRect()
  const p = popover.getBoundingClientRect()
  const gap = 8
  switch (placement) {
    case 'top':
      return { top: t.top - p.height - gap, left: t.left + t.width / 2 - p.width / 2 }
    case 'left':
      return { top: t.top + t.height / 2 - p.height / 2, left: t.left - p.width - gap }
    case 'right':
      return { top: t.top + t.height / 2 - p.height / 2, left: t.right + gap }
    case 'bottom':
    default:
      return { top: t.bottom + gap, left: t.left + t.width / 2 - p.width / 2 }
  }
}

export function Overlay({ show, target, placement = 'bottom', rootClose = false, onHide, children }) {
  const popoverRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    if (!show || !target || !popoverRef.current) return
    const update = () => {
      if (!popoverRef.current) return
      setPos(getPlacement(target, popoverRef.current, placement))
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [show, target, placement])

  useEffect(() => {
    if (!show || !rootClose) return
    const onDocMouseDown = (e) => {
      if (popoverRef.current?.contains(e.target)) return
      if (target?.contains?.(e.target)) return
      onHide?.()
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [show, rootClose, onHide, target])

  if (!show || !target) return null

  return createPortal(
    <div
      ref={popoverRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 1060 }}
    >
      {children}
    </div>,
    document.body
  )
}

export function Popover({ id, className = '', children }) {
  return (
    <div
      id={id}
      role="tooltip"
      className={`popover overflow-hidden rounded-[4px] bg-white shadow-[0_4px_5px_rgba(var(--black-rgb),0.5)] -mt-2 ${className}`}
    >
      {children}
    </div>
  )
}

function PopoverBody({ className = '', children }) {
  return <div className={`p-2 ${className}`}>{children}</div>
}

function PopoverHeader({ className = '', children }) {
  return (
    <div className={`px-2 py-1 bg-[var(--xs-gray)] font-bold text-[13px] ${className}`}>
      {children}
    </div>
  )
}

Popover.Body = PopoverBody
Popover.Header = PopoverHeader
