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
import {
  DesktopGameFilter,
  MobileGameFilter,
} from '../components/home/GameFilter.jsx'
import MobileSports from '../components/home/MobileSports.jsx'
import Footer from '../components/Footer.jsx'
import Loader from '../shared/components/Loader.jsx'
import {
  GAME_LIST_FILTERS,
  RACING_SPORTS,
  SPORT_IDS,
} from '../core/constant/constants.js'

const SPORT_BANNER = {
  [SPORT_IDS.SOCCER]: '/img/soccer-img.jpg',
  [SPORT_IDS.TENNIS]: '/img/tennis-img.jpg',
  [SPORT_IDS.CRICKET]: '/img/cricket-img.jpg',
  [SPORT_IDS.HORSE_RACING]: '/img/horse_racing_landing.webp',
  [SPORT_IDS.GREYHOUND_RACING]: '/img/greyhound_landing.webp',
}

const LANDING_IMG_CLASS = 'h-[194px] w-full object-cover mt-px mb-4'

const TAB_LIST_CLASS =
  'flex rounded-none gap-[5px] justify-start border-b-0 m-0 px-[10px] pt-0 pb-px bg-[var(--xl-dark-green)] list-none'

const TAB_ITEM_CLASS = 'flex-none ml-0'

const TAB_LINK_BASE =
  'block border rounded-t-[4px] rounded-b-none w-[130px] text-[12px] leading-[21px] font-normal p-0 -mb-px'

const TAB_LINK_INACTIVE =
  'bg-[var(--xts-light-bg)] border-[var(--xxl-blue)] text-white shadow-[inset_0_7px_2px_-7px_var(--xts-gray)]'

const TAB_LINK_ACTIVE =
  'bg-[var(--xl-th-bg)] border-[var(--xl-th-bg)] text-black shadow-[inset_0_7px_2px_-7px_var(--white)]'

const GAME_TITLE_CLASS =
  'flex items-center justify-between bg-gradient-to-b from-[var(--xl-blue)] to-[var(--xxl-blue)] text-white text-[12px] font-bold p-2 mb-2 max-md:text-center max-md:font-semibold max-md:text-[3.73vw] max-md:leading-[1.05] max-md:p-[2.043vw]'

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
    [games]
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
  const loading = gamesStatus === 'loading'

  return (
    <div className="relative">
      <Loader show={loading} variant="wrapper" />
      {!isMobile ? (
        <>
          <img
            className={LANDING_IMG_CLASS}
            src="/img/home_banner.jpg"
            alt="Cricket Landing Image"
          />

          <DesktopGameFilter value={filterType} onChange={setFilterType} />

          <div className="mt-0">
            <ul className={TAB_LIST_CLASS} role="tablist">
              {tabs.map((tab, idx) => {
                const isActive = String(tab.id) === activeSportId
                const navId = `ngb-nav-${idx}`
                return (
                  <li
                    key={tab.id}
                    className={TAB_ITEM_CLASS}
                    role="presentation"
                  >
                    <button
                      type="button"
                      className={`${TAB_LINK_BASE} ${isActive ? TAB_LINK_ACTIVE : TAB_LINK_INACTIVE}`}
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

          <div className="relative">
            {isRacing && sportBanner && (
              <>
                <img
                  className={LANDING_IMG_CLASS}
                  src={sportBanner}
                  alt={`${activeSport?.name ?? 'Sport'} Landing Image`}
                />
                <div className="mx-0 mt-2">
                  <div className={GAME_TITLE_CLASS}>
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
                loading={loading}
              />
            ) : (
              <div className="mt-0">
                <GameList
                  games={games}
                  sport={activeSport?.id}
                  filterType={filterType}
                  loading={loading}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <MobileSports />
          <MobileGameFilter value={filterType} onChange={setFilterType} />
          <div className="mt-0">
            <GameList
              games={games}
              sport={activeSport?.id}
              filterType={filterType}
              loading={loading}
            />
          </div>
        </>
      )}

      {!isMobile && <Footer />}
    </div>
  )
}
