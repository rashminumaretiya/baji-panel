/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { Overlay, Popover } from 'react-bootstrap'
import './header.scss'
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
  selectIsYellowTheme,
  setIsPlayLiveStream,
} from '../store/slices/commonSlice.js'
import { SITE_LOGO } from './MyAccountPopup.jsx'
import EventSearch from './EventSearch.jsx'
import MyAccountPopup from './MyAccountPopup.jsx'
import OpenBets from './OpenBets.jsx'
import Stake from './Stake.jsx'
import SubHeader from './SubHeader.jsx'
import SvgIcon from './SvgIcon.jsx'

const DEFAULT_WALLET = { balance: 0, exposure: 0 }
const DEFAULT_CURRENCY = 'BDT'
const LOADING_BAR_ITEMS = [1, 2, 3, 4, 5, 6, 7, 8]

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

function formatBalance(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatExposureValue(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function getDisplayAmount(wallet) {
  const raw = wallet?.amount ?? wallet?.balance ?? 0
  return raw > 0 ? Math.floor(raw * 10) / 10 : 0
}

export default function Header({
  logo = SITE_LOGO,
  isStreamAvailable = false,
}) {
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

  const wallet = walletFromStore ?? user?.wallet ?? DEFAULT_WALLET
  const currency = currencyFromStore ?? user?.currency ?? DEFAULT_CURRENCY

  const [isBalanceRefresh, setIsBalanceRefresh] = useState(false)
  const [showBets, setShowBets] = useState(false)
  const [stakeOpen, setStakeOpen] = useState(false)
  const [stakeTarget, setStakeTarget] = useState(null)

  const isAccountRoute = location.pathname.includes('my-account')
  const showMobileBetsBtn = isAuth && isMob && !isAccountRoute
  const showSearch = !isMob && !isAccountRoute
  const showAccountPopup = isAuth && !isMob
  const showMobileStake = isMob && !isAccountRoute
  const showLiveStreamBtn = isAuth && isMob && isStreamAvailable

  const exposure = wallet?.exposure ?? 0
  const isExposure = exposure > 0
  const amount = getDisplayAmount(wallet)

  const balanceLabel = !isMob && !isYellowTheme ? 'Main Balance' : 'Main'
  const exposureLabel = 'Exposure'

  const headerClass = cx(
    'header',
    isYellowTheme && 'yellow-theme',
    isMcwCasinoTheme && 'mcw-casino-theme'
  )

  const stakeHeaderClass = cx(
    'stake-mobile-header',
    isYellowTheme && 'yellow-theme',
    isMcwCasinoTheme && 'mcw-casino-theme'
  )

  useEffect(() => {
    if (!isAuth) return undefined
    dispatch(fetchBalance())
    const intervalId = setInterval(() => dispatch(fetchBalance()), 15000)
    return () => clearInterval(intervalId)
  }, [isAuth, dispatch])

  const balanceRefresh = () => {
    setIsBalanceRefresh(true)
    dispatch(fetchBalance()).finally(() => {
      setTimeout(() => setIsBalanceRefresh(false), 2000)
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

  if (!isAuth) {
    return !isMob ? <SubHeader isAuthenticated={false} /> : null
  }

  return (
    <>
      <header className={headerClass}>
        {!isMob ? (
          <div className="d-inline-flex flex-sm-fill align-items-center">
            <div className="logo-wrapper me-0 me-sm-2 me-xl-3">
              <img
                src={logo}
                className="site-logo"
                alt="logo"
                onClick={navigateToHome}
                onKeyDown={(e) => e.key === 'Enter' && navigateToHome()}
                role="button"
                tabIndex={0}
              />
            </div>
            {showSearch && <EventSearch isYellowTheme={isYellowTheme} />}
          </div>
        ) : (
          <>
            {showLiveStreamBtn && (
              <button
                type="button"
                className={cx(
                  'btn btn-live',
                  isPlayLiveStream && 'btn-live-close',
                  isYellowTheme && 'yellow-theme'
                )}
                onClick={toggleLiveStream}
              />
            )}
            {showMobileBetsBtn && (
              <>
                <span
                  className={cx(
                    'btn-bet btn-dull',
                    isStreamAvailable && 'small',
                    isYellowTheme && 'yellow-btn',
                    isMcwCasinoTheme && 'mcw-btn'
                  )}
                  onClick={openBetsClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openBetsClick()}
                >
                  <SvgIcon name="dollarCoin" />
                  <p className="mb-0 ms-lg-2">Bets</p>
                </span>
                <div
                  className={cx('custom-modal open-bets', showBets && 'show')}
                >
                  <div className={stakeHeaderClass}>
                    <div className="d-flex align-items-center text-white setting">
                      <SvgIcon name="dollarCoin" className="bet-icon" />
                      <span> Open Bets</span>
                    </div>
                    <SvgIcon
                      name="closePopover"
                      className="close"
                      role="button"
                      tabIndex={0}
                      onClick={() => setShowBets(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setShowBets(false)}
                    />
                  </div>
                  {showBets && <OpenBets showBets={showBets} />}
                </div>
              </>
            )}
          </>
        )}

        <div className="d-flex align-items-center justify-content-end balance-wrapper ms-auto ms-md-0">
          <div className={cx('balance-outer', isYellowTheme && 'dark-text')}>
            <div className="d-flex align-items-center justify-content-between counter">
              {isBalanceRefresh ? (
                <div className="loading-bar me-2">
                  {LOADING_BAR_ITEMS.map((n) => (
                    <span key={n} />
                  ))}
                </div>
              ) : (
                <a
                  className="d-md-flex align-items-center balance-main"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  <p>
                    <span className="label">{balanceLabel} </span>
                    <span className="pe-md-1 value">
                      {currency} {formatBalance(amount)}
                    </span>
                  </p>
                  <p className="exposure">
                    <span className="label">{exposureLabel}</span>
                    <span
                      className={cx(
                        'value',
                        !isYellowTheme && 'sm-red',
                        isExposure && 'red-exposure'
                      )}
                    >
                      {isExposure
                        ? `( ${formatExposureValue(exposure)} )`
                        : formatExposureValue(exposure)}
                    </span>
                  </p>
                </a>
              )}
            </div>
            <button
              type="button"
              className={cx(
                'btn btn-primary refresh-btn',
                isYellowTheme && 'yellow-btn'
              )}
              onClick={balanceRefresh}
            >
              <SvgIcon name="refreshIcon" />
            </button>
          </div>

          {showAccountPopup && (
            <MyAccountPopup
              userName={user?.fullName || user?.userName || 'User'}
            />
          )}
        </div>

        {showMobileStake && (
          <div
            className={cx(
              'btn-dull setting-icon',
              isYellowTheme && 'yellow-btn',
              isMcwCasinoTheme && 'mcw-btn'
            )}
            onClick={openMobileStake}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openMobileStake(e)}
          >
            <SvgIcon name="settingIcon" />
          </div>
        )}
      </header>

      <Overlay
        show={stakeOpen}
        target={stakeTarget}
        placement="bottom-end"
        rootClose={false}
        onHide={() => setStakeOpen(false)}
      >
        <Popover className="stake-popup-container">
          <Popover.Body className="p-0">
            <Stake isMobile onCancel={() => setStakeOpen(false)} />
          </Popover.Body>
        </Popover>
      </Overlay>

      {!isMob && <SubHeader isAuthenticated={isAuth} />}
    </>
  )
}
