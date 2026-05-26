import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { Overlay, Popover } from '../shared/components/primitives/Popover.jsx'
import { useIsMobile } from '../hooks/useMediaQuery.js'
import {
  fetchBalance,
  selectCurrency,
  selectIsAuthenticated,
  selectUser,
  selectWallet,
} from '../store/slices/authSlice.js'
import {
  selectIsMcvYellowTheme,
  selectIsPlayLiveStream,
  selectIsStreamUrlAvailable,
  selectIsYellowTheme,
  selectLogo,
  setIsPlayLiveStream,
} from '../store/slices/commonSlice.js'
import {
  fetchOpenBets,
  selectOpenBetRefreshTick,
  setOpenBets,
} from '../store/slices/betSlipSlice.js'
import EventSearch from './EventSearch.jsx'
import MyAccountPopup from './MyAccountPopup.jsx'
import OpenBets from './OpenBets.jsx'
import Stake from './Stake.jsx'
import SubHeader from './SubHeader.jsx'
import {
  ClosePopoverIcon,
  DollarCoinIcon,
  RefreshIcon,
  SettingIcon,
} from './icons.jsx'
import { cx } from '../utils/cx.js'

const DEFAULT_WALLET = { balance: 0, exposure: 0 }
const DEFAULT_CURRENCY = 'BDT'
const LOADING_BAR_ITEMS = [1, 2, 3, 4, 5, 6, 7, 8]

function formatBalance(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function getDisplayAmount(wallet) {
  const raw = wallet?.amount ?? wallet?.balance ?? 0
  return raw > 0 ? Math.floor(raw * 10) / 10 : 0
}

const HEADER_BASE =
  'flex items-center px-5 pr-[25px] py-2 h-[74px] bg-(--primary) max-md:px-0 max-md:pr-[1.87vw] max-md:py-[2.67vw] max-md:h-[14.67vw] max-md:min-w-0'

const HEADER_YELLOW = 'bg-gradient-to-b from-[#ffcb2e] to-[#ffb80c]'
const HEADER_MCW = 'bg-gradient-to-b from-[#2f2f2f] to-[#010101]'

export default function Header({
  logo: logoProp,
  isStreamAvailable: isStreamAvailableProp,
}) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const isMob = useIsMobile()

  const isAuth = useSelector(selectIsAuthenticated)
  const user = useSelector(selectUser)
  const walletFromStore = useSelector(selectWallet)
  const currencyFromStore = useSelector(selectCurrency)
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const isMcwCasinoTheme = useSelector(selectIsMcvYellowTheme)
  const isPlayLiveStream = useSelector(selectIsPlayLiveStream)
  const isStreamUrlAvailable = useSelector(selectIsStreamUrlAvailable)
  const isStreamAvailable = isStreamAvailableProp ?? isStreamUrlAvailable
  const openBetRefreshTick = useSelector(selectOpenBetRefreshTick)

  const wallet = walletFromStore ?? user?.wallet ?? DEFAULT_WALLET
  const currency = currencyFromStore ?? user?.currency ?? DEFAULT_CURRENCY
  const logoFromStore = useSelector(selectLogo)
  const logo = logoProp ?? logoFromStore ?? null

  const [isBalanceRefresh, setIsBalanceRefresh] = useState(false)
  const [showBets, setShowBets] = useState(false)
  const [stakeOpen, setStakeOpen] = useState(false)
  const [stakeTarget, setStakeTarget] = useState(null)

  const isAccountRoute = location.pathname.includes('my-account')
  const useDesktopHeader = !isMob || isAccountRoute
  const showMobileBetsBtn = isAuth && isMob && !isAccountRoute
  const showSearch = useDesktopHeader
  const showAccountPopup = isAuth && useDesktopHeader
  const showMobileStake = isMob && !isAccountRoute
  const showLiveStreamBtn = isAuth && isMob && isStreamAvailable

  const exposure = wallet?.exposure ?? 0
  const isExposure = exposure > 0
  const amount = getDisplayAmount(wallet)

  const balanceLabel =
    !isMob && !isYellowTheme
      ? t('common.mainBalance', 'Main Balance')
      : t('common.main', 'Main')

  const headerClass = cx(
    HEADER_BASE,
    isYellowTheme && HEADER_YELLOW,
    isMcwCasinoTheme && HEADER_MCW
  )

  // Mobile stake popup header (used inside the open-bets drawer).
  const stakeHeaderClass = cx(
    'flex items-center justify-between bg-(--primary)',
    isYellowTheme &&
      'bg-gradient-to-b from-(--sm-primary-yellow) to-(--md-primary-yellow)',
    isMcwCasinoTheme && 'bg-gradient-to-b from-[#2f2f2f] to-[#010101]'
  )

  // Self-pacing poll: schedule the next fetch only after the previous one
  // settles. Prevents requests stacking up when the backend is slow — with
  // setInterval, a 15s tick with 30s responses doubled the in-flight load.
  useEffect(() => {
    if (!isAuth) return undefined
    let cancelled = false
    let timeoutId = null
    const tick = () => {
      dispatch(fetchBalance()).finally(() => {
        if (cancelled) return
        timeoutId = setTimeout(tick, 15000)
      })
    }
    tick()
    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isAuth, dispatch])

  const openBetsEventId = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean)
    return segments[0] === 'odds' ? segments[1] : null
  }, [location.pathname])

  // Open-bets polling: independent of openBetRefreshTick so a flurry of bet
  // placements doesn't keep resetting the 15s window. The refresh-tick effect
  // below fires a one-shot fetch on each placement; this loop ticks predictably
  // regardless. Same self-pacing pattern as the balance poll above.
  useEffect(() => {
    if (!isAuth) {
      dispatch(setOpenBets([]))
      return undefined
    }
    const params = openBetsEventId ? { eventId: String(openBetsEventId) } : {}
    let cancelled = false
    let timeoutId = null
    const tick = () => {
      dispatch(fetchOpenBets(params)).finally(() => {
        if (cancelled) return
        timeoutId = setTimeout(tick, 15000)
      })
    }
    tick()
    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isAuth, dispatch, openBetsEventId])

  // One-shot refresh whenever betSlipSlice bumps openBetRefreshTick (after a
  // successful bet placement). Skipped on first mount when tick is still 0 —
  // the poll effect above already issued the initial fetch.
  useEffect(() => {
    if (!isAuth || openBetRefreshTick === 0) return
    const params = openBetsEventId ? { eventId: String(openBetsEventId) } : {}
    dispatch(fetchOpenBets(params))
  }, [isAuth, dispatch, openBetsEventId, openBetRefreshTick])

  const refreshTimerRef = useRef(null)
  useEffect(
    () => () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    },
    []
  )

  const balanceRefresh = () => {
    setIsBalanceRefresh(true)
    dispatch(fetchBalance()).finally(() => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = setTimeout(
        () => setIsBalanceRefresh(false),
        2000
      )
    })
  }

  const navigateToHome = () => navigate('/')
  const openBetsClick = () => setShowBets(true)
  const toggleLiveStream = () =>
    dispatch(setIsPlayLiveStream(!isPlayLiveStream))
  const openMobileStake = (e) => {
    setStakeTarget(e.currentTarget)
    setStakeOpen(true)
  }

  const showSubHeader = !isMob

  if (!isAuth) {
    return showSubHeader ? <SubHeader /> : null
  }

  return (
    <div className="fixed top-0 right-0 left-0 z-[1000]">
      <header className={headerClass}>
        {useDesktopHeader ? (
          <div className="inline-flex items-center sm:flex-1">
            <div className="me-0 flex h-[50px] w-[100px] items-center sm:me-2 xl:me-3">
              {logo && (
                <img
                  src={logo}
                  alt={t('common.homeLogoAlt', 'Site logo — go to home')}
                  width="100"
                  height="50"
                  className="h-auto max-h-[50px] w-auto max-w-[100px] object-contain"
                  onClick={navigateToHome}
                  onKeyDown={(e) => e.key === 'Enter' && navigateToHome()}
                  role="button"
                  tabIndex={0}
                  decoding="async"
                />
              )}
            </div>
            {showSearch && <EventSearch />}
          </div>
        ) : (
          <>
            {showLiveStreamBtn && (
              <button
                type="button"
                className={cx(
                  'relative w-[11.2vw] rounded-none border px-[1.87vw] py-[1.87vw] pb-[1.33vw] text-white shadow-[inset_0_0.27vw_0_0_rgba(255,255,255,0.4)] before:inline-block before:h-[5.27vw] before:w-[5.6vw] before:bg-contain before:bg-center before:align-middle before:content-[""]',
                  isPlayLiveStream
                    ? 'border-(--mds-orange) bg-(--lg-orange) before:bg-[url(/img/svg/mobile-close-icon.svg)]'
                    : 'border-[#948800] bg-[#beaf0d] before:bg-[url(/img/svg/mobile-live-icon.svg)]'
                )}
                onClick={toggleLiveStream}
              />
            )}
            {showMobileBetsBtn && (
              <>
                <span
                  className={cx(
                    'flex max-w-fit min-w-0 items-center justify-center text-base max-md:w-auto max-md:rounded-r-[1.07vw] max-md:border-l-0 max-md:px-0 max-md:pt-[1.87vw] max-md:pb-[1.33vw] max-md:text-[3.47vw] max-md:font-bold max-md:text-white',
                    isStreamAvailable
                      ? 'max-md:max-w-[21.2vw] max-md:min-w-[18.03vw]'
                      : 'max-md:max-w-[31.2vw] max-md:min-w-[29.33vw]',
                    !isYellowTheme &&
                      !isMcwCasinoTheme &&
                      'max-md:border max-md:border-black/40 max-md:bg-black/10 max-md:shadow-[inset_0_0.27vw_0_0_rgba(var(--white-rgb),0.3)]',
                    isYellowTheme &&
                      'max-md:!bg-transparent max-md:!text-(--dark)',
                    isMcwCasinoTheme &&
                      'max-md:!bg-white/10 max-md:!text-[#ffd45f]'
                  )}
                  onClick={openBetsClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openBetsClick()}
                >
                  <DollarCoinIcon className="max-md:[&_svg]:h-[5.33333vw] max-md:[&_svg]:w-[5.33333vw]" />
                  <p className="ms-lg-2 mb-0 max-md:ml-[1.33vw]">
                    {' '}
                    {t('header.bets', 'Bets')}
                  </p>
                </span>
                <div
                  className={cx(
                    'fixed inset-0 bg-white transition-all duration-100',
                    showBets
                      ? 'visible z-999 opacity-100'
                      : 'invisible z-[-999] opacity-0'
                  )}
                >
                  <div className={stakeHeaderClass}>
                    <div className="flex flex-1 items-center text-white max-md:border-r max-md:border-white/30 max-md:px-[1.87vw] max-md:leading-[2.6] [&_svg]:mr-[1.33vw] max-md:[&_svg]:h-[6.33vw]! max-md:[&_svg]:w-[6.33vw]!">
                      <DollarCoinIcon />
                      <span className="font-bold max-md:text-[4vw]">
                        {t('openBets.title', 'Open Bets')}
                      </span>
                    </div>
                    <ClosePopoverIcon
                      className="cursor-pointer px-[3vw] leading-[2.2] [&_svg]:h-[3.8vw] [&_svg]:w-[3.8vw] [&_svg_path]:fill-white"
                      role="button"
                      tabIndex={0}
                      onClick={() => setShowBets(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setShowBets(false)}
                      aria-label={t('common.close', 'Close')}
                    />
                  </div>
                  {showBets && <OpenBets showBets={showBets} />}
                </div>
              </>
            )}
          </>
        )}

        <div className="ml-auto flex items-center justify-end md:ms-0">
          <div
            className={cx(
              'flex items-center text-white',
              isYellowTheme && '[&_.value]:text-(--dark)! [&_a]:text-(--dark)!',
              isMcwCasinoTheme &&
                '[&_.label]:!text-[#ffd45f] [&_.value]:!text-[#ffd45f]'
            )}
          >
            <div className="flex items-center justify-between">
              {isBalanceRefresh ? (
                <div className="me-2 [&_span]:mr-1.5 [&_span]:inline-block [&_span]:h-1 [&_span]:w-1 [&_span]:animate-[loadBar_0.8s_ease_infinite] [&_span]:rounded-full [&_span]:bg-white [&_span]:opacity-0 max-md:[&_span]:bg-black">
                  {LOADING_BAR_ITEMS.map((n) => (
                    <span
                      key={n}
                      style={{ animationDelay: `${(n - 1) * 0.1}s` }}
                    />
                  ))}
                </div>
              ) : (
                <a
                  className="items-center pr-3.5 text-white no-underline max-md:pr-[2.13vw] max-md:text-right max-md:text-[3.2vw] md:flex [&_.value]:font-bold [&_.value]:opacity-100! [&_span]:opacity-70"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  <p className="mb-0">
                    <span className="label">{balanceLabel} </span>
                    <span className="value md:pr-1">
                      {currency} {formatBalance(amount)}
                    </span>
                  </p>
                  <p className="mb-0">
                    <span className="label">
                      {t('common.exposure', 'Exposure')}
                    </span>
                    <span
                      className={cx(
                        'value px-1.5 py-px text-white',
                        !isYellowTheme && isExposure && 'text-[#ff4040]!'
                      )}
                    >
                      {isExposure
                        ? `( ${formatBalance(exposure)} )`
                        : formatBalance(exposure)}
                    </span>
                  </p>
                </a>
              )}
            </div>
            <button
              type="button"
              className={cx(
                'flex h-[26px] w-[28px] items-center justify-center rounded-[3px] border border-black/30 bg-black/30 px-1.5 shadow-[inset_0_1px_0_0_rgba(var(--white-rgb),0.5)] hover:underline max-md:h-[9.47vw] max-md:w-auto max-md:border max-md:border-black/40 max-md:bg-black/10 max-md:px-[1.87vw] max-md:py-[1.7vw] max-md:shadow-[inset_0_0.27vw_0_0_rgba(var(--white-rgb),0.5)] [&_svg]:h-[14px] [&_svg]:w-[14px] max-md:[&_svg]:h-[5.07vw] max-md:[&_svg]:w-[5.07vw]',
                isYellowTheme && '!bg-transparent [&_svg]:brightness-0'
              )}
              onClick={balanceRefresh}
              aria-label={t('header.refreshBalance', 'Refresh balance')}
            >
              <RefreshIcon />
            </button>
          </div>

          {showAccountPopup && (
            <MyAccountPopup
              isMobile={isMob && !isAccountRoute}
              userName={user?.fullName || user?.userName || 'User'}
            />
          )}
        </div>

        {showMobileStake && (
          <div
            className={cx(
              'ml-[2.13vw] flex h-[9.47vw] w-auto items-center rounded-[1.07vw] border border-black/40 bg-black/10 px-[1.27vw] py-[1.7vw] shadow-[inset_0_0.27vw_0_0_rgba(var(--white-rgb),0.3)] [&_svg]:text-white max-md:[&_svg]:h-[6.07vw] max-md:[&_svg]:w-[6.07vw]',
              isYellowTheme && '!bg-transparent [&_svg]:brightness-0',
              isMcwCasinoTheme && '!bg-white/10 [&_svg]:!text-[#ffd45f]'
            )}
            onClick={openMobileStake}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openMobileStake(e)}
            aria-label={t('header.openStakeSettings', 'Open stake settings')}
          >
            <SettingIcon />
          </div>
        )}
      </header>

      <Overlay
        show={stakeOpen}
        target={stakeTarget}
        placement="bottom"
        rootClose={false}
        onHide={() => setStakeOpen(false)}
      >
        <Popover className="max-md:fixed max-md:inset-0 max-md:!mt-0 max-md:!max-w-full max-md:overflow-y-auto max-md:rounded-none max-md:pb-[16.33vw]">
          <Popover.Body className="p-0">
            <Stake isMobile onCancel={() => setStakeOpen(false)} />
          </Popover.Body>
        </Popover>
      </Overlay>

      {showSubHeader && <SubHeader />}
    </div>
  )
}
