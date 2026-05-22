import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Accordion from '../shared/components/primitives/Accordion.jsx'
import { Overlay, Popover } from '../shared/components/primitives/Popover.jsx'
import GameList from '../components/home/GameList.jsx'
import NoData from '../shared/NoData.jsx'
import MobileSearchEvent from '../components/MobileSearchEvent.jsx'
import { useIsMobile } from '../hooks/useMediaQuery.js'
import {
  getSportName,
  getSportSlug,
  INPLAY_FILTER_SPORTS,
  isRacingSport,
  RACING_SPORTS,
} from '../core/constant/constants.js'
import {
  loadInplayMap,
  fetchSportLiveCount,
  selectInplayMap,
  selectInplayStatus,
  selectSportTabs,
} from '../store/slices/sportSlice.js'
import { setFullScreenLoader } from '../store/slices/commonSlice.js'
import { alertService } from '../shared/services/alert.js'

const EventTime = {
  IN_PLAY: 'IN_PLAY',
  TODAY: 'TODAY',
  TOMORROW: 'TOMORROW',
}

const NAV_TABS = [
  { id: EventTime.IN_PLAY, label: 'common.inPlay' },
  { id: EventTime.TODAY, label: 'markets.today' },
  { id: EventTime.TOMORROW, label: 'markets.tomorrow' },
]

// ─── Tailwind utility groupings (ported from inplay.scss) ────────────────────
const INPLAY_TABS_WRAPPER =
  'overflow-x-auto pb-2 max-md:bg-[#172832] max-md:text-white max-md:text-[3.73vw] max-md:leading-[2.2] max-md:font-bold max-md:flex max-md:items-center max-md:!pb-0 [&_.search-out]:max-md:border-l [&_.search-out]:max-md:border-white/15 [&_.search-out]:max-md:!bg-gradient-to-t [&_.search-out]:max-md:!from-black/15 [&_.search-out]:max-md:!to-white/15'

const TAB_LIST_CLASS =
  'flex justify-center w-[40%] list-none m-0 pb-px rounded-[4px] ' +
  'max-md:w-full max-md:bg-[color:var(--dark-grey)] max-md:p-[1.87vw_1.87vw_2.3vw_1.87vw]'

const TAB_ITEM_CLASS = 'flex-1 -ml-px first:ml-0'

const TAB_LINK_BASE =
  'block w-full p-0 font-bold text-[13px] leading-[27px] border hover:underline ' +
  'max-md:text-[3.73vw] max-md:leading-[8.8vw] max-md:bg-transparent'

const TAB_LINK_INACTIVE =
  'bg-white text-[color:var(--text-color)] border-[color:var(--text-color)] ' +
  'max-md:bg-transparent max-md:text-white max-md:border-white'

const TAB_LINK_ACTIVE =
  'bg-[color:var(--text-color)] text-white border-[color:var(--text-color)] no-underline hover:no-underline ' +
  'max-md:bg-white max-md:text-[color:var(--text-color)]'

const SECOND_PART_WRAPPER =
  'max-h-[calc(100vh-198px)] overflow-y-auto min-h-[200px] max-md:max-h-none max-md:min-h-0 max-md:overflow-y-visible'

const GAME_DETAILS_ROW =
  'flex items-center border-b border-[color:var(--light-bg)] pl-[10px] pr-[6px] py-0 hover:bg-[var(--hover-bg)]'

const TIME_CELL =
  'text-[color:var(--light-navy)] text-[12px] py-2 max-w-[70px] w-full font-bold whitespace-nowrap overflow-hidden text-ellipsis'

const EVENT_TITLE_H6 =
  "mb-0 cursor-pointer text-[var(--blue)] text-[12px] font-bold relative pl-[18px] hover:underline before:content-[''] before:absolute before:left-0 before:top-[3px] before:w-0 before:h-0 before:border-solid before:border-transparent before:border-l-[var(--sm-white)] before:border-y-[4px] before:border-r-0 before:border-l-[8px]"

const SPORT_FILTER_WRAPPER =
  'relative flex items-center px-[10px] py-[10px] bg-[var(--light-bg)] border-b border-[color:var(--sm-text-color)] mb-[10px]'

const SPORT_FILTER_CHIP_BASE =
  "bg-no-repeat bg-left pr-[6px] [&+&]:pl-[10px] [&+&]:bg-[url('/img/filter-dot.png')]"

const BTN_WHITE_BASE =
  'inline-flex items-center justify-center text-[12px] font-normal rounded px-2 py-[4px] ' +
  'bg-[linear-gradient(180deg,var(--white)_0%,var(--xs-gray)_89%)] ' +
  'shadow-[inset_0_2px_0_0_rgb(var(--white-rgb),0.5)] ' +
  'border border-[color:var(--lg-gray)] text-[color:var(--dark)] ' +
  'hover:bg-[linear-gradient(180deg,var(--xs-gray)_0%,var(--white)_89%)]'

const FILTER_BTN_CLASS = `${BTN_WHITE_BASE} min-w-[95px]`

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

function formatTime(iso, mode = '24h') {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const minutes = String(d.getMinutes()).padStart(2, '0')
  if (mode === '12h') {
    const h = d.getHours() % 12 || 12
    return `${String(h).padStart(2, '0')}:${minutes}`
  }
  return `${d.getHours()}:${minutes}`
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

  const defaultSelections = useMemo(
    () => INPLAY_FILTER_SPORTS.map(() => true),
    []
  )
  const [sportSelections, setSportSelections] = useState(defaultSelections)
  const [originalSelections, setOriginalSelections] =
    useState(defaultSelections)
  const [savedSelections, setSavedSelections] = useState(INPLAY_FILTER_SPORTS)
  const [allSelected, setAllSelected] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterBtnEl, setFilterBtnEl] = useState(null)

  useEffect(() => {
    if (!sportTabs?.length) dispatch(fetchSportLiveCount())
  }, [dispatch, sportTabs?.length])

  useEffect(() => {
    dispatch(setFullScreenLoader(true))
    dispatch(loadInplayMap(buildParams(activeTab)))
  }, [dispatch, activeTab])

  useEffect(() => {
    if (inplayStatus !== 'loading') dispatch(setFullScreenLoader(false))
  }, [dispatch, inplayStatus])

  useEffect(() => {
    return () => {
      dispatch(setFullScreenLoader(false))
    }
  }, [dispatch])

  const visibleGames = useMemo(() => {
    return sportTabs
      .filter((sport) => !!sportsEventMap[sport.id]?.length)
      .map((sport) => ({
        ...sport,
        sport: sport.id,
        title: sport.label ?? sport.name,
      }))
  }, [sportTabs, sportsEventMap])

  const combinedList = useMemo(() => {
    if (activeTab === EventTime.IN_PLAY) return []
    const allowed = new Set(savedSelections.map((s) => s.value))
    if (!allowed.size) return []
    const flat = []
    for (const sportId of Object.keys(sportsEventMap)) {
      if (!allowed.has(sportId)) continue
      const events = sportsEventMap[sportId] ?? []
      for (const e of events) flat.push({ ...e, _sportId: sportId })
    }
    return flat.sort((a, b) => {
      const at = new Date(a?.event?.openDate ?? 0).getTime()
      const bt = new Date(b?.event?.openDate ?? 0).getTime()
      return at - bt
    })
  }, [activeTab, sportsEventMap, savedSelections])

  const toggleAll = () => {
    const next = !allSelected
    setAllSelected(next)
    setSportSelections(INPLAY_FILTER_SPORTS.map(() => next))
  }

  const onSportSelection = (idx) => {
    const next = sportSelections.map((v, i) => (i === idx ? !v : v))
    setSportSelections(next)
    setAllSelected(next.every(Boolean))
  }

  const saveFilter = () => {
    setOriginalSelections(sportSelections)
    setSavedSelections(
      INPLAY_FILTER_SPORTS.filter((_, i) => sportSelections[i])
    )
    setFilterOpen(false)
  }

  const cancelFilter = () => {
    setSportSelections(originalSelections)
    setAllSelected(originalSelections.every(Boolean))
    setFilterOpen(false)
  }

  function navigateToEvent(e, market) {
    const sportId = e?.sport?.id
    const eventId = e?.event?.id
    if (!sportId || !eventId) return

    if (e?.event?.isMarketBlocked) {
      alertService.error(
        t('errors.eventSuspended', 'Event is currently suspended by admin')
      )
      return
    }

    const slug = getSportSlug(sportId)

    if (isRacingSport(sportId)) {
      if (!market?.marketId) return
      navigate(`/racing-odds/${eventId}/${market.marketId}/${slug}`)
      return
    }

    navigate(`/odds/${eventId}/${slug}`)
  }

  const renderSportFilter = () => (
    <div className={SPORT_FILTER_WRAPPER}>
      <div className="flex items-center">
        <p className="font-bold m-0 mr-2">Sport Filters:</p>
        {savedSelections.map((sport) => (
          <span key={sport.value} className={SPORT_FILTER_CHIP_BASE}>
            {t(sport.label)}
          </span>
        ))}
      </div>
      <div className="ml-auto" ref={setFilterBtnEl}>
        <button
          type="button"
          className={FILTER_BTN_CLASS}
          onClick={() => setFilterOpen((v) => !v)}
        >
          Filter
        </button>
      </div>
      <Overlay
        show={filterOpen}
        target={filterBtnEl}
        placement="bottom-end"
        rootClose={false}
        onHide={() => setFilterOpen(false)}
      >
        <Popover
          id="inplay-sport-filter"
          className="min-w-[500px] max-w-[500px] mt-[2px]"
        >
          <Popover.Body className="p-2 text-[12px] font-['Tahoma',Helvetica,sans-serif]">
            <div className="flex flex-wrap">
              <div className="w-1/2 mb-1">
                <input
                  id="inplay-filter-all"
                  type="checkbox"
                  className="mr-1 mb-1"
                  checked={allSelected}
                  onChange={toggleAll}
                />
                <label htmlFor="inplay-filter-all" className="cursor-pointer">
                  All
                </label>
              </div>
              {INPLAY_FILTER_SPORTS.map((sport, idx) => (
                <div key={sport.value} className="w-1/2 mb-1">
                  <input
                    id={`inplay-filter-${sport.value}`}
                    type="checkbox"
                    className="mr-1 mb-1"
                    checked={!!sportSelections[idx]}
                    onChange={() => onSportSelection(idx)}
                  />
                  <label
                    htmlFor={`inplay-filter-${sport.value}`}
                    className="cursor-pointer"
                  >
                    {t(sport.label)}
                  </label>
                </div>
              ))}
            </div>
            <div className="border-t border-[color:var(--bg-xs-light)] pt-2 mt-1">
              <div className="flex">
                <button
                  type="button"
                  className="w-[120px] mr-2 text-[12px] bg-[color:var(--text-color)] text-white rounded px-3 py-[6px] hover:opacity-90"
                  onClick={saveFilter}
                >
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  className={`${BTN_WHITE_BASE} w-[77px]`}
                  onClick={cancelFilter}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </Popover.Body>
        </Popover>
      </Overlay>
    </div>
  )

  const renderCombinedList = (tabType) => {
    if (!combinedList.length) return <NoData />
    const timeFmt = tabType === EventTime.TODAY ? '24h' : '12h'
    return combinedList.map((e) => {
      const sportId = e._sportId
      const isRacing = RACING_SPORTS.has(sportId)
      if (isRacing) {
        return (
          <div key={e.event.id}>
            {(e.markets ?? []).map((m) => (
              <div className={GAME_DETAILS_ROW} key={m.marketId}>
                <div className={TIME_CELL}>
                  {formatTime(m.marketStartTime, timeFmt)}
                </div>
                <div>
                  <h6
                    className={EVENT_TITLE_H6}
                    onClick={() => navigateToEvent(e, m)}
                  >
                    {m.marketName}
                  </h6>
                </div>
              </div>
            ))}
          </div>
        )
      }
      if (tabType === EventTime.TOMORROW) {
        return (
          <div className={GAME_DETAILS_ROW} key={e.event.id}>
            <div className={TIME_CELL}>
              {formatTime(e.event.openDate, timeFmt)}
            </div>
            <div className="flex items-center">
              <div className="mr-2 text-[12px]">{getSportName(sportId)}</div>
              <h6
                className={EVENT_TITLE_H6}
                onClick={() => navigateToEvent(e, e.markets?.[0])}
              >
                {e.event.name}
              </h6>
            </div>
          </div>
        )
      }
      return (
        <div className={GAME_DETAILS_ROW} key={e.event.id}>
          <div className={TIME_CELL}>
            {formatTime(e.event.openDate, timeFmt)}
          </div>
          <div>
            <h6
              className={EVENT_TITLE_H6}
              onClick={() => navigateToEvent(e, e.markets?.[0])}
            >
              {e.event.name}
            </h6>
          </div>
        </div>
      )
    })
  }

  const renderTabContent = (tabType) => {
    if (tabType === EventTime.IN_PLAY) {
      if (!visibleGames.length) return <NoData />
      return visibleGames.map((game) => {
        const title = game.label ? t(game.label) : game.title
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
      })
    }

    if (isMobile) {
      if (!visibleGames.length) return <NoData />
      return visibleGames.map((game) => {
        const title = game.label ? t(game.label) : game.title
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
      })
    }

    return (
      <>
        {renderSportFilter()}
        <div className="bg-white">{renderCombinedList(tabType)}</div>
      </>
    )
  }

  return (
    <div>
      <div className="max-md:pt-0">
        <div className={INPLAY_TABS_WRAPPER}>
          <ul className={TAB_LIST_CLASS} role="tablist">
            {NAV_TABS.map((tab, idx) => {
              const isActive = tab.id === activeTab
              const isFirst = idx === 0
              const isLast = idx === NAV_TABS.length - 1
              const radius = [
                isFirst && 'rounded-l-[4px]',
                isLast && 'rounded-r-[4px]',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <li key={tab.id} className={TAB_ITEM_CLASS} role="presentation">
                  <button
                    type="button"
                    className={`${TAB_LINK_BASE} ${radius} ${isActive ? TAB_LINK_ACTIVE : TAB_LINK_INACTIVE}`}
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
        <div className={SECOND_PART_WRAPPER}>{renderTabContent(activeTab)}</div>
      </div>
    </div>
  )
}
