import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Overlay, Popover } from 'react-bootstrap'
import './header.scss'
import { useIsMobile } from '../hooks/useMediaQuery.js'
import {
  selectCurrency,
  selectIsAuthenticated,
  selectUser,
  selectWallet,
} from '../store/slices/authSlice.js'
import { SITE_LOGO } from './MyAccountPopup.jsx'
import EventSearch from './EventSearch.jsx'
import MyAccountPopup from './MyAccountPopup.jsx'
import OpenBets from './OpenBets.jsx'
import Stake from './Stake.jsx'
import SubHeader from './SubHeader.jsx'
import SvgIcon from './SvgIcon.jsx'

const DEFAULT_WALLET = { balance: 1000.1, exposure: 0 }
const DEFAULT_CURRENCY = 'BDT'

function formatBalance(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatExposure(value) {
  const ex = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
  return value === 0 ? ex : `(${ex})`
}

export default function Header({ logo = SITE_LOGO, isStreamAvailable = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isMob = useIsMobile()

  // Auth-aware state, sourced from Redux (mirrors Angular signal services).
  const isAuth = useSelector(selectIsAuthenticated)
  const user = useSelector(selectUser)
  const walletFromStore = useSelector(selectWallet)
  const currencyFromStore = useSelector(selectCurrency)
  const wallet = walletFromStore ?? DEFAULT_WALLET
  const currency = currencyFromStore ?? user?.currency ?? DEFAULT_CURRENCY

  const [isBalanceRefresh, setIsBalanceRefresh] = useState(false)
  const [showBets, setShowBets] = useState(false)
  const [isPlayLiveStream, setIsPlayLiveStream] = useState(false)
  const [stakeOpen, setStakeOpen] = useState(false)
  const [stakeTarget, setStakeTarget] = useState(null)

  const isAccountRoute = location.pathname.includes('my-account')
  const isOddsPage = location.pathname.includes('game-details')

  const showMobileBetsBtn = isAuth && isMob && !isAccountRoute
  const showLogo = !isMob || isAccountRoute
  const showSearch = !isMob && !isAccountRoute
  const balanceColumnLayout = !isMob || isAccountRoute
  const exposure = wallet?.exposure ?? 0
  const showAccountPopup = isAuth && (!isMob || isAccountRoute)
  const showLiveTV = isAuth && isStreamAvailable && isMob && isOddsPage

  const refreshBalance = () => {
    setIsBalanceRefresh(true)
    setTimeout(() => setIsBalanceRefresh(false), 2000)
  }

  const navigateToHome = () => navigate('/')
  const openBetsClick = () => setShowBets(true)
  const toggleLiveStream = () => setIsPlayLiveStream((v) => !v)
  const openMobileStake = (e) => {
    setStakeTarget(e.currentTarget)
    setStakeOpen(true)
  }

  // Hide the main header bar when not logged in (use DevAuthToggle to authenticate).
  // The SubHeader stays visible on desktop in both states (mirrors Angular's layout).
  if (!isAuth) {
    return !isMob ? <SubHeader isAuthenticated={false} /> : null
  }

  return (
    <>
      <header className="header">
        {showLiveTV && (
          <button
            type="button"
            className={`btn-live${isPlayLiveStream ? ' btn-live-close' : ''}`}
            onClick={toggleLiveStream}
          >
            <SvgIcon name={isPlayLiveStream ? 'liveTVClose' : 'liveTV'} />
          </button>
        )}

        <div
          className={[
            'd-inline-flex align-items-center flex-sm-fill gap-2',
            'bet-btn-wrapper',
            showLiveTV ? 'open-live-TV' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {showLogo && (
            <div className="logo-wrapper me-xl-3 me-sm-2 me-0">
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
          )}

          {showSearch && <EventSearch />}

          {showMobileBetsBtn && (
            <>
              <span
                className="btn-bet"
                onClick={openBetsClick}
                role="button"
                tabIndex={0}
              >
                <SvgIcon name="dollarCoin" />
                <p className="mb-0 ms-lg-2">Bets</p>
              </span>
              <div
                className={`custom-modal open-bets${showBets ? ' show' : ''}`}
              >
                <div className="d-flex justify-content-between align-items-center open-bets-header">
                  <p className="m-0 d-flex align-items-center">
                    <SvgIcon name="dollarCoin" className="bet-icon" />
                    <span> Open Bets</span>
                  </p>
                  <span>
                    <SvgIcon
                      name="cross"
                      className="close-icon"
                      role="button"
                      onClick={() => setShowBets(false)}
                    />
                  </span>
                </div>
                {showBets && <OpenBets />}
              </div>
            </>
          )}
        </div>

        <div className="d-flex align-items-center justify-content-end balance-wrapper ms-auto me-0 gap-2 w-100">
          <div className="balance-outer">
            <div
              className={`balance d-flex ${!balanceColumnLayout ? ' flex-column' : ''}`}
            >
              <div className="d-flex align-items-center justify-content-between counter">
                {isBalanceRefresh ? (
                  <img
                    src="/img/money-refresh.gif"
                    alt="Refreshing balance"
                  />
                ) : (
                  <>
                    <a
                      className="d-md-flex align-items-center balance-main"
                      href="#"
                      onClick={(e) => e.preventDefault()}
                    >
                      <p className={isMob ? 'd-flex justify-content-end' : ''}>
                        <span className="label">
                          {isMob ? 'Main' : 'Main Balance'}
                        </span>
                        <span className="value pe-1">
                          {currency} {formatBalance(wallet?.balance ?? 0)}
                        </span>
                      </p>
                      <p
                        className={`exposure${isMob ? ' d-flex justify-content-end' : ''}`}
                      >
                        <span className="label">Exposure</span>
                        <span className="value">{formatExposure(exposure)}</span>
                      </p>
                    </a>
                    <span className="pluse-value">+1</span>
                  </>
                )}
              </div>
              <span
                className="cursor-pointer dark-btn"
                onClick={refreshBalance}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && refreshBalance()}
              >
                <SvgIcon name="refreshIcon" />
              </span>
              {isMob && !isAccountRoute && (
                <div
                  className="btn-dull setting-icon dark-btn"
                  onClick={openMobileStake}
                  role="button"
                  tabIndex={0}
                >
                  <SvgIcon name="settingIcon" />
                </div>
              )}
            </div>
          </div>

          {showAccountPopup && !isMob && <MyAccountPopup isMobile={isMob} />}
        </div>
      </header>

      <Overlay
        show={stakeOpen}
        target={stakeTarget}
        placement="bottom-end"
        rootClose
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
