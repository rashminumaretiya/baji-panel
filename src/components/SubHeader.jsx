import { useCallback, useEffect, useMemo, useState } from 'react'
import { Overlay, Popover } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  selectIsAuthenticated,
  selectIsOneClickBet,
  setIsOneClickBet,
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
import './sub-header.scss'

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
      if (!isAuthenticated) return
      setStakeTarget(e.currentTarget)
      setStakeOpenRequested((prev) => !prev)
    },
    [isAuthenticated]
  )
  const stakeOpen = stakeOpenRequested && isAuthenticated

  useEffect(() => {
    const isStale = Date.now() - sportTabsLoadedAt > SPORT_LIVE_COUNT_TTL_MS
    if (!isStale) return
    dispatch(fetchSportLiveCount())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  const wrapperClass = classes(
    'sub-header-wrapper',
    isYellowTheme && 'dark-row yellow-theme',
    isMcwCasinoTheme && 'mcw-casino-theme',
    isBabuTheme && 'babu-theme'
  )
  const tabsClass = classes(
    'd-flex align-items-center justify-content-between tabs-header',
    isYellowTheme && 'yellow-theme'
  )
  const rightClass = classes(
    'right-inner-header',
    isYellowTheme && 'isYellowTheme'
  )
  const betCheckClass = classes(
    'bet-check cursor-pointer',
    isOneClickBet && 'bet-check-active'
  )

  return (
    <div className={wrapperClass}>
      <div className="full-wrap">
        <div className={tabsClass}>
          <ul className="mb-0 ps-0">
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
                />
              ))}
          </ul>

          <div className={rightClass}>
            {!isMcwCasinoTheme && !isYellowTheme && (
              <div className="d-inline-flex align-items-center text-white me-2 time-zone">
                <span>{t('common.timeZone', 'Time Zone')} : </span>
                <strong className="mb-0 ms-1">GMT+5:30</strong>
              </div>
            )}

            <div className={betCheckClass}>
              <div className="form-check">
                <input
                  id="oneClickBet"
                  type="checkbox"
                  className="form-check-input cursor-pointer"
                  checked={!!isOneClickBet}
                  onChange={handleOneClickToggle}
                />
                <label
                  className="form-check-label cursor-pointer"
                  htmlFor="oneClickBet"
                >
                  {t('header.oneClickBet', 'One Click Bet')}
                </label>
              </div>
            </div>

            <div
              className="d-inline-flex align-items-center setting cursor-pointer"
              onClick={handleSettingsClick}
              onKeyDown={(e) => e.key === 'Enter' && handleSettingsClick(e)}
              role="button"
              tabIndex={0}
              aria-disabled={!isAuthenticated}
            >
              <p className="mb-0">{t('common.settings', 'Settings')}</p>
              <SvgIcon name="settingIcon" className="d-inline-flex" />
            </div>
          </div>
        </div>
      </div>

      <Overlay show={stakeOpen} target={stakeTarget} placement="bottom-end">
        <Popover className="stake-popup-container">
          <Popover.Body>
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
}) {
  return (
    <li
      className={classes(page.classList, active && 'active')}
      onClick={onActivate}
      onKeyDown={(e) => e.key === 'Enter' && onActivate()}
      role="button"
      tabIndex={0}
    >
      {label}
      {showLiveChip && (
        <div className="live-chip">
          <div className="icon-out" />
          <p className="number">{page.count ?? 0}</p>
        </div>
      )}
    </li>
  )
}
