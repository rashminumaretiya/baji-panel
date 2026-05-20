/* eslint-disable react/prop-types */
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Overlay, Popover } from 'react-bootstrap'
import './header.scss'
import { useIsMobile } from '../hooks/useMediaQuery.js'
import { SITE_LOGO } from './MyAccountPopup.jsx'
import EventSearch from './EventSearch.jsx'
import MyAccountPopup from './MyAccountPopup.jsx'
import OpenBets from './OpenBets.jsx'
import Stake from './Stake.jsx'
import SubHeader from './SubHeader.jsx'
import SvgIcon from './SvgIcon.jsx'

const DEFAULT_WALLET = { balance: 1000.1, exposure: 0 }
const DEFAULT_CURRENCY = 'BDT'
const DEFAULT_CAPTCHA = { code: '1234' }

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

export default function Header({
  isShowHeader = true,
  isAuthenticated: isAuthProp = true,
  wallet = DEFAULT_WALLET,
  currency = DEFAULT_CURRENCY,
  logo = SITE_LOGO,
  validationCode = DEFAULT_CAPTCHA,
  isStreamAvailable = false,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const isMob = useIsMobile()

  const [isAuth, setIsAuth] = useState(isAuthProp)
  const [isBalanceRefresh, setIsBalanceRefresh] = useState(false)
  const [showBets, setShowBets] = useState(false)
  const [isPlayLiveStream, setIsPlayLiveStream] = useState(false)
  const [stakeOpen, setStakeOpen] = useState(false)
  const [stakeTarget, setStakeTarget] = useState(null)
  const [loginForm, setLoginForm] = useState({
    userName: '',
    password: '',
    code: '',
  })

  const isAccountRoute = location.pathname.includes('my-account')
  const isOddsPage = location.pathname.includes('game-details')

  const showMobileBetsBtn = isAuth && isMob && !isAccountRoute
  const showLogo = !isAuth || !isMob || isAccountRoute
  const showSearch = !isMob && !isAccountRoute
  const balanceColumnLayout = !isMob || isAccountRoute
  const exposure = wallet?.exposure ?? 0
  const showAccountPopup = isAuth && (!isMob || isAccountRoute)
  const showLiveTV = isAuth && isStreamAvailable && isMob && isOddsPage

  const refreshBalance = () => {
    setIsBalanceRefresh(true)
    setTimeout(() => setIsBalanceRefresh(false), 2000)
  }

  const navigateToHome = () => navigate('/highlight')

  const openBetsClick = () => setShowBets(true)

  const toggleLiveStream = () => setIsPlayLiveStream((v) => !v)

  const login = () => {
    if (isMob) {
      navigate('/auth/login')
      return
    }
    if (validationCode?.code !== loginForm.code) return
    setIsAuth(true)
  }

  const signUp = () => {
    if (isMob) {
      navigate('/auth/sign-up')
      return
    }
  }

  const openMobileStake = (e) => {
    setStakeTarget(e.currentTarget)
    setStakeOpen(true)
  }

  if (!isShowHeader) {
    return !isMob ? <SubHeader isAuthenticated={isAuth} /> : null
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
            isAuth ? 'bet-btn-wrapper' : '',
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
          {isAuth ? (
            <>
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
                          <p
                            className={
                              isMob ? 'd-flex justify-content-end' : ''
                            }
                          >
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
                            <span className="value">
                              {formatExposure(exposure)}
                            </span>
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
                  {isMob && isAuth && !isAccountRoute && (
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

              {showAccountPopup && !isMob && (
                <MyAccountPopup isMobile={isMob} />
              )}
            </>
          ) : (
            <div className="d-inline-flex align-items-center gap-2 auth-btns">
              {!isMob && (
                <form
                  className="header-inputes d-flex align-items-center justify-content-end gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    login()
                  }}
                >
                  <SvgIcon name="userIcon" className="user-icon" />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Username"
                    value={loginForm.userName}
                    onChange={(e) =>
                      setLoginForm((f) => ({ ...f, userName: e.target.value }))
                    }
                  />
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm((f) => ({ ...f, password: e.target.value }))
                    }
                  />
                  <div className="position-relative validation-input">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Validation"
                      maxLength={4}
                      value={loginForm.code}
                      onChange={(e) =>
                        setLoginForm((f) => ({ ...f, code: e.target.value }))
                      }
                    />
                    <span className="code">{validationCode?.code}</span>
                  </div>
                </form>
              )}
              <button type="button" className="btn btn-red" onClick={login}>
                {isMob && <SvgIcon name="login_user" className="me-1" />}
                <span>Login</span>
                {!isMob && <SvgIcon name="logInIcon" className="ms-1" />}
              </button>
              <button type="button" className="btn btn-yellow" onClick={signUp}>
                <span>Sign Up</span>
                <SvgIcon name="shareIcon" className="ms-1" />
              </button>
            </div>
          )}
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
