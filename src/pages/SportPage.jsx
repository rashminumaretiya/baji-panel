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
import Footer from '../components/Footer.jsx'
import { GAME_LIST_FILTERS, getSportName } from '../core/constant/constants.js'
import '../components/home/home.scss'

const FILTER_OPTIONS = [
  { labelKey: 'common.gameFilters.competition', value: GAME_LIST_FILTERS.COMPETITION },
  { labelKey: 'common.gameFilters.time', value: GAME_LIST_FILTERS.TIME },
  { labelKey: 'common.gameFilters.matched', value: GAME_LIST_FILTERS.MATCHED },
]

const MOBILE_FILTER_OPTIONS = [
  { labelKey: 'common.gameFilters.time', value: GAME_LIST_FILTERS.TIME },
  { labelKey: 'common.gameFilters.competition', value: GAME_LIST_FILTERS.COMPETITION },
]

// Mirrors Angular's per-sport components (cricket/soccer/tennis/horse-racing/
// greyhound-racing). Non-racing sports show the View By filter; racing sports
// show just a "Highlights" mini-band.
export default function SportPage({ sportId, bannerSrc, isRacing = false }) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const games = useSelector(selectGamesForActiveSport)
  const gamesStatus = useSelector(selectGamesStatusForActiveSport)

  const [filterType, setFilterType] = useState(
    isRacing ? GAME_LIST_FILTERS.TIME : GAME_LIST_FILTERS.HIGHLIGHTS,
  )

  useEffect(() => {
    dispatch(setActiveSportId(sportId))
  }, [dispatch, sportId])

  useEffect(() => {
    if (!sportId) return
    const timerId = setTimeout(() => {
      dispatch(loadGamesForSport(sportId))
    }, 150)
    return () => clearTimeout(timerId)
  }, [dispatch, sportId])

  const visibleEventIds = useMemo(
    () => games.map((g) => g.event?.id).filter(Boolean),
    [games],
  )
  useEventSubscription(visibleEventIds)

  const sportName = getSportName(sportId)
  const loading = gamesStatus === 'loading'

  const desktopGameFilter = (
    <div className="row mx-0">
      <div className="col-12 game-title">
        <div>{t('titles.sportHighLights')}</div>
        <div className="highlight-sorting">
          <label htmlFor="viewType">{t('common.viewBy')}</label>
          <div className="select">
            <select
              id="viewType"
              name="View"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label={t('titles.highLights')}
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const mobileGameFilter = (
    <div>
      <h3 className="highlight text-center mb-0">{t('titles.highLights')}</h3>
      <div className="highlight-wrapper">
        <ul className="nav-tabs p-0 highlight-tab">
          {MOBILE_FILTER_OPTIONS.map((opt) => (
            <li key={opt.value} className="nav-item">
              <button
                type="button"
                className={`nav-link${filterType === opt.value ? ' active' : ''}`}
                onClick={() => setFilterType(opt.value)}
              >
                <span>
                  {t('sportLanding.bySport', { sport: t(opt.labelKey) })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )

  return (
    <>
      <div className="sports-landing">
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
              sport={String(sportId)}
              filterType={filterType}
              loading={loading}
            />
          </>
        ) : (
          <>
            {!isMobile && desktopGameFilter}
            <div className="game-list">
              {isMobile && mobileGameFilter}
              <GameList
                games={games}
                sport={String(sportId)}
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
