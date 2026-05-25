import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { selectGlobalNews, selectNews } from '../store/slices/commonSlice.js'
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
      <div className="flex h-[25px] items-center bg-gradient-to-t from-(--3xl-blue) to-(--lg-blue) text-white max-md:mb-px max-md:h-[6.67vw] max-md:w-full hover:[&_span]:underline">
        <div className="relative inline-flex h-full min-w-[72px] flex-none items-center justify-center before:absolute before:-right-1 before:z-2 before:h-[25px] before:w-[7px] before:bg-[url(/img/svg/news-line-shape.svg)] before:bg-contain before:bg-center before:bg-no-repeat before:content-[''] max-md:min-w-[62px] max-md:p-[0.652vw_1.434vw_0.952vw_2.522vw] max-md:before:-right-[1.87vw] max-md:before:h-[6.67vw] max-md:before:w-[2.13vw]">
          <span className="mr-0.5 h-[17px] w-[17px] flex-none bg-[url(/img/svg/mic-icon.svg)] bg-contain bg-no-repeat max-md:mr-[0.53vw] max-md:h-[4.73vw] max-md:w-[4.73vw]" />
          <span className="text-[12px] font-bold max-md:text-[3.47vw]">
            {t('common.news', 'News')}
          </span>
        </div>
        <div
          className="w-full cursor-pointer overflow-hidden"
          onClick={handleClick}
          role="button"
        >
          <div
            ref={tickerRef}
            className="inline-block animate-[ticker-scroll_0s_linear_infinite] pl-[100%] text-[14px] leading-[15px] font-bold whitespace-nowrap text-(--sm-blue) [animation-play-state:paused] max-md:align-middle max-md:text-[3.47vw] max-md:leading-[6.67vw] [&_a]:text-(--primary-yellow)"
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
