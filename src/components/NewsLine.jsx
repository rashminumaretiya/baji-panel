import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  selectGlobalNews,
  selectNews,
} from '../store/slices/commonSlice.js'
import AnnouncementsModal from './AnnouncementsModal.jsx'

const TICKER_SPEED_PX_PER_SEC = 70
const NEWS_SEPARATOR = ' &nbsp;&nbsp; | &nbsp;&nbsp; '

export default function NewsLine({ onClick }) {
  const { t } = useTranslation()
  const news = useSelector(selectNews)
  const globalNews = useSelector(selectGlobalNews)
  const tickerRef = useRef(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const message = useMemo(() => {
    const combined = [news?.message, globalNews?.message]
      .filter(Boolean)
      .join(NEWS_SEPARATOR)
    return combined || t('news.welcomeOurExchange')
  }, [news, globalNews, t])

  const handleClick = (e) => {
    onClick?.(e)
    setIsModalOpen(true)
  }

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
    <>
      <div className="flex items-center h-[25px] text-white bg-gradient-to-t from-[var(--3xl-blue)] to-[var(--lg-blue)] hover:[&_span]:underline max-md:w-full max-md:h-[6.67vw] max-md:mb-px">
        <div className="relative inline-flex items-center flex-none justify-center min-w-[72px] h-full max-md:p-[0.652vw_1.434vw_0.952vw_2.522vw] before:absolute before:content-[''] before:w-[7px] before:h-[25px] before:bg-[url(/img/svg/news-line-shape.svg)] before:bg-center before:bg-contain before:bg-no-repeat before:z-2 before:-right-1 max-md:min-w-[62px] max-md:before:-right-[1.87vw] max-md:before:w-[2.13vw] max-md:before:h-[6.67vw]">
          <span className="h-[17px] w-[17px] mr-0.5 bg-[url(/img/svg/mic-icon.svg)] bg-no-repeat bg-contain max-md:w-[4.73vw] max-md:h-[4.73vw] max-md:mr-[0.53vw] flex-none" />
          <span className="font-bold text-[12px] max-md:text-[3.47vw]">
            {t('common.news', 'News')}
          </span>
        </div>
        <div
          className="overflow-hidden w-full cursor-pointer"
          onClick={handleClick}
          role="button"
        >
          <div
            ref={tickerRef}
            className="inline-block whitespace-nowrap pl-[100%] text-[14px] font-bold leading-[15px] text-[var(--sm-blue)] animate-[ticker-scroll_0s_linear_infinite] [animation-play-state:paused] [&_a]:text-[var(--primary-yellow)] max-md:text-[3.47vw] max-md:leading-[6.67vw] max-md:align-middle"
            dangerouslySetInnerHTML={{ __html: message }}
          />
        </div>
      </div>
      <AnnouncementsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
