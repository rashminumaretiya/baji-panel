import { useEffect, useRef } from 'react'
import './newsLine.scss'

const DEFAULT_MESSAGE =
  'সম্মানিত Baji36 এর ইউজার আমাদের উইথড্র সকাল ৯ টা থেকে রাত ১২ টা পর্যন্ত দেয়া হয়। রাত ১২ টার পরে সে সকল উইথড্র আসবে সেগুলা সকাল ৯ টার পরে দেয়া হবে। Baji36 এর সাথে থাকার জন্য ধন্যবাদ    |    Welcome to our exchange!'

const TICKER_SPEED_PX_PER_SEC = 70

export default function NewsLine({ message = DEFAULT_MESSAGE, onClick }) {
  const tickerRef = useRef(null)

  useEffect(() => {
    const el = tickerRef.current
    if (!el) return

    const apply = () => {
      const contentWidth = el.scrollWidth
      const containerWidth = el.parentElement?.offsetWidth ?? 0
      const duration = (contentWidth + containerWidth) / TICKER_SPEED_PX_PER_SEC
      el.style.setProperty('--ticker-start', `${containerWidth}px`)
      el.style.animationDuration = `${duration}s`
      el.style.animationPlayState = 'running'
    }

    apply()
    const observer = new ResizeObserver(apply)
    if (el.parentElement) observer.observe(el.parentElement)
    return () => observer.disconnect()
  }, [message])

  return (
    <div className="news-broadcast d-flex align-items-center">
      <div className="sticky-chip position-relative d-inline-flex align-items-center justify-content-center">
        <span className="mic_icon"></span>
        <span className="news-tag">News</span>
      </div>
      <div className="ticker-wrap" onClick={onClick} role={onClick ? 'button' : undefined}>
        <div
          ref={tickerRef}
          className="ticker-content"
          dangerouslySetInnerHTML={{ __html: message }}
        />
      </div>
    </div>
  )
}
