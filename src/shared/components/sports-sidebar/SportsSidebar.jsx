// Ported from sbex-user-fe/src/app/shared/components/sports-sidebar/sports-sidebar.html
// Phase 2 TODO: full RACING_SPORTS list from core/constants.
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  selectActiveSportId,
  selectSidebarSports,
  setActiveSportId,
} from '../../../store/slices/sportSlice.js'
import './sports-sidebar.scss'

const RACING_SPORTS = new Set(['7', '4339'])

function parseGameDetails(pathname) {
  const m = pathname.match(/^\/game-details\/([^/]+)\/([^/]+)(?:\/([^/?]+))?/)
  if (!m) return { sportId: null, eventId: null, marketId: null }
  return { sportId: m[1] ?? null, eventId: m[2] ?? null, marketId: m[3] ?? null }
}

export default function SportsSidebar() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const allSports = useSelector(selectSidebarSports)
  const activeSportId = useSelector(selectActiveSportId)

  const [displayedSportId, setDisplayedSportId] = useState(null)
  const [selectedCompIndex, setSelectedCompIndex] = useState(null)
  const [selectedEventIndex, setSelectedEventIndex] = useState(null)
  const [activeMarketId, setActiveMarketId] = useState(null)
  const [activeEventId, setActiveEventId] = useState(null)

  const routeParams = useMemo(() => parseGameDetails(pathname), [pathname])
  const isOnGameDetailsRoute = !!routeParams.sportId && !!routeParams.eventId

  const activeSport = useMemo(
    () => allSports.find((s) => s.value === displayedSportId) ?? null,
    [allSports, displayedSportId],
  )
  const competitions = activeSport?.competitions ?? []
  const events = selectedCompIndex !== null ? competitions[selectedCompIndex]?.events ?? [] : []
  const markets =
    selectedCompIndex !== null && selectedEventIndex !== null
      ? competitions[selectedCompIndex]?.events[selectedEventIndex]?.markets ?? []
      : []
  const activeCompetition =
    selectedCompIndex !== null ? competitions[selectedCompIndex] ?? null : null
  const activeEvent =
    selectedCompIndex !== null && selectedEventIndex !== null
      ? competitions[selectedCompIndex]?.events[selectedEventIndex] ?? null
      : null

  const level = !displayedSportId
    ? 'sports'
    : selectedCompIndex === null
      ? 'competitions'
      : selectedEventIndex === null
        ? 'events'
        : 'markets'

  const isGameDetailsView =
    !!(routeParams.sportId && routeParams.eventId) &&
    selectedCompIndex !== null &&
    selectedEventIndex !== null

  const isEventInPlay = (event) => event.markets?.some((m) => m.isInPlay)

  useEffect(() => {
    if (allSports.length === 0) return
    const { sportId, eventId, marketId } = routeParams
    if (!sportId || !eventId) {
      setActiveEventId(null)
      setActiveMarketId(null)
      return
    }
    const sport = allSports.find((s) => s.value === sportId)
    if (!sport) return
    setActiveEventId(eventId)
    setActiveMarketId(marketId ?? null)
    let compIndex = null
    let eventIndex = null
    for (let ci = 0; ci < sport.competitions.length; ci++) {
      const ei = sport.competitions[ci].events.findIndex((e) => e.id === eventId)
      if (ei !== -1) {
        compIndex = ci
        eventIndex = ei
        break
      }
    }
    setDisplayedSportId(sportId)
    setSelectedCompIndex(compIndex)
    setSelectedEventIndex(eventIndex)
  }, [routeParams, allSports])

  useEffect(() => {
    if (routeParams.sportId) return
    if (!activeSportId) {
      setDisplayedSportId(null)
      setSelectedCompIndex(null)
      setSelectedEventIndex(null)
      setActiveEventId(null)
      setActiveMarketId(null)
      return
    }
    const sport = allSports.find((s) => s.value === activeSportId)
    if (!sport) return
    setDisplayedSportId(activeSportId)
    setSelectedCompIndex(null)
    setSelectedEventIndex(null)
    setActiveEventId(null)
    setActiveMarketId(null)
  }, [activeSportId, allSports, routeParams.sportId])

  const selectSport = (sport) => {
    setDisplayedSportId(sport.value)
    setSelectedCompIndex(null)
    setSelectedEventIndex(null)
    setActiveEventId(null)
    setActiveMarketId(null)
    dispatch(setActiveSportId(sport.value))
  }
  const goToAllSports = () => dispatch(setActiveSportId(null))
  const goBackToCompetitions = () => {
    setSelectedCompIndex(null)
    setSelectedEventIndex(null)
  }
  const goBackToEvents = () => setSelectedEventIndex(null)
  const selectCompetition = (_c, i) => {
    setSelectedCompIndex(i)
    setSelectedEventIndex(null)
  }
  const selectEvent = (_e, i) => setSelectedEventIndex(i)

  const navigateToMarket = (market) => {
    if (!displayedSportId || selectedCompIndex === null || selectedEventIndex === null) return
    const sport = activeSport
    const event = competitions[selectedCompIndex]?.events[selectedEventIndex]
    if (!sport || !event) return
    const path = ['/game-details', sport.value, event.id]
    if (RACING_SPORTS.has(sport.value)) {
      if (!market.marketId) return
      path.push(market.marketId)
    }
    navigate(path.join('/'))
  }

  return (
    <div className="app-sports-sidebar">
      <div className={['sports-sidebar', isOnGameDetailsRoute && 'is-game-details']
        .filter(Boolean)
        .join(' ')}
      >
        <div className="body">
          <ul className="events ps-0">
            {isGameDetailsView ? (
              <>
                <li className="section-header"><span>{t('common.sports')}</span></li>
                <li className="cursor-pointer" onClick={goToAllSports}>
                  <span>{t('common.allSports')}</span>
                </li>
                <li className="active-sport"><span>{activeSport?.label}</span></li>
                <li><span>{activeCompetition?.name}</span></li>
                <li className="nav-active-event"><span>{activeEvent?.name}</span></li>
                {markets.length === 0 ? (
                  <li className="d-flex justify-content-center">
                    <span>{t('common.noMarketFound')}</span>
                  </li>
                ) : (
                  markets.map((market) => (
                    <li
                      key={market.marketId}
                      className={[
                        'cursor-pointer match-odds d-flex align-items-center position-relative',
                        !market.isInPlay && 'not-in-play',
                        market.marketId === activeMarketId && 'active',
                      ].filter(Boolean).join(' ')}
                      onClick={() => navigateToMarket(market)}
                    >
                      <span>{market.marketName}</span>
                    </li>
                  ))
                )}
              </>
            ) : level === 'sports' ? (
              <>
                <li className="section-header"><span>{t('common.sports')}</span></li>
                {allSports.map((sport) => (
                  <li
                    key={sport.value}
                    className="cursor-pointer"
                    onClick={() => selectSport(sport)}
                  >
                    <span>{sport.label}</span>
                  </li>
                ))}
              </>
            ) : level === 'competitions' ? (
              <>
                <li className="section-header"><span>{t('common.sports')}</span></li>
                <li className="cursor-pointer" onClick={goToAllSports}>
                  <span>{t('common.allSports')}</span>
                </li>
                <li className="active-sport"><span>{activeSport?.label}</span></li>
                {competitions.map((comp, i) => (
                  <li
                    key={i}
                    className="cursor-pointer"
                    onClick={() => selectCompetition(comp, i)}
                  >
                    <span>{comp.name}</span>
                  </li>
                ))}
              </>
            ) : level === 'events' ? (
              <>
                <li className="section-header"><span>{t('common.sports')}</span></li>
                <li className="cursor-pointer" onClick={goToAllSports}>
                  <span>{t('common.allSports')}</span>
                </li>
                <li className="cursor-pointer" onClick={goBackToCompetitions}>
                  <span>{activeSport?.label}</span>
                </li>
                {events.length === 0 ? (
                  <li className="d-flex justify-content-center">
                    <span>{t('common.noEventsFound')}</span>
                  </li>
                ) : (
                  events.map((event, i) => (
                    <li
                      key={event.id}
                      className={[
                        'cursor-pointer',
                        event.id === activeEventId && 'active',
                        !isEventInPlay(event) && 'not-in-play',
                      ].filter(Boolean).join(' ')}
                      onClick={() => selectEvent(event, i)}
                    >
                      <span>{event.name}</span>
                    </li>
                  ))
                )}
              </>
            ) : (
              <>
                <li className="section-header"><span>{t('common.sports')}</span></li>
                <li className="cursor-pointer" onClick={goToAllSports}>
                  <span>{t('common.allSports')}</span>
                </li>
                <li className="cursor-pointer" onClick={goBackToEvents}>
                  <span>{activeSport?.label}</span>
                </li>
                {markets.length === 0 ? (
                  <li className="d-flex justify-content-center">
                    <span>{t('common.noMarketFound')}</span>
                  </li>
                ) : (
                  markets.map((market) => (
                    <li
                      key={market.marketName}
                      className={[
                        'cursor-pointer match-odds d-flex align-items-center position-relative',
                        !market.isInPlay && 'not-in-play',
                        market.marketId === activeMarketId && 'active',
                      ].filter(Boolean).join(' ')}
                      onClick={() => navigateToMarket(market)}
                    >
                      <span>{market.marketName}</span>
                    </li>
                  ))
                )}
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
