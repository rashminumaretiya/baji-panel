import { useEffect, useRef, useState } from 'react'

// Drop-in for react-bootstrap/Collapse used as:
//   <Collapse in={open}><div>...</div></Collapse>
// Animates max-height between 0 and the natural scrollHeight.
export default function Collapse({ in: open, children, className = '' }) {
  const ref = useRef(null)
  const [maxHeight, setMaxHeight] = useState(open ? 'none' : '0px')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open) {
      const h = el.scrollHeight
      setMaxHeight(`${h}px`)
      const t = setTimeout(() => setMaxHeight('none'), 350)
      return () => clearTimeout(t)
    } else {
      // Set explicit height first, then transition to 0 on next frame.
      const h = el.scrollHeight
      setMaxHeight(`${h}px`)
      requestAnimationFrame(() => setMaxHeight('0px'))
    }
  }, [open])

  return (
    <div
      ref={ref}
      style={{ maxHeight, overflow: maxHeight === 'none' ? 'visible' : 'hidden', transition: 'max-height 0.35s ease' }}
      className={className}
      aria-hidden={!open}
    >
      {children}
    </div>
  )
}
