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

// ─── Tab strip class builders (port of mobile-sports.scss) ─────────────────
// Each builder returns a sequence of Tailwind utilities matching the same set
// of declarations the original SCSS produced. Themes are mutually exclusive,
// so only one builder runs per render.

// `.tabs-wrapper` base — outer flex shell with inset top shadow.
const TABS_WRAPPER_BASE =
  'flex items-center shadow-[inset_0_1px_0_0_rgba(var(--black-rgb),0.2)] ' +
  'bg-(--md-black) border-b-[0.7vw] border-(--lg-yellow)'

// Theme overrides — colour-swap the wrapper border + background.
const TABS_WRAPPER_YELLOW =
  'max-md:border-b-[0.1875rem] max-md:border-[rgb(255,161,12)]'
const TABS_WRAPPER_BABU = 'max-md:border-b-[0.1875rem] max-md:border-[#550b0b]'
const TABS_WRAPPER_MCW =
  'max-md:border-[#0d0d0d] max-md:bg-gradient-to-b max-md:from-[#e8d877] max-md:to-[#c9a43e]'

// `.sport-header-tabs` ─ horizontally scrolling row.
const SPORT_HEADER_TABS_BASE =
  'bg-(--md-black) flex mr-auto pr-[4vw] flex-nowrap [scroll-behavior:smooth] ' +
  '[&::-webkit-scrollbar]:hidden'
const SPORT_HEADER_TABS_YELLOW =
  'max-md:bg-gradient-to-b max-md:from-black max-md:to-black max-md:text-white'
const SPORT_HEADER_TABS_BABU =
  'max-md:bg-gradient-to-b max-md:from-black max-md:to-black max-md:text-white'
const SPORT_HEADER_TABS_MCW =
  'max-md:bg-gradient-to-b max-md:from-[#e8d877] max-md:to-[#c9a43e]'

// `.sport-header-tabs li button` ─ the tab pill itself.
const TAB_BUTTON_BASE =
  'relative ml-[1.87vw] h-[9.79vw] font-bold text-white ' +
  'px-[1.87vw] py-0 mt-[2.67vw] rounded-t-[1.6vw] ' +
  '[&_i]:text-white [&_>i]:mr-[1.6vw] ' +
  '[&_svg]:w-[5.33vw] [&_svg]:h-[5.33vw] max-md:[&_>i_>svg]:overflow-visible max-md:[&_>i_>svg]:w-[5.3333333333vw] max-md:[&_>i_>svg]:h-[5.3333333333vw] max-md:[&_svg]:w-[3.233333vw] max-md:[&_svg]:h-[3.233333vw]'
const TAB_BUTTON_ACTIVE_DEFAULT =
  '!bg-(--lg-yellow) [&_>span]:text-black [&_i]:!text-black'
const TAB_BUTTON_ACTIVE_YELLOW =
  'max-md:!bg-gradient-to-b max-md:!from-(--md-primary-yellow) max-md:!to-[#ffa10c]'
const TAB_BUTTON_ACTIVE_BABU =
  'max-md:!bg-gradient-to-b max-md:!from-[#0e0e0e] max-md:!to-[#fd1111] max-md:!text-white ' +
  'max-md:[&_i]:!text-white'
const TAB_BUTTON_MCW = 'max-md:!text-[#1e1e1e] max-md:[&_svg]:!text-[#1e1e1e]'
const TAB_BUTTON_ACTIVE_MCW =
  'max-md:!bg-gradient-to-b max-md:!from-[#474747] max-md:!to-[#070707] ' +
  'max-md:!text-[#f2d65e] max-md:[&_svg]:!text-[#f2d65e]'

// `.live-chip` ─ small floating count pill above each tab.
const LIVE_CHIP_CLASS =
  'absolute h-[3.2vw] top-[-1.97vw] right-[1.33vw] min-w-[9.33vw]  shadow-[0_0.27vw_0.8vw_0_rgba(var(--black-rgb),0.5)] rounded-[0.8vw] flex items-center bg-[linear-gradient(180deg,var(--red)_0%,var(--lg-red)_100%)] overflow-hidden'
const LIVE_CHIP_ICON =
  'h-[3.2vw] w-[5vw] [&_i]:m-0 [&_svg]:w-[3.53vw] [&_svg]:h-[3.13vw] bg-[linear-gradient(180deg,var(--white)_0%,var(--xs-gray)_89%)]'
const LIVE_CHIP_NUMBER = 'text-[2.5vw] font-normal px-[1.33vw] mb-0'

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
    const active = node.querySelector('[data-active="true"]')
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
    'overflow-x-auto',
    TABS_WRAPPER_BASE,
    isYellowTheme && TABS_WRAPPER_YELLOW,
    isMcwCasinoTheme && TABS_WRAPPER_MCW,
    isBabuTheme && TABS_WRAPPER_BABU
  )

  const headerTabsClass = cx(
    'pl-0 mb-0 overflow-x-auto',
    SPORT_HEADER_TABS_BASE,
    isYellowTheme && SPORT_HEADER_TABS_YELLOW,
    isMcwCasinoTheme && SPORT_HEADER_TABS_MCW,
    isBabuTheme && SPORT_HEADER_TABS_BABU
  )

  return (
    <div>
      <div>
        <div className={wrapperClass}>
          <ul ref={tabsRef} className={headerTabsClass} role="tablist">
            {tabs.map((tab) => {
              const isActive = String(tab.id) === activeId
              const iconKey = resolveTabIcon(tab)
              const buttonClass = cx(
                TAB_BUTTON_BASE,
                isMcwCasinoTheme && TAB_BUTTON_MCW,
                isActive && TAB_BUTTON_ACTIVE_DEFAULT,
                isActive && isYellowTheme && TAB_BUTTON_ACTIVE_YELLOW,
                isActive && isBabuTheme && TAB_BUTTON_ACTIVE_BABU,
                isActive && isMcwCasinoTheme && TAB_BUTTON_ACTIVE_MCW
              )
              return (
                <li
                  key={tab.id}
                  data-active={isActive ? 'true' : 'false'}
                  className="flex-none"
                  role="presentation"
                >
                  <button
                    type="button"
                    className={buttonClass}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleTabClick(tab)}
                    onKeyDown={(e) => onKeyActivate(e, tab)}
                  >
                    {iconKey && (
                      <SvgIcon
                        name={iconKey}
                        className="inline-flex align-middle"
                      />
                    )}
                    <span>{tab.label ? t(tab.label, tab.name) : tab.name}</span>
                    {tab.count != null && (
                      <div className={LIVE_CHIP_CLASS}>
                        <div className={LIVE_CHIP_ICON}>
                          <SvgIcon
                            name="liveChipIcon"
                            className="inline-flex align-top"
                          />
                        </div>
                        <p className={LIVE_CHIP_NUMBER}>{tab.count}</p>
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          {/* `.search-collapse` ─ search opener with gradient pseudo-element.
              MobileSearchEvent already paints the icon trigger; we just wrap
              it with the left border + the gradient-before fade. */}
          <div
            className={
              'relative border-l border-white/10 ' +
              "before:absolute before:right-[12.8vw] before:content-[''] " +
              'before:h-[12.27vw] before:w-[8.27vw] ' +
              'before:bg-[linear-gradient(90deg,rgba(var(--black-rgb),0)_0%,var(--black)_110%)]'
            }
          >
            <MobileSearchEvent />
          </div>
        </div>
      </div>
    </div>
  )
}
