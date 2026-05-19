import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  selectActiveSportId,
  selectSportTabs,
  setActiveSportId,
} from '../../store/slices/sportSlice.js'
import {
  selectIsMcvYellowTheme,
  selectIsYellowTheme,
} from '../../store/slices/commonSlice.js'
import MobileSearchEvent from '../MobileSearchEvent.jsx'
import SvgIcon from '../SvgIcon.jsx'
import './mobile-sports.scss'

// Maps sport ID → registry key for the larger, sport-specific SVG used by the
// mobile-sport-header tab strip in the live project. Falls back to the API's
// `tab.icon` (e.g. `parlayMarketIcon`) for tabs that aren't main sports.
const SPORT_ICON_BY_ID = {
  4: 'cricketBallIcons',
  1: 'soccerBallIcons',
  2: 'tennisIcon',
  e_soccer: 'eSoccerIcon',
  7: 'horseRacingIcon',
  4339: 'greyhoundRacingIcon',
}

function resolveTabIcon(tab) {
  const byId = SPORT_ICON_BY_ID[String(tab?.id ?? '').toLowerCase()]
  if (byId) return byId
  const byName =
    SPORT_ICON_BY_ID[
      String(tab?.name ?? '')
        .toLowerCase()
        .replace(/[\s-]/g, '_')
    ]
  if (byName) return byName
  return tab?.icon || ''
}

function cx(...cs) {
  return cs.filter(Boolean).join(' ')
}

function isBabu365Host() {
  if (typeof window === 'undefined') return false
  return window.location.hostname.includes('babu365')
}

export default function MobileSports() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const tabs = useSelector(selectSportTabs)
  const activeSportId = useSelector(selectActiveSportId)
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const isMcwCasinoTheme = useSelector(selectIsMcvYellowTheme)
  const isBabuTheme = useMemo(() => isBabu365Host(), [])
  const tabsRef = useRef(null)

  // Derived active-tab id — mirrors the live `activeType` signal. Resolves
  // against Redux's activeSportId (set on tab click); falls back to the first
  // visible tab when nothing is selected yet (matches the live
  // `signal(SportsType.CRICKET)` default).
  const activeId = useMemo(() => {
    if (!tabs.length) return null
    const matched = tabs.find((tab) => String(tab.id) === String(activeSportId))
    return String((matched ?? tabs[0]).id)
  }, [tabs, activeSportId])

  const handleTabClick = useCallback(
    (tab) => {
      // Swap content inline by updating Redux — mirrors ngbNav's tab outlet.
      // No route change so the page chrome stays put.
      dispatch(setActiveSportId(tab.id))
    },
    [dispatch]
  )

  // Smooth-scroll the active pill into view whenever the active tab changes
  // or the list reflows. Centers the pill so the user can see neighbours.
  useEffect(() => {
    const node = tabsRef.current
    if (!node || !activeId) return
    const active = node.querySelector('li.active, .nav-link.active')
    if (!active) return
    try {
      active.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    } catch {
      node.scrollLeft = active.offsetLeft
    }
  }, [activeId, tabs.length])

  function onKeyActivate(e, tab) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleTabClick(tab)
    }
  }

  const wrapperClass = cx(
    'overflow-x-auto tabs-wrapper',
    isYellowTheme && 'yellow-theme',
    isMcwCasinoTheme && 'mcw-side-header',
    isBabuTheme && 'babu-theme'
  )

  return (
    <div className="games-tab">
      <div className={wrapperClass}>
        <ul
          ref={tabsRef}
          className="nav tabs sport-header-tabs ps-0 mb-0 overflow-x-auto"
          role="tablist"
        >
          {tabs.map((tab) => {
            const isActive = String(tab.id) === activeId
            const iconKey = resolveTabIcon(tab)
            return (
              <li
                key={tab.id}
                className={cx('nav-item', tab.classList, isActive && 'active')}
                role="presentation"
              >
                <button
                  type="button"
                  className={cx('nav-link', isActive && 'active')}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTabClick(tab)}
                  onKeyDown={(e) => onKeyActivate(e, tab)}
                >
                  {iconKey && <SvgIcon name={iconKey} />}
                  <span>{tab.label ? t(tab.label, tab.name) : tab.name}</span>
                  {tab.count != null && (
                    <div className="live-chip">
                      <div className="icon-out">
                        <SvgIcon name="liveChipIcon" />
                      </div>
                      <p className="number">{tab.count}</p>
                    </div>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
        <MobileSearchEvent />
      </div>
    </div>
  )
}
