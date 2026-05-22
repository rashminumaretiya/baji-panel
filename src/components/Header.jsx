import { useEffect, useState } from 'react'
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
  selectIsYellowTheme,
  setIsPlayLiveStream,
  selectLogo,
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

function getDisplayAmount(wallet) {
  const raw = wallet?.amount ?? wallet?.balance ?? 0
  return raw > 0 ? Math.floor(raw * 10) / 10 : 0
}

const HEADER_BASE =
  'flex items-center px-5 pr-[25px] py-2 h-[74px] bg-[var(--primary)] min-w-[1350px] max-mobile:px-0 max-mobile:pr-[1.87vw] max-mobile:py-[2.67vw] max-mobile:h-[14.67vw] max-mobile:min-w-0'

const HEADER_YELLOW = 'bg-gradient-to-b from-[#ffcb2e] to-[#ffb80c]'
const HEADER_MCW = 'bg-gradient-to-b from-[#2f2f2f] to-[#010101]'

export default function Header({ logo: logoProp, isStreamAvailable = false }) {
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
  const logoFromStore = useSelector(selectLogo)
  const logo = logoProp ?? logoFromStore ?? SITE_LOGO

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

  const headerClass = cx(
    HEADER_BASE,
    isYellowTheme && HEADER_YELLOW,
    isMcwCasinoTheme && HEADER_MCW
  )

  // Mobile stake popup header (used inside the open-bets drawer).
  const stakeHeaderClass = cx(
    'flex items-center justify-between bg-[var(--primary)]',
    isYellowTheme &&
      'bg-gradient-to-b from-[var(--sm-primary-yellow)] to-[var(--md-primary-yellow)]',
    isMcwCasinoTheme && 'bg-gradient-to-b from-[#2f2f2f] to-[#010101]'
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

  const showSubHeader = !isMob

  if (!isAuth) {
    return showSubHeader ? <SubHeader /> : null
  }

  return (
    <div>
      <header className={headerClass}>
        {!isMob ? (
          <div className="inline-flex sm:flex-1 items-center">
            <div className="me-0 sm:me-2 xl:me-3 [&_img]:object-cover [&_img]:h-auto [&_img]:w-auto [&_img]:max-w-[100px] [&_img]:max-h-[50px]">
              <img
                src={logo}
                alt="logo"
                onClick={navigateToHome}
                onKeyDown={(e) => e.key === 'Enter' && navigateToHome()}
                role="button"
                tabIndex={0}
              />
            </div>
            {showSearch && <EventSearch />}
          </div>
        ) : (
          <>
            {showLiveStreamBtn && (
              <button
                type="button"
                className={cx(
                  'relative bg-[#beaf0d] text-white border border-[#948800] px-[1.87vw] py-[1.87vw] pb-[1.33vw] w-[11.2vw] rounded-none shadow-[inset_0_0.27vw_0_0_rgba(255,255,255,0.4)] before:inline-block before:content-[""] before:bg-[url(/img/svg/mobile-live-icon.svg)] before:bg-contain before:bg-center before:h-[5.27vw] before:w-[5.6vw] before:align-middle',
                  isPlayLiveStream &&
                    'bg-[var(--lg-orange)] border-[var(--mds-orange)] before:bg-[url(/img/svg/mobile-close-icon.svg)]'
                )}
                onClick={toggleLiveStream}
              />
            )}
            {showMobileBetsBtn && (
              <>
                <span
                  className={cx(
                    'flex items-center justify-center max-mobile:px-0 max-mobile:pt-[1.87vw] max-mobile:pb-[1.33vw] max-mobile:rounded-r-[1.07vw] max-mobile:min-w-[29.33vw] max-mobile:max-w-[31.2vw] max-mobile:text-[3.47vw] max-mobile:font-bold max-mobile:border-l-0 max-mobile:w-auto max-mobile:text-white text-base max-w-fit min-w-0',
                    isStreamAvailable &&
                      'max-mobile:min-w-[18.03vw] max-mobile:max-w-[21.2vw]',
                    !isYellowTheme &&
                      !isMcwCasinoTheme &&
                      'max-mobile:bg-black/10 max-mobile:border max-mobile:border-black/40 max-mobile:shadow-[inset_0_0.27vw_0_0_rgba(var(--white-rgb),0.3)]',
                    isYellowTheme &&
                      'max-mobile:!text-[var(--dark)] max-mobile:!bg-transparent',
                    isMcwCasinoTheme &&
                      'max-mobile:!bg-white/10 max-mobile:!text-[#ffd45f]'
                  )}
                  onClick={openBetsClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && openBetsClick()}
                >
                  <SvgIcon name="dollarCoin" />
                  <p className="mb-0 ms-lg-2 max-mobile:ml-[1.33vw]">Bets</p>
                </span>
                <div
                  className={cx(
                    'fixed inset-0 transition-all duration-100 bg-white',
                    showBets
                      ? 'opacity-100 visible z-[999]'
                      : 'opacity-0 invisible -z-[999]'
                  )}
                >
                  <div className={stakeHeaderClass}>
                    <div className="flex items-center text-white flex-1 max-mobile:px-[1.87vw] max-mobile:leading-[2.6] max-mobile:border-r max-mobile:border-white/30 [&_svg]:max-mobile:w-[6.33vw] [&_svg]:max-mobile:h-[6.33vw] [&_svg]:mr-[1.33vw]">
                      <SvgIcon name="dollarCoin" />
                      <span>Open Bets</span>
                    </div>
                    <SvgIcon
                      name="closePopover"
                      className="px-[3vw] leading-[2.2] cursor-pointer [&_svg]:h-[3.8vw] [&_svg]:w-[3.8vw] [&_svg_path]:fill-white"
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

        <div className="flex items-center justify-end ms-auto md:ms-0">
          <div
            className={cx(
              'flex items-center text-white',
              isYellowTheme &&
                '[&_a]:!text-[var(--dark)] [&_.value]:!text-[var(--dark)]',
              isMcwCasinoTheme &&
                '[&_.label]:!text-[#ffd45f] [&_.value]:!text-[#ffd45f]'
            )}
          >
            <div className="flex items-center justify-between">
              {isBalanceRefresh ? (
                <div className="me-2 [&_span]:inline-block [&_span]:w-1 [&_span]:h-1 [&_span]:rounded-full [&_span]:bg-white [&_span]:opacity-0 [&_span]:mr-1.5 [&_span]:animate-[loadBar_0.8s_ease_infinite] max-mobile:[&_span]:bg-black">
                  {LOADING_BAR_ITEMS.map((n) => (
                    <span
                      key={n}
                      style={{ animationDelay: `${(n - 1) * 0.1}s` }}
                    />
                  ))}
                </div>
              ) : (
                <a
                  className="md:flex items-center pr-3.5 max-mobile:pr-[2.13vw] max-mobile:text-right max-mobile:text-[3.2vw] text-white no-underline [&_span]:opacity-70 [&_.value]:opacity-100! [&_.value]:font-bold"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  <p className="mb-0">
                    <span className="label">{balanceLabel} </span>
                    <span className="md:pr-1 value">
                      {currency} {formatBalance(amount)}
                    </span>
                  </p>
                  <p className="mb-0">
                    <span className="label">Exposure</span>
                    <span
                      className={cx(
                        'value text-white px-1.5 py-px',
                        isExposure && 'text-[#d0021b] !important rounded-md',
                        !isYellowTheme && isExposure && 'text-[#ff4040]'
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
                'h-[26px] w-[28px] flex items-center justify-center px-1.5 bg-black/30 border border-black/30 shadow-[inset_0_1px_0_0_rgba(var(--white-rgb),0.5)] rounded-[3px] hover:underline max-mobile:h-[9.47vw] max-mobile:w-auto max-mobile:px-[1.87vw] max-mobile:py-[1.7vw] max-mobile:bg-black/10 max-mobile:border max-mobile:border-black/40 max-mobile:shadow-[inset_0_0.27vw_0_0_rgba(var(--white-rgb),0.5)] [&_svg]:h-[14px] [&_svg]:w-[14px] max-mobile:[&_svg]:h-[5.07vw] max-mobile:[&_svg]:w-[5.07vw]',
                isYellowTheme && '!bg-transparent [&_svg]:brightness-0'
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
              'flex items-center h-[9.47vw] w-auto px-[1.27vw] py-[1.7vw] rounded-[1.07vw] ml-[2.13vw] bg-black/10 border border-black/40 shadow-[inset_0_0.27vw_0_0_rgba(var(--white-rgb),0.3)] [&_svg]:text-white max-mobile:[&_svg]:w-[6.07vw] max-mobile:[&_svg]:h-[6.07vw]',
              isYellowTheme && '!bg-transparent [&_svg]:brightness-0',
              isMcwCasinoTheme && '!bg-white/10 [&_svg]:!text-[#ffd45f]'
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
        placement="bottom"
        rootClose={false}
        onHide={() => setStakeOpen(false)}
      >
        <Popover className="max-mobile:fixed max-mobile:inset-0 max-mobile:!max-w-full max-mobile:!mt-0 max-mobile:rounded-none max-mobile:overflow-y-auto max-mobile:pb-[16.33vw]">
          <Popover.Body className="p-0">
            <Stake isMobile onCancel={() => setStakeOpen(false)} />
          </Popover.Body>
        </Popover>
      </Overlay>

      {showSubHeader && <SubHeader />}
    </div>
  )
}
