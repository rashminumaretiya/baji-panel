import { useCallback, useEffect, useMemo, useState } from 'react'
import { Overlay, Popover } from '../shared/components/primitives/Popover.jsx'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  selectIsAuthenticated,
  selectIsOneClickBet,
  setIsOneClickBet,
  setLoginWindow,
} from '../store/slices/authSlice.js'
import {
  selectIsMcvYellowTheme,
  selectIsYellowTheme,
} from '../store/slices/commonSlice.js'
import {
  fetchSportLiveCount,
  selectSportTabs,
  selectSportTabsLoadedAt,
} from '../store/slices/headerSlice.js'
import Stake from './Stake.jsx'
import SvgIcon from './SvgIcon.jsx'
import {
  SUB_HEADER_HEAD_PAGES,
  SUB_HEADER_TAIL_PAGES,
  isPageActive,
  sportTabToPage,
} from './subHeader.config.js'

const SPORT_LIVE_COUNT_TTL_MS = 60_000

function classes(...cs) {
  return cs.filter(Boolean).join(' ')
}

function useDerivedPages({ isAuthenticated, sportTabs }) {
  return useMemo(() => {
    const head = SUB_HEADER_HEAD_PAGES.map((page) => ({ ...page }))
    const middle = (sportTabs || []).map(sportTabToPage)
    const tail = SUB_HEADER_TAIL_PAGES.map((page) => ({
      ...page,
      isHidden: page.isHidden || (page.authRequired && !isAuthenticated),
    }))
    return [...head, ...middle, ...tail]
  }, [isAuthenticated, sportTabs])
}

function isBabu365Host() {
  if (typeof window === 'undefined') return false
  return window.location.hostname.includes('babu365')
}

export default function SubHeader() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { pathname } = useLocation()
  const { t } = useTranslation()

  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const isMcwCasinoTheme = useSelector(selectIsMcvYellowTheme)
  const isOneClickBet = useSelector(selectIsOneClickBet)
  const sportTabs = useSelector(selectSportTabs)
  const sportTabsLoadedAt = useSelector(selectSportTabsLoadedAt)

  const isBabuTheme = useMemo(() => isBabu365Host(), [])

  const pages = useDerivedPages({ isAuthenticated, sportTabs })

  const handleOneClickToggle = useCallback(
    (e) => {
      const next = e.target.checked
      if (!isAuthenticated) {
        dispatch(setIsOneClickBet(false))
        dispatch(setLoginWindow(true))
        return
      }
      dispatch(setIsOneClickBet(next))
    },
    [dispatch, isAuthenticated]
  )

  const [stakeTarget, setStakeTarget] = useState(null)
  const [stakeOpenRequested, setStakeOpenRequested] = useState(false)
  const closeStake = useCallback(() => setStakeOpenRequested(false), [])
  const handleSettingsClick = useCallback(
    (e) => {
      if (!isAuthenticated) {
        dispatch(setLoginWindow(true))
        return
      }
      setStakeTarget(e.currentTarget)
      setStakeOpenRequested((prev) => !prev)
    },
    [dispatch, isAuthenticated]
  )
  const stakeOpen = stakeOpenRequested && isAuthenticated

  useEffect(() => {
    const isStale = Date.now() - sportTabsLoadedAt > SPORT_LIVE_COUNT_TTL_MS
    if (!isStale) return
    dispatch(fetchSportLiveCount())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  // Wrapper background: default md-black; isYellowTheme makes it `var(--dark)`
  // (the `.dark-row` override wins over the `.yellow-theme` green rule due to
  // higher specificity); mcw-casino gets the gold gradient.
  const wrapperClass = classes(
    'mb-px shadow-[inset_0_1px_3px_0_rgba(var(--black-rgb),0.4)]',
    !isYellowTheme && !isMcwCasinoTheme && 'bg-[var(--md-black)]',
    isYellowTheme && 'bg-[var(--dark)]',
    isMcwCasinoTheme && 'bg-gradient-to-b from-[#e8d877] to-[#c9a43e]'
  )

  // Right-inner-header gets margin-right: 20px when yellow-theme is active.
  const rightWrapClass = classes(
    'inline-flex items-center',
    isYellowTheme && 'mr-5'
  )

  // bet-check container. Borders / gradients vary by theme; active variant
  // swaps gradients per theme. Hover reverses gradient.
  const betCheckBase =
    'cursor-pointer h-[33px] pl-[7px] pr-3 pt-0.5 -mt-[3px] border-t-[3px] border-r border-r-white/15'
  const betCheckDefault = isOneClickBet
    ? 'border-t-[var(--sm-yellow)] bg-gradient-to-t from-[var(--sm-primary)] to-[var(--md-primary)] hover:bg-gradient-to-b hover:from-[var(--sm-primary)] hover:to-[var(--md-primary)]'
    : 'border-t-[var(--sm-yellow)] bg-gradient-to-b from-[var(--sm-black)] to-[var(--black)] hover:bg-gradient-to-t hover:from-[var(--sm-black)] hover:to-[var(--black)]'
  const betCheckYellow = isOneClickBet
    ? 'border-t-[var(--light-green)] bg-gradient-to-b from-[#4e9600] to-[#386a02] hover:bg-gradient-to-t hover:from-[#4e9600] hover:to-[#386a02]'
    : 'border-t-[var(--light-green)] bg-gradient-to-b from-[var(--sm-black)] to-[var(--black)] hover:bg-gradient-to-t hover:from-[var(--sm-black)] hover:to-[var(--black)]'
  const betCheckMcw = isOneClickBet
    ? 'border-t-[#d56525] bg-gradient-to-b from-[#b43807] to-[#912b06] hover:bg-gradient-to-t hover:from-[#b43807] hover:to-[#912b06]'
    : 'border-t-[#d56525] bg-gradient-to-t from-[#4b4b4b] to-[#1e1e1e]'

  const betCheckClass = classes(
    betCheckBase,
    !isYellowTheme && !isMcwCasinoTheme && betCheckDefault,
    isYellowTheme && betCheckYellow,
    isMcwCasinoTheme && betCheckMcw
  )

  // Checkbox style — varies per theme
  const checkboxBase =
    'cursor-pointer appearance-none rounded-[3px] focus:shadow-none focus:outline-none align-middle'
  const checkboxDefault =
    'h-[18px] w-[18px] border border-[var(--sm-yellow)] bg-transparent checked:bg-[var(--md-black)] checked:bg-[url(/img/check.svg)] checked:bg-no-repeat checked:bg-center checked:bg-[length:12px_12px]'
  const checkboxYellow =
    'h-4 w-4 border-0 bg-white/15 checked:bg-white/15 checked:border checked:border-white/40 checked:bg-[url(/img/check.svg)] checked:bg-no-repeat checked:bg-center checked:bg-[length:11px_11px]'
  const checkboxMcw =
    'h-4 w-4 border-0 bg-white/15 ' +
    (isOneClickBet
      ? 'border border-[rgba(255,211,84,0.4)] checked:bg-black/15 checked:bg-[url(/img/yellow-check.svg)] checked:bg-no-repeat checked:bg-center checked:bg-[length:11px_11px]'
      : '')

  const checkboxClass = classes(
    checkboxBase,
    !isYellowTheme && !isMcwCasinoTheme && checkboxDefault,
    isYellowTheme && checkboxYellow,
    isMcwCasinoTheme && checkboxMcw
  )

  // Label color: white by default, #ecca3d in mcw-casino theme
  const labelClass = classes(
    'cursor-pointer font-bold ml-2.5 align-[-webkit-baseline-middle]',
    isMcwCasinoTheme ? 'text-[#ecca3d]' : 'text-white'
  )

  // Settings link
  const settingClass = classes(
    'inline-flex items-center gap-[5px] font-bold px-2.5 leading-[30px] cursor-pointer hover:bg-white/10 [&_svg]:h-3.5 [&_svg]:w-3.5',
    isMcwCasinoTheme ? 'text-black' : 'text-white'
  )

  // ul margin-left: 0 default; -4px on yellow-theme; -10px on
  // mcw-casino + yellow-theme (legacy combo).
  const ulClass = classes(
    'mb-0 pl-0 flex items-center',
    isYellowTheme && !isMcwCasinoTheme && '-ml-1',
    isYellowTheme && isMcwCasinoTheme && '-ml-2.5'
  )

  return (
    <div className={wrapperClass}>
      <div className="relative mx-auto h-[calc(100%-105px)] max-w-[calc(100%-40px)] min-w-0">
        <div className="flex items-center justify-between h-full">
          <ul className={ulClass}>
            {pages
              .filter((p) => !p.isHidden)
              .map((page) => (
                <SubHeaderTab
                  key={page.id ?? page.url}
                  page={page}
                  active={isPageActive(pathname, page)}
                  showLiveChip={page.isCount && isAuthenticated}
                  label={t(page.label, page.fallback)}
                  onActivate={() => navigate(page.url)}
                  isMcwCasinoTheme={isMcwCasinoTheme}
                  isBabuTheme={isBabuTheme}
                />
              ))}
          </ul>

          <div className={rightWrapClass}>
            {!isMcwCasinoTheme && !isYellowTheme && (
              <div className="inline-flex items-center text-white mr-2">
                <span>{t('common.timeZone', 'Time Zone')} : </span>
                <strong className="mb-0 ml-1">GMT+5:30</strong>
              </div>
            )}

            <div className={betCheckClass}>
              <div className="flex items-center min-h-[1.5rem]">
                <input
                  id="oneClickBet"
                  type="checkbox"
                  className={checkboxClass}
                  checked={!!isOneClickBet}
                  onChange={handleOneClickToggle}
                />
                <label className={labelClass} htmlFor="oneClickBet">
                  {t('header.oneClickBet', 'One Click Bet')}
                </label>
              </div>
            </div>

            <div
              className={settingClass}
              onClick={handleSettingsClick}
              onKeyDown={(e) => e.key === 'Enter' && handleSettingsClick(e)}
              role="button"
              tabIndex={0}
              aria-disabled={!isAuthenticated}
            >
              <p className="mb-0">{t('common.settings', 'Settings')}</p>
              <SvgIcon name="settingIcon" className="inline-flex" />
            </div>
          </div>
        </div>
      </div>

      <Overlay show={stakeOpen} target={stakeTarget} placement="bottom">
        <Popover className="min-w-[282px]">
          <Popover.Body className="min-h-[100px] bg-[var(--light-bg)] text-[11px] text-[var(--text-color)] p-2.5 font-[Tahoma,Helvetica,sans-serif]">
            <Stake onCancel={closeStake} />
          </Popover.Body>
        </Popover>
      </Overlay>
    </div>
  )
}

const SubHeaderTab = function SubHeaderTab({
  page,
  active,
  showLiveChip,
  label,
  onActivate,
  isMcwCasinoTheme,
  isBabuTheme,
}) {
  // Base li: padding, text white, bold, line-height 30px. Borders are between
  // li (left) and on the last one (right). Hover/active backgrounds vary by
  // theme.
  const liBase =
    'relative px-2.5 leading-[30px] font-bold cursor-pointer list-none ' +
    '[&+li]:border-l [&+li]:border-l-white/15 last:border-r last:border-r-white/15'

  // Default color and active/hover bg
  const liDefault =
    'text-white hover:bg-white/10 ' +
    (active ? 'bg-white/20 shadow-[inset_0_1px_3px_0_rgba(var(--black-rgb),0.1)] hover:bg-white/20' : '')

  // mcw-casino-theme: black text, border-left rgba(0,0,0,0.2), active bg #c9a33d
  const liMcw =
    'text-black [&+li]:border-l-black/20 last:border-r-black/20 hover:bg-white/10 ' +
    (active ? 'bg-[#c9a33d] hover:bg-[#c9a33d]' : '')

  // babu-theme: active and hover get the red/black gradient
  const liBabu = isBabuTheme
    ? (active
        ? 'bg-gradient-to-t from-[#fd1111] to-[#0e0e0e] hover:bg-gradient-to-t hover:from-[#fd1111] hover:to-[#0e0e0e]'
        : 'hover:bg-gradient-to-t hover:from-[#fd1111] hover:to-[#0e0e0e]')
    : ''

  const liClass = [
    page.classList,
    liBase,
    isMcwCasinoTheme ? liMcw : liDefault,
    liBabu,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li
      className={liClass}
      onClick={onActivate}
      onKeyDown={(e) => e.key === 'Enter' && onActivate()}
      role="button"
      tabIndex={0}
    >
      {label}
      {showLiveChip && (
        <div className="absolute top-0 right-[3px] -translate-y-1/2 h-3 rounded-[3px] shadow-[0_1px_3px_0_rgba(0,0,0,0.5)] inline-flex overflow-hidden z-[9]">
          <div className="h-3 bg-white px-1 py-[2px] leading-[0] flex items-center justify-center before:content-[''] before:bg-[url(/img/svg/live-icon.svg)] before:bg-no-repeat before:bg-contain before:h-2 before:w-3.5" />
          <p className="text-[10px] leading-[0.8] mb-0 px-[5px] py-[2px] bg-[var(--red,#e83623)] text-white tracking-[0.4px] font-bold">
            {page.count ?? 0}
          </p>
        </div>
      )}
    </li>
  )
}
