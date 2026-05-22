import { useEffect, useRef } from 'react'

const DEFAULT_MESSAGE =
  'সম্মানিত Baji36 এর ইউজার আমাদের উইথড্র সকাল ৯ টা থেকে রাত ১২ টা পর্যন্ত দেয়া হয়। রাত ১২ টার পরে সে সকল উইথড্র আসবে সেগুলা সকাল ৯ টার পরে দেয়া হবে। Baji36 এর সাথে থাকার জন্য ধন্যবাদ    |    Welcome to our exchange!'

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
    <div className="flex items-center h-[25px] text-white bg-gradient-to-t from-[var(--3xl-blue)] to-[var(--lg-blue)] hover:[&_span]:underline max-mobile:w-full max-mobile:h-[6.67vw] max-mobile:mb-px">
      <div className="relative inline-flex items-center justify-center min-w-[72px] h-full before:absolute before:content-[''] before:w-[7px] before:h-[25px] before:bg-[url(/img/svg/news-line-shape.svg)] before:bg-center before:bg-contain before:bg-no-repeat before:z-[2] before:-right-1 max-mobile:min-w-[62px] max-mobile:px-[1.43vw] max-mobile:py-[0.65vw] max-mobile:before:-right-[1.87vw] max-mobile:before:w-[2.13vw] max-mobile:before:h-[6.67vw]">
        <span className="h-[17px] w-[17px] mr-0.5 bg-[url(/img/svg/mic-icon.svg)] bg-no-repeat bg-contain max-mobile:w-[4.73vw] max-mobile:h-[4.73vw] max-mobile:mr-[0.53vw]" />
        <span className="font-bold text-[12px] max-mobile:text-[3.47vw]">News</span>
      </div>
      <div
        className="overflow-hidden w-full cursor-pointer"
        onClick={onClick}
        role={onClick ? 'button' : undefined}
      >
        <div
          ref={tickerRef}
          className="inline-block whitespace-nowrap pl-[100%] text-[14px] font-bold leading-[15px] text-[var(--sm-blue)] animate-[ticker-scroll_0s_linear_infinite] [animation-play-state:paused] [&_a]:text-[var(--primary-yellow)] max-mobile:text-[3.47vw] max-mobile:leading-[6.67vw] max-mobile:align-middle"
          dangerouslySetInnerHTML={{ __html: message }}
        />
      </div>
    </div>
  )
}
