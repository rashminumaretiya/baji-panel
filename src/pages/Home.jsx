import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import Swal from 'sweetalert2'
import { useIsMobile } from '../hooks/useMediaQuery.js'
import {
  loadSportTabs,
  loadGamesForSport,
  loadPinnedEvents,
  pinEvent,
  unpinEvent,
  setActiveSportId,
  selectSportTabs,
  selectActiveSportConfig,
  selectActiveSportId,
  selectGamesForActiveSport,
  selectGamesStatusForActiveSport,
  selectPinnedEventIds,
} from '../store/slices/sportSlice.js'
import { selectIsAuthenticated } from '../store/slices/authSlice.js'
import { alertService } from '../shared/services/alert.js'
import { useEventSubscription } from '../hooks/useSocket.js'
import GameList from '../components/home/GameList.jsx'
import MobileSports from '../components/home/MobileSports.jsx'
import Footer from '../components/Footer.jsx'
import PinEventModal from '../components/home/PinEventModal.jsx'
import { GAME_LIST_FILTERS, RACING_SPORTS } from '../core/constant/constants.js'
import '../components/home/home.scss'

const FILTER_OPTIONS = [
  { labelKey: 'titles.highLights', value: GAME_LIST_FILTERS.HIGHLIGHTS },
  { labelKey: 'sportLanding.competition', value: GAME_LIST_FILTERS.COMPETITION },
]

export default function Home() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const tabs = useSelector(selectSportTabs)
  const activeSportId = useSelector(selectActiveSportId)
  const activeSport = useSelector(selectActiveSportConfig)
  const games = useSelector(selectGamesForActiveSport)
  const gamesStatus = useSelector(selectGamesStatusForActiveSport)
  const pinnedEventIds = useSelector(selectPinnedEventIds)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const visibleEventIds = useMemo(
    () => games.map((g) => g.event?.id).filter(Boolean),
    [games],
  )
  useEventSubscription(visibleEventIds)

  const [filterType, setFilterType] = useState(GAME_LIST_FILTERS.HIGHLIGHTS)
  const [pinModal, setPinModal] = useState({ open: false, game: null })

  useEffect(() => {
    dispatch(loadSportTabs())
  }, [dispatch])

  useEffect(() => {
    if (isAuthenticated) dispatch(loadPinnedEvents())
  }, [isAuthenticated, dispatch])

  const handlePinClick = useCallback(
    async (game) => {
      if (!isAuthenticated) return
      if (pinnedEventIds.has(game.id)) {
        const result = await Swal.fire({
          title: t('common.unpinEvent'),
          text: t('common.unpinEventConfirm'),
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
        })
        if (!result.isConfirmed) return
        dispatch(unpinEvent(game.id))
          .unwrap()
          .then(() => alertService.success(t('common.unpinEvent')))
          .catch(() => {})
      } else {
        setPinModal({ open: true, game })
      }
    },
    [dispatch, isAuthenticated, pinnedEventIds, t],
  )

  const handlePinConfirm = useCallback(
    (alias) => {
      const game = pinModal.game
      setPinModal({ open: false, game: null })
      if (!game) return
      dispatch(pinEvent({ eventId: game.id, sportId: game.sportId, alias }))
        .unwrap()
        .then(() => alertService.success(t('common.pinEvent')))
        .catch(() => {})
    },
    [dispatch, pinModal.game, t],
  )

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

  const landingImage = activeSport?.id
    ? `/img/sports/${activeSport.id}.webp`
    : '/img/4.webp'
  const isRacing = RACING_SPORTS.has(activeSportId ?? '')
  const showGameListTabs = !isMobile

  return (
    <div className="sports-landing">
      {!isMobile ? (
        <img
          key={landingImage}
          className="landing-img"
          src={landingImage}
          alt=""
          onError={(e) => {
            if (e.currentTarget.src.endsWith('/img/4.webp')) return
            e.currentTarget.src = '/img/4.webp'
          }}
        />
      ) : (
        <MobileSports />
      )}

      {isMobile ? (
        <div>
          <h3 className="highlight text-center mb-0">{t('titles.highLights')}</h3>
          <div className="highlight-wrapper">
            <ul className="nav-tabs p-0 highlight-tab">
              {FILTER_OPTIONS.map((opt) => (
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
      ) : (
        <div className="row mx-0">
          <div className="col-12 game-title">
            <span>{t('titles.sportHighLights')}</span>
            {!isRacing && (
              <div className="highlight-sorting">
                <label>{t('common.viewBy')}</label>
                <div className="select-wrap">
                  <select
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
            )}
          </div>
        </div>
      )}

      {showGameListTabs && (
        <div className="game-list">
          <ul className="nav-tabs">
            {tabs.map((tab) => (
              <li key={tab.id} className="nav-item">
                <button
                  type="button"
                  className={`nav-link${String(tab.id) === activeSportId ? ' active' : ''}`}
                  onClick={() => dispatch(setActiveSportId(tab.id))}
                >
                  <span>{tab.label ? t(tab.label) : tab.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="game-list">
        <GameList
          games={games}
          sport={activeSport?.id}
          filterType={filterType}
          pinnedEventIds={pinnedEventIds}
          onPinClick={handlePinClick}
          loading={gamesStatus === 'loading'}
        />
      </div>

      {!isMobile && <Footer />}

      <PinEventModal
        key={pinModal.game?.id ?? 'pin-modal'}
        show={pinModal.open}
        eventName={pinModal.game?.name}
        onConfirm={handlePinConfirm}
        onCancel={() => setPinModal({ open: false, game: null })}
      />
    </div>
  )
}
