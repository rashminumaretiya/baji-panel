import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Accordion } from 'react-bootstrap'
import GameList from '../components/home/GameList.jsx'
import NoData from '../shared/NoData.jsx'
import MobileSearchEvent from '../components/MobileSearchEvent.jsx'
import { useIsMobile } from '../hooks/useMediaQuery.js'
import { RACING_SPORTS } from '../core/constant/constants.js'
import {
  loadInplayMap,
  loadSportTabs,
  selectInplayMap,
  selectInplayStatus,
  selectSportTabs,
} from '../store/slices/sportSlice.js'
import { setFullScreenLoader } from '../store/slices/commonSlice.js'
import './inplay.scss'

const EventTime = {
  IN_PLAY: 'IN_PLAY',
  TODAY: 'TODAY',
  TOMORROW: 'TOMORROW',
}

const NAV_TABS = [
  { id: EventTime.IN_PLAY, label: 'markets.inPlay' },
  { id: EventTime.TODAY, label: 'markets.today' },
  { id: EventTime.TOMORROW, label: 'markets.tomorrow' },
]

function getUTC(date, h, m, s, ms) {
  const d = new Date(date)
  d.setHours(h, m, s, ms)
  return d.toISOString()
}

function buildParams(tab) {
  switch (tab) {
    case EventTime.IN_PLAY:
      return { isInPlay: true }
    case EventTime.TODAY:
      return {
        periodStartDate: getUTC(new Date(), 0, 0, 0, 0),
        periodEndDate: getUTC(new Date(), 23, 59, 59, 999),
        isInPlay: false,
      }
    case EventTime.TOMORROW: {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return {
        periodStartDate: getUTC(tomorrow, 0, 0, 0, 0),
        isInPlay: false,
      }
    }
    default:
      return {}
  }
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function InPlay() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const sportTabs = useSelector(selectSportTabs)
  const sportsEventMap = useSelector(selectInplayMap)
  const inplayStatus = useSelector(selectInplayStatus)

  const [activeTab, setActiveTab] = useState(EventTime.IN_PLAY)

  useEffect(() => {
    if (!sportTabs?.length) dispatch(loadSportTabs())
  }, [dispatch, sportTabs?.length])

  useEffect(() => {
    dispatch(loadInplayMap(buildParams(activeTab)))
  }, [dispatch, activeTab])

  useEffect(() => {
    dispatch(setFullScreenLoader(inplayStatus === 'loading'))
  }, [dispatch, inplayStatus])

  useEffect(() => {
    return () => {
      dispatch(setFullScreenLoader(false))
    }
  }, [dispatch])

  const visibleGames = useMemo(() => {
    return sportTabs
      .filter(
        (sport) =>
          sport.route === `sports/${sport.id}` &&
          !!sportsEventMap[sport.id]?.length
      )
      .map((sport) => ({
        ...sport,
        sport: sport.id,
        title: sport.label ?? sport.name,
      }))
  }, [sportTabs, sportsEventMap])

  function navigateToEvent(eventId, _marketId, sportId) {
    if (sportId && eventId) {
      navigate(`/game-details/${sportId}/${eventId}`)
    }
  }

  const renderEventList = (sport, dateFormat) => {
    const isRacing = RACING_SPORTS.has(sport)
    const events = sportsEventMap[sport] ?? []
    if (!events.length) return <NoData />
    return (
      <div className={isRacing ? 'mb-4' : 'col-12 mb-4'}>
        {events.map((e) => {
          if (isRacing) {
            return (
              <div key={e.event.id}>
                <div className="row event-name-wrapper">
                  <p className="m-0">{e.event.name}</p>
                </div>
                {(e.markets ?? []).map((m) => (
                  <div className="game-details-row" key={m.marketId}>
                    <div className="time">
                      {dateFormat === 'H:mm'
                        ? formatTime(m.marketStartTime)
                        : formatDate(m.marketStartTime)}
                    </div>
                    <div>
                      <h6
                        className="mb-0 text-underline-hover cursor-pointer"
                        onClick={() =>
                          navigateToEvent(e.event.id, m.marketId, e.sport.id)
                        }
                      >
                        {m.marketName}
                      </h6>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
          return (
            <div className="game-details-row" key={e.event.id}>
              <div className="time">
                {dateFormat === 'H:mm'
                  ? formatTime(e.event.openDate)
                  : formatDate(e.event.openDate)}
              </div>
              <div>
                <h6
                  className="mb-0 text-underline-hover cursor-pointer"
                  onClick={() =>
                    navigateToEvent(
                      e.event.id,
                      e.markets?.[0]?.marketId,
                      e.sport.id
                    )
                  }
                >
                  {e.event.name}
                </h6>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderTabContent = (tabType) => {
    if (!visibleGames.length) return <NoData />

    return visibleGames.map((game) => {
      const title = game.label ? t(game.label) : game.title
      if (tabType === EventTime.IN_PLAY) {
        return (
          <Accordion key={game.sport} defaultActiveKey="0">
            <Accordion.Item eventKey="0">
              <Accordion.Header>{title}</Accordion.Header>
              <Accordion.Body>
                <GameList
                  games={sportsEventMap[game.sport]}
                  sport={game.sport}
                />
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        )
      }
      if (isMobile) {
        return (
          <Accordion key={game.sport} defaultActiveKey="0">
            <Accordion.Item eventKey="0">
              <Accordion.Header>{title}</Accordion.Header>
              <Accordion.Body>
                <GameList
                  games={sportsEventMap[game.sport]}
                  sport={game.sport}
                />
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        )
      }
      const dateFormat = tabType === EventTime.TODAY ? 'H:mm' : 'y-MM-dd'
      const isRowLayout = tabType === EventTime.TODAY
      return (
        <div key={game.sport} className={isRowLayout ? 'row mx-0' : undefined}>
          <div className="col-12 game-title">{title}</div>
          {renderEventList(game.sport, dateFormat)}
        </div>
      )
    })
  }

  return (
    <div className="inplay-wrapper">
      <div className="overflow-x-auto pb-2 inplay-tabs-wrapper">
        <ul className="nav nav-tabs inplay-tabs" role="tablist">
          {NAV_TABS.map((tab) => {
            const isActive = tab.id === activeTab
            return (
              <li key={tab.id} className="nav-item" role="presentation">
                <button
                  type="button"
                  className={`nav-link ${isActive ? ' active' : ''}`}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span>{t(tab.label)}</span>
                </button>
              </li>
            )
          })}
        </ul>
        {isMobile && <MobileSearchEvent />}
      </div>
      <div className="second-part-wrapper mt-md-1">
        {renderTabContent(activeTab)}
      </div>
    </div>
  )
}
