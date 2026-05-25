import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrency } from '../../store/slices/authSlice.js'

const CloseIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    width="12"
    height="12"
    aria-hidden="true"
  >
    <path d="M20,2H4C2.9,2,2,2.9,2,4v16c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z M16.9,15.6L15.5,17l-3.5-3.5L8.4,17 L7,15.6l3.5-3.5L7,8.5l1.4-1.4l3.5,3.5l3.5-3.5l1.4,1.4L13.4,12L16.9,15.6z" />
  </svg>
)

function CloseButton({ onClose }) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer z-[2] text-white p-0 leading-none [&_svg]:h-3 [&_svg]:w-3"
    >
      {CloseIcon}
    </button>
  )
}

export default function FancyProgress({ config, onClose }) {
  const currency = useSelector(selectCurrency) || ''
  const timePeriodMs = Number(config?.timePeriod) || 0
  const totalSeconds = timePeriodMs / 1000

  const [timeLeft, setTimeLeft] = useState(totalSeconds)

  useEffect(() => {
    if (!timePeriodMs) return undefined
    const startedAt = Date.now()
    const id = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000
      const remaining = Math.max(0, totalSeconds - elapsed)
      setTimeLeft(remaining)
      if (remaining <= 0) clearInterval(id)
    }, 10)
    return () => clearInterval(id)
  }, [timePeriodMs, totalSeconds])

  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  const isSettled = !!(config?.success || config?.failed || config?.warning)
  useEffect(() => {
    if (!timePeriodMs || !isSettled) return undefined
    const timer = setTimeout(() => onCloseRef.current?.(config), timePeriodMs)
    return () => clearTimeout(timer)
  }, [config, timePeriodMs, isSettled])

  const handleClose = () => onClose?.(config)
  const durationStyle = { '--duration': `${totalSeconds}s` }

  if (config?.progress) {
    return (
      <div style={durationStyle}>
        <div className="relative z-[1] h-7 leading-6 text-center bg-(--xs-blue-bg) border-b border-(--tbl-border-color) overflow-hidden before:absolute before:content-[''] before:left-0 before:top-0 before:bottom-0 before:w-0 before:bg-[#b1c5d355] before:z-0 before:animate-[fancy-progress_var(--duration)_ease-in-out_forwards]">
          <p className="relative z-[1] inline-block mr-3 mb-0 text-[12px] font-bold text-[#565656]">
            Placing your bets, Please wait
          </p>
          <span className="relative z-[1] text-[11px] opacity-70">
            {timeLeft.toFixed(1)} sec remaining
          </span>
        </div>
      </div>
    )
  }

  if (config?.failed) {
    return (
      <div style={durationStyle}>
        <div className="relative h-7 leading-[26px] text-center bg-(--lg-red) border-b border-(--tbl-border-color)">
          <p className="mb-0 text-[12px] font-semibold text-white">
            {config?.errMsg || 'Bet can not be placed.'}
          </p>
          <CloseButton onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (config?.warning) {
    return (
      <div style={durationStyle}>
        <div className="relative h-7 leading-[26px] text-center bg-(--lg-yellow) border-b border-(--tbl-border-color)">
          <p className="mb-0 text-[12px] font-semibold">{config?.errMsg}</p>
          <CloseButton onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (config?.success) {
    return (
      <div style={durationStyle}>
        <div className="relative h-7 leading-[26px] text-center bg-(--md-green-primary) border-b border-(--tbl-border-color)">
          <p className="mb-0 text-[12px] font-semibold">
            Bet Matched {currency} at odds: {config?.odd}
            {config?.size ? ` / ${config.size}` : ''}
          </p>
          <CloseButton onClose={handleClose} />
        </div>
      </div>
    )
  }

  return null
}
