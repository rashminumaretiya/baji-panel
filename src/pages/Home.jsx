import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../hooks/useMediaQuery.js'
import {
  loadSportTabs,
  loadGamesForSport,
  setActiveSportId,
  selectSportTabs,
  selectActiveSportConfig,
  selectActiveSportId,
  selectGamesForActiveSport,
  selectGamesStatusForActiveSport,
} from '../store/slices/sportSlice.js'
import { useEventSubscription } from '../hooks/useSocket.js'
import GameList from '../components/home/GameList.jsx'
import MobileSports from '../components/home/MobileSports.jsx'
import Footer from '../components/Footer.jsx'
import { GAME_LIST_FILTERS, RACING_SPORTS, SPORT_IDS } from '../core/constant/constants.js'
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

const SPORT_BANNER = {
  [SPORT_IDS.SOCCER]: '/img/soccer-img.jpg',
  [SPORT_IDS.TENNIS]: '/img/tennis-img.jpg',
  [SPORT_IDS.CRICKET]: '/img/cricket-img.jpg',
  [SPORT_IDS.HORSE_RACING]: '/img/horse_racing_landing.webp',
  [SPORT_IDS.GREYHOUND_RACING]: '/img/greyhound_landing.webp',
}

export default function Home() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const tabs = useSelector(selectSportTabs)
  const activeSportId = useSelector(selectActiveSportId)
  const activeSport = useSelector(selectActiveSportConfig)
  const games = useSelector(selectGamesForActiveSport)
  const gamesStatus = useSelector(selectGamesStatusForActiveSport)

  const visibleEventIds = useMemo(
    () => games.map((g) => g.event?.id).filter(Boolean),
    [games],
  )
  useEventSubscription(visibleEventIds)

  const [filterType, setFilterType] = useState(GAME_LIST_FILTERS.TIME)

  useEffect(() => {
    dispatch(loadSportTabs())
  }, [dispatch])

  useEffect(() => {
    if (!activeSportId && tabs.length) {
      dispatch(setActiveSportId(tabs[0].id))
    }
  }, [activeSportId, tabs, dispatch])

  useEffect(() => {
    if (!activeSportId) return
    const timerId = setTimeout(() => {
      dispatch(loadGamesForSport(activeSportId))
    }, 150)
    return () => clearTimeout(timerId)
  }, [activeSportId, dispatch])

  const isRacing = RACING_SPORTS.has(activeSportId ?? '')
  const sportBanner = SPORT_BANNER[activeSportId]

  return (
    <div className="sports-landing">
      {!isMobile ? (
        <>
          <img
            className="landing-img"
            src="/img/home_banner.jpg"
            alt="Cricket Landing Image"
          />

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

          <div className="game-list">
            <ul className="nav nav-tabs" role="tablist">
              {tabs.map((tab, idx) => {
                const isActive = String(tab.id) === activeSportId
                const navId = `ngb-nav-${idx}`
                return (
                  <li key={tab.id} className="nav-item" role="presentation">
                    <button
                      type="button"
                      className={`nav-link${isActive ? ' active' : ''}`}
                      id={navId}
                      role="tab"
                      aria-selected={isActive}
                      aria-disabled="false"
                      {...(isActive
                        ? { 'aria-controls': `${navId}-panel` }
                        : { tabIndex: -1 })}
                      onClick={() => dispatch(setActiveSportId(tab.id))}
                    >
                      <span>{tab.label ? t(tab.label) : tab.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="sports-landing">
            {isRacing && sportBanner && (
              <>
                <img
                  className="landing-img"
                  src={sportBanner}
                  alt={`${activeSport?.name ?? 'Sport'} Landing Image`}
                />
                <div className="row mx-0 mt-2">
                  <div className="col-12 game-title mb-2">
                    {t('titles.highLights')}
                  </div>
                </div>
              </>
            )}
            {isRacing ? (
              <GameList
                games={games}
                sport={activeSport?.id}
                filterType={filterType}
                loading={gamesStatus === 'loading'}
              />
            ) : (
              <div className="game-list">
                <GameList
                  games={games}
                  sport={activeSport?.id}
                  filterType={filterType}
                  loading={gamesStatus === 'loading'}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <MobileSports />
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
                      <span>{t('sportLanding.bySport', { sport: t(opt.labelKey) })}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="game-list">
            <GameList
              games={games}
              sport={activeSport?.id}
              filterType={filterType}
              loading={gamesStatus === 'loading'}
            />
          </div>
        </>
      )}

      {!isMobile && <Footer />}
    </div>
  )
}
