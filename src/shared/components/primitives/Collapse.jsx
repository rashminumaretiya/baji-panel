import { useEffect, useRef, useState } from 'react'

// Drop-in for react-bootstrap/Collapse used as:
//   <Collapse in={open}><div>...</div></Collapse>
// Animates max-height between 0 and the natural scrollHeight.
//
// Closing requires a small dance: the open state sits at `maxHeight: 'none'`
// (so child content can reflow freely) but CSS can't transition from `none`
// to a numeric value. We commit an explicit `${h}px` first, wait two rAFs
// for the browser to paint that intermediate height, then transition to 0.
export default function Collapse({ in: open, children, className = '' }) {
  const ref = useRef(null)
  const [maxHeight, setMaxHeight] = useState(open ? 'none' : '0px')
  const mounted = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    // Skip the very first effect — initial state is already correct.
    if (!mounted.current) {
      mounted.current = true
      return undefined
    }

    const h = el.scrollHeight

    if (open) {
      // Currently 0px → animate to scrollHeight, then release to 'none' so
      // children that grow after open (e.g. async content) aren't clipped.
      setMaxHeight(`${h}px`)
      const t = setTimeout(() => setMaxHeight('none'), 350)
      return () => clearTimeout(t)
    }

    // Closing: commit explicit height first so the next frame has a numeric
    // starting value for the transition.
    setMaxHeight(`${h}px`)
    let raf1
    let raf2
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setMaxHeight('0px'))
    })
    return () => {
      cancelAnimationFrame(raf1)
      if (raf2) cancelAnimationFrame(raf2)
    }
  }, [open])

  return (
    <div
      ref={ref}
      style={{
        maxHeight,
        overflow: maxHeight === 'none' ? 'visible' : 'hidden',
        transition: 'max-height 0.35s ease',
      }}
      className={className}
      aria-hidden={!open}
    >
      {children}
    </div>
  )
}
