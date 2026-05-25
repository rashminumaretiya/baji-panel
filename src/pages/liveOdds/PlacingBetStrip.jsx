import { memo, useEffect, useState } from 'react'

// Animated progress strip rendered below an inline bet slip during placement.
// Mirrors Angular's `.fl-strip.fl-strip--loading` design — fills 0→100% over
// `durationMs` and shows seconds remaining alongside the wait label.
export const PlacingBetStrip = memo(function PlacingBetStrip({
  durationMs = 5000,
}) {
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => {
      const e = Date.now() - start
      setElapsedMs(e)
      if (e >= durationMs) clearInterval(id)
    }, 100)
    return () => clearInterval(id)
  }, [durationMs])

  const progress = Math.min((elapsedMs / durationMs) * 100, 100)
  const remainingSec = Math.max((durationMs - elapsedMs) / 1000, 0).toFixed(1)

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative overflow-hidden flex items-center justify-between h-7 px-3 bg-[var(--xl-light-bg)] text-[var(--dark)]"
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 bg-[var(--xs-green-primary)] transition-[width] duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />
      <span className="relative z-[1] text-[12px] font-medium">
        Placing bet please wait...
      </span>
      <span className="relative z-[1] text-[12px] font-medium tabular-nums">
        {remainingSec} sec remaining
      </span>
    </div>
  )
})
