import { useCallback, useEffect, useRef, useState } from 'react'
import { useIsMobile } from '../hooks/useMediaQuery.js'
import useHomePageData from '../hooks/useHomePageData.js'
import GameList from '../components/home/GameList.jsx'
import {
  DesktopGameFilter,
  MobileGameFilter,
} from '../components/home/GameFilter.jsx'
import MobileSports from '../components/home/MobileSports.jsx'
import SportTabBar from '../components/home/SportTabBar.jsx'
import RacingBanner from '../components/home/RacingBanner.jsx'
import Footer from '../components/Footer.jsx'
import { GAME_LIST_FILTERS } from '../core/constant/constants.js'

const LANDING_IMG_CLASS = 'h-[194px] w-full object-cover mt-px mb-4'

const GAMES_AREA_MIN_HEIGHT = 'min-h-[80vh]'

const FADE_MS = 200

export default function Home() {
  const isMobile = useIsMobile()
  const [filterType, setFilterType] = useState(GAME_LIST_FILTERS.TIME)
  const {
    tabs,
    activeSportId,
    activeSport,
    games,
    isLoading,
    isRacing,
    sportBanner,
    selectTab,
  } = useHomePageData()

  const [isFading, setIsFading] = useState(false)
  const fadeTimerRef = useRef(null)
  useEffect(
    () => () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    },
    []
  )

  const handleTabSelect = useCallback(
    (id) => {
      if (String(id) === String(activeSportId)) return
      setIsFading(true)
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
      fadeTimerRef.current = setTimeout(() => {
        selectTab(id)
        setIsFading(false)
      }, FADE_MS)
    },
    [activeSportId, selectTab]
  )

  const gameList = (
    <GameList
      games={games}
      sport={activeSport?.id}
      filterType={filterType}
      loading={isLoading}
    />
  )

  return (
    <div className="relative">
      {isMobile ? (
        <>
          <MobileSports />
          <MobileGameFilter value={filterType} onChange={setFilterType} />
          <div className={`mt-0 ${GAMES_AREA_MIN_HEIGHT}`}>{gameList}</div>
        </>
      ) : (
        <>
          <img
            className={LANDING_IMG_CLASS}
            src="/img/home_banner.jpg"
            alt="home banner"
            role="presentation"
            width="1200"
            height="194"
            fetchPriority="high"
            decoding="async"
          />
          <DesktopGameFilter value={filterType} onChange={setFilterType} />
          <SportTabBar
            tabs={tabs}
            activeSportId={activeSportId}
            onSelect={handleTabSelect}
          />
          <div
            className={`relative transition-opacity duration-150 ease-out ${
              isFading ? 'opacity-0' : 'opacity-100'
            } ${GAMES_AREA_MIN_HEIGHT}`}
          >
            {isRacing && sportBanner && (
              <RacingBanner src={sportBanner} sportName={activeSport?.name} />
            )}
            {isRacing ? gameList : <div className="mt-0">{gameList}</div>}
          </div>
          <Footer />
        </>
      )}
    </div>
  )
}
