import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Accordion from '../shared/components/primitives/Accordion.jsx'
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

// ─── Tailwind utility groupings (ported from inplay.scss) ────────────────────
const INPLAY_TABS_WRAPPER =
  'overflow-x-auto pb-2 max-mobile:bg-[#172832] max-mobile:text-white max-mobile:text-[3.73vw] max-mobile:leading-[2.2] max-mobile:font-bold max-mobile:flex max-mobile:items-center max-mobile:!pb-0 [&_.search-out]:max-mobile:border-l [&_.search-out]:max-mobile:border-white/15 [&_.search-out]:max-mobile:!bg-gradient-to-t [&_.search-out]:max-mobile:!from-black/15 [&_.search-out]:max-mobile:!to-white/15'

const TAB_LIST_CLASS =
  'flex w-[40%] list-none m-0 p-0 border-b-0 max-mobile:w-full max-mobile:border-none max-mobile:!pt-0 max-mobile:!pb-0'

const TAB_LINK_BASE =
  'block bg-[var(--xts-light-bg)] border border-[var(--xxl-blue)] rounded-t-[4px] rounded-b-none w-[130px] text-[12px] text-white leading-[21px] font-normal p-0 shadow-[inset_0_7px_2px_-7px_var(--xts-gray)] max-mobile:text-[3.33vw] max-mobile:w-auto max-mobile:px-2'

const TAB_LINK_ACTIVE =
  'bg-[var(--xl-th-bg)] text-black border-[var(--xl-th-bg)] shadow-[inset_0_7px_2px_-7px_var(--white)]'

const SECOND_PART_WRAPPER =
  'mt-1 max-h-[calc(100vh-198px)] overflow-y-auto min-h-[200px] max-mobile:max-h-none max-mobile:min-h-0 max-mobile:overflow-y-visible'

const GAME_TITLE_CLASS =
  'bg-gradient-to-b from-[var(--xl-blue)] to-[var(--xxl-blue)] p-2 text-white text-[12px] max-mobile:text-center max-mobile:font-semibold max-mobile:text-[3.73vw] max-mobile:leading-[1.05] max-mobile:p-[2.043vw]'

const EVENT_NAME_WRAPPER =
  'flex flex-wrap mb-1 bg-[var(--xxs-text-color)] py-2 px-0'

const GAME_DETAILS_ROW =
  'flex items-center border-b border-[var(--light-bg)] pl-[10px] pr-[6px] py-0 hover:bg-[var(--hover-bg)]'

const TIME_CELL =
  'mobile:text-[var(--light-navy)] mobile:text-[12px] mobile:py-2 mobile:max-w-[70px] mobile:w-full mobile:font-bold mobile:whitespace-nowrap mobile:overflow-hidden mobile:text-ellipsis'

const EVENT_TITLE_H6 =
  "mb-0 cursor-pointer text-[var(--blue)] text-[12px] font-bold relative pl-[18px] hover:underline before:content-[''] before:absolute before:left-0 before:top-[3px] before:w-0 before:h-0 before:border-solid before:border-transparent before:border-l-[var(--sm-white)] before:border-y-[4px] before:border-r-0 before:border-l-[8px]"

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
      <div className={isRacing ? 'mb-4' : 'w-full mb-4'}>
        {events.map((e) => {
          if (isRacing) {
            return (
              <div key={e.event.id}>
                <div className={EVENT_NAME_WRAPPER}>
                  <p className="m-0">{e.event.name}</p>
                </div>
                {(e.markets ?? []).map((m) => (
                  <div className={GAME_DETAILS_ROW} key={m.marketId}>
                    <div className={TIME_CELL}>
                      {dateFormat === 'H:mm'
                        ? formatTime(m.marketStartTime)
                        : formatDate(m.marketStartTime)}
                    </div>
                    <div>
                      <h6
                        className={EVENT_TITLE_H6}
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
            <div className={GAME_DETAILS_ROW} key={e.event.id}>
              <div className={TIME_CELL}>
                {dateFormat === 'H:mm'
                  ? formatTime(e.event.openDate)
                  : formatDate(e.event.openDate)}
              </div>
              <div>
                <h6
                  className={EVENT_TITLE_H6}
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
        <div key={game.sport} className={isRowLayout ? 'flex flex-wrap mx-0' : undefined}>
          <div className={`w-full ${GAME_TITLE_CLASS}`}>{title}</div>
          {renderEventList(game.sport, dateFormat)}
        </div>
      )
    })
  }

  return (
    <div>
      <div className="mobile:pt-[10px]">
        <div className={INPLAY_TABS_WRAPPER}>
          <ul className={TAB_LIST_CLASS} role="tablist">
            {NAV_TABS.map((tab) => {
              const isActive = tab.id === activeTab
              return (
                <li key={tab.id} className="flex-none ml-0" role="presentation">
                  <button
                    type="button"
                    className={`${TAB_LINK_BASE} ${isActive ? TAB_LINK_ACTIVE : ''}`}
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
        <div className={SECOND_PART_WRAPPER}>
          {renderTabContent(activeTab)}
        </div>
      </div>
    </div>
  )
}
