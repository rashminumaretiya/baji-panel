import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../hooks/useMediaQuery.js'
import {
  loadGamesForSport,
  setActiveSportId,
  selectGamesForActiveSport,
  selectGamesStatusForActiveSport,
} from '../store/slices/sportSlice.js'
import { useEventSubscription } from '../hooks/useSocket.js'
import GameList from '../components/home/GameList.jsx'
import {
  DesktopGameFilter,
  MobileGameFilter,
} from '../components/home/GameFilter.jsx'
import Footer from '../components/Footer.jsx'
import Loader from '../shared/components/Loader.jsx'
import { GAME_LIST_FILTERS, getSportName } from '../core/constant/constants.js'

const LANDING_IMG_CLASS = 'h-[194px] w-full object-cover mt-px mb-4'

const GAME_TITLE_CLASS =
  'flex items-center justify-between bg-gradient-to-b from-(--xl-blue) to-(--xxl-blue) text-white text-[12px] font-bold p-2 mb-2 max-md:text-center max-md:font-semibold max-md:text-[3.73vw] max-md:leading-[1.05] max-md:p-[2.043vw]'

// Mirrors Angular's per-sport components (cricket/soccer/tennis/horse-racing/
// greyhound-racing). Non-racing sports show the View By filter; racing sports
// show just a "Highlights" mini-band.
export default function SportPage({ sportId, bannerSrc, isRacing = false }) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const games = useSelector(selectGamesForActiveSport)
  const gamesStatus = useSelector(selectGamesStatusForActiveSport)

  const [filterType, setFilterType] = useState(GAME_LIST_FILTERS.TIME)

  useEffect(() => {
    if (!sportId) return
    dispatch(setActiveSportId(sportId))
    dispatch(loadGamesForSport(sportId))
  }, [dispatch, sportId])

  const visibleEventIds = useMemo(
    () => games.map((g) => g.event?.id).filter(Boolean),
    [games]
  )
  useEventSubscription(visibleEventIds)

  const sportName = getSportName(sportId)
  const loading = gamesStatus === 'loading'
  const sportIdStr = String(sportId)

  return (
    <>
      <div className="relative">
        <Loader show={loading} variant="wrapper" />
        {!isMobile && bannerSrc && (
          <img
            className={LANDING_IMG_CLASS}
            src={bannerSrc}
            alt={`${sportName} Landing Image`}
            width="1200"
            height="194"
            decoding="async"
            fetchPriority="high"
          />
        )}

        {isRacing ? (
          <>
            <div className="mx-0 pt-2">
              <div className={GAME_TITLE_CLASS}>{t('titles.highLights')}</div>
            </div>
            <GameList
              games={games}
              sport={sportIdStr}
              filterType={filterType}
              loading={loading}
            />
          </>
        ) : (
          <>
            {!isMobile && (
              <DesktopGameFilter value={filterType} onChange={setFilterType} />
            )}
            <div className="mt-0">
              {isMobile && (
                <MobileGameFilter value={filterType} onChange={setFilterType} />
              )}
              <GameList
                games={games}
                sport={sportIdStr}
                filterType={filterType}
                loading={loading}
              />
            </div>
          </>
        )}
      </div>

      {!isMobile && <Footer />}
    </>
  )
}
