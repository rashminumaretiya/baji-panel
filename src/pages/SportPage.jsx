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
import '../components/home/home.scss'

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
    [games],
  )
  useEventSubscription(visibleEventIds)

  const sportName = getSportName(sportId)
  const loading = gamesStatus === 'loading'
  const sportIdStr = String(sportId)

  return (
    <>
      <div className="sports-landing">
        <Loader show={loading} variant="wrapper" />
        {!isMobile && bannerSrc && (
          <img
            className="landing-img"
            src={bannerSrc}
            alt={`${sportName} Landing Image`}
          />
        )}

        {isRacing ? (
          <>
            <div className="row mx-0 mt-2">
              <div className="col-12 game-title mb-2">
                {t('titles.highLights')}
              </div>
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
            <div className="game-list">
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
