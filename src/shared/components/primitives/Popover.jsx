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
// Supported placement values (Bootstrap / Popper naming):
//   top | top-start | top-end
//   bottom | bottom-start | bottom-end
//   left | left-start | left-end
//   right | right-start | right-end
//
// flip (default true): when the preferred placement overflows the viewport,
// tries sensible alternates (e.g. bottom-end → bottom-start → top-end → top-start).

const GAP = 8
const VIEWPORT_PADDING = 8

const FLIP_CANDIDATES = {
  'bottom-end': [
    'bottom-end',
    'bottom-start',
    'top-end',
    'top-start',
    'bottom',
  ],
  'bottom-start': [
    'bottom-start',
    'bottom-end',
    'top-start',
    'top-end',
    'bottom',
  ],
  'top-end': ['top-end', 'top-start', 'bottom-end', 'bottom-start', 'top'],
  'top-start': ['top-start', 'top-end', 'bottom-start', 'bottom-end', 'top'],
  'left-end': ['left-end', 'left-start', 'right-end', 'right-start', 'left'],
  'left-start': ['left-start', 'left-end', 'right-start', 'right-end', 'left'],
  'right-end': ['right-end', 'right-start', 'left-end', 'left-start', 'right'],
  'right-start': [
    'right-start',
    'right-end',
    'left-start',
    'left-end',
    'right',
  ],
  bottom: ['bottom', 'top'],
  top: ['top', 'bottom'],
  left: ['left', 'right'],
  right: ['right', 'left'],
}

function parsePlacement(placement) {
  const parts = placement.split('-')
  if (parts.length === 1) return { base: parts[0], align: 'center' }
  return { base: parts[0], align: parts[1] }
}

function computePosition(target, popover, placement) {
  const t = target.getBoundingClientRect()
  const w = popover.offsetWidth
  const h = popover.offsetHeight
  const { base, align } = parsePlacement(placement)

  let top = 0
  let left = 0

  switch (base) {
    case 'top':
      top = t.top - h - GAP
      if (align === 'start') left = t.left
      else if (align === 'end') left = t.right - w
      else left = t.left + t.width / 2 - w / 2
      break
    case 'bottom':
      top = t.bottom + GAP
      if (align === 'start') left = t.left
      else if (align === 'end') left = t.right - w
      else left = t.left + t.width / 2 - w / 2
      break
    case 'left':
      left = t.left - w - GAP
      if (align === 'start') top = t.top
      else if (align === 'end') top = t.bottom - h
      else top = t.top + t.height / 2 - h / 2
      break
    case 'right':
      left = t.right + GAP
      if (align === 'start') top = t.top
      else if (align === 'end') top = t.bottom - h
      else top = t.top + t.height / 2 - h / 2
      break
    default:
      top = t.bottom + GAP
      left = t.left + t.width / 2 - w / 2
  }

  return { top, left }
}

function fitsViewport({ top, left }, width, height) {
  return (
    top >= VIEWPORT_PADDING &&
    left >= VIEWPORT_PADDING &&
    top + height <= window.innerHeight - VIEWPORT_PADDING &&
    left + width <= window.innerWidth - VIEWPORT_PADDING
  )
}

function resolvePlacement(target, popover, placement, flip) {
  const w = popover.offsetWidth
  const h = popover.offsetHeight
  const candidates = flip
    ? (FLIP_CANDIDATES[placement] ?? [placement])
    : [placement]

  for (const candidate of candidates) {
    const pos = computePosition(target, popover, candidate)
    if (fitsViewport(pos, w, h)) return pos
  }

  return computePosition(target, popover, placement)
}

export function Overlay({
  show,
  target,
  placement = 'bottom',
  flip = true,
  rootClose = false,
  onHide,
  children,
}) {
  const popoverRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    if (!show || !target || !popoverRef.current) return
    const update = () => {
      if (!popoverRef.current) return
      setPos(resolvePlacement(target, popoverRef.current, placement, flip))
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [show, target, placement, flip])

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
      className={`popover -mt-2 overflow-hidden rounded-[4px] bg-white shadow-[0_4px_5px_rgba(var(--black-rgb),0.5)] ${className}`}
    >
      {children}
    </div>
  )
}

function PopoverBody({ className = '', children }) {
  return <div className={`${className}`}>{children}</div>
}

function PopoverHeader({ className = '', children }) {
  return (
    <div
      className={`bg-(--xs-gray) px-2 py-1 text-[13px] font-bold ${className}`}
    >
      {children}
    </div>
  )
}

Popover.Body = PopoverBody
Popover.Header = PopoverHeader
