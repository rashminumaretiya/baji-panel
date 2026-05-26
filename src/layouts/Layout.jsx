import { Suspense, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useLocation } from 'react-router-dom'
import {
  selectIsAuthenticated,
  selectIsLoginWindow,
  selectIsOneClickBet,
  setLoginWindow,
} from '../store/slices/authSlice'
import { fetchUplineContacts } from '../store/slices/accountSlice'
import {
  selectIsFullScreenLoader,
  selectIsMainScreenLoader,
  selectIsMcvYellowTheme,
  selectIsMobile,
  selectIsYellowTheme,
} from '../store/slices/commonSlice'
import { selectLayoutedRoutes } from '../store/slices/layoutSlice'
import BetSlip from '../components/BetSlip'
import OpenBets from '../components/OpenBets.jsx'
import DevAuthToggle from '../components/DevAuthToggle'
import Header from '../components/Header'
import MobileNavigation from '../components/MobileNavigation.jsx'
import OneClickBet from '../components/OneClickBet.jsx'
import NewsLine from '../components/NewsLine'
import Loader from '../shared/components/Loader.jsx'
import LoginModel from '../shared/components/loginModel/LoginModel.jsx'
import SportsSidebar from '../shared/components/sports-sidebar/SportsSidebar'
import { cx } from '../utils/cx.js'

// Ported from the original layout.scss .main-wrapper / .left-content /
// .middle-content / .right-content / .scroll-wrap rules.
const MAIN_WRAPPER_BASE =
  'relative mx-auto bg-(--xs-gray) lg:w-[calc(100%-40px)] mt-[105px] md:w-[calc(100%-25px)] max-md:mt-[14.67vw] max-md:w-full'

const MAIN_WRAPPER_NO_HEADER =
  'relative mx-auto bg-(--xs-gray) w-[calc(100%-40px)] max-md:w-full'

const LEFT_CONTENT_BASE =
  'absolute left-0 top-0 w-[17.36%] max-md:h-[calc(100vh-14.67vw)] bg-(--xl-black)'

const LEFT_CONTENT_LIGHT =
  'absolute left-0 top-0 w-[17.36%] max-md:h-[calc(100vh-14.67vw)] bg-white md:w-[16.33%]'

const LEFT_CONTENT_MCW =
  'absolute left-0 top-0 w-[17.36%] max-md:h-[calc(100vh-14.67vw)] bg-white'

// Same convention as `MIDDLE_CONTENT_HEIGHT_*`: 105px gutter under the full
// header (authed), 31px gutter under the sub-header strip (unauthed).
const LEFT_CONTENT_HEIGHT_AUTH = 'h-[calc(100vh-105px)]'
const LEFT_CONTENT_HEIGHT_NO_AUTH = 'h-[calc(100vh-31px)]'

const MIDDLE_CONTENT_BASE =
  'relative ml-[17.36%] mr-[26.04%] px-[15px] overflow-y-auto max-md:ml-0 max-md:mr-0 max-md:px-0'

const MIDDLE_CONTENT_YELLOW =
  'relative md:ml-[16.36%] ml-[17.36%] mr-[26.04%] px-[15px] overflow-y-auto max-md:ml-0 max-md:mr-0 max-md:px-0'

// Height matches the top-margin of `MAIN_WRAPPER_*`: 105px when the full
// header is rendered (authed), 31px when only the sub-header strip shows
// (unauthed). Keeps the middle column flush with the bottom of the viewport
// instead of overshooting and forcing extra scroll when logged out.
const MIDDLE_CONTENT_HEIGHT_AUTH = 'h-[calc(100svh-105px)]'
const MIDDLE_CONTENT_HEIGHT_NO_AUTH = 'h-[calc(100vh-31px)]'

const MIDDLE_CONTENT_MOBILE_ROUTER = 'max-md:pb-[18vw]'

const SCROLL_WRAP_BASE =
  'min-h-[calc(100vh-148px)] overflow-y-auto max-md:min-h-[unset] max-md:max-h-[unset] max-md:overflow-y-visible'

const SCROLL_WRAP_ONE_CLICK = 'h-[calc(100vh-161px)]'
const SCROLL_WRAP_YELLOW = 'h-auto max-md:max-h-[unset]'

const RIGHT_CONTENT =
  'absolute w-[26.04%] z-[8] right-0 top-0 bottom-0 bg-white'

export default function Layout() {
  const { pathname } = useLocation()
  const dispatch = useDispatch()

  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isMobile = useSelector(selectIsMobile)
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const isMcwCasinoTheme = useSelector(selectIsMcvYellowTheme)
  const isOneClickBet = useSelector(selectIsOneClickBet)
  const isLoginWindow = useSelector(selectIsLoginWindow)
  const layoutedRoutes = useSelector(selectLayoutedRoutes)
  const isMainScreenLoader = useSelector(selectIsMainScreenLoader)
  const isFullScreenLoader = useSelector(selectIsFullScreenLoader)

  const firstSegment = useMemo(() => pathname.split('/')[1] ?? '', [pathname])
  const isAccountRoute = useMemo(
    () => pathname.includes('/my-account'),
    [pathname]
  )
  const isPlatformPage = useMemo(
    () => pathname.includes('platform'),
    [pathname]
  )
  const showNewsLine = isAuthenticated && !isPlatformPage && !isYellowTheme

  const showSportSidebar = useMemo(() => {
    if (isMobile) return false
    return layoutedRoutes.includes(firstSegment) && firstSegment !== 'inplay'
  }, [isMobile, layoutedRoutes, firstSegment])

  const showRightContent = !isMobile && !isAccountRoute
  const showMobileNavigation = isMobile && !isPlatformPage

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchUplineContacts())
  }, [isAuthenticated, dispatch])

  const mainWrapperClass = isAuthenticated
    ? MAIN_WRAPPER_BASE
    : MAIN_WRAPPER_NO_HEADER

  const leftContentClass = cx(
    isYellowTheme
      ? LEFT_CONTENT_LIGHT
      : isMcwCasinoTheme
        ? LEFT_CONTENT_MCW
        : LEFT_CONTENT_BASE,
    isAuthenticated ? LEFT_CONTENT_HEIGHT_AUTH : LEFT_CONTENT_HEIGHT_NO_AUTH
  )

  const middleContentClass = cx(
    isYellowTheme ? MIDDLE_CONTENT_YELLOW : MIDDLE_CONTENT_BASE,
    isAuthenticated
      ? MIDDLE_CONTENT_HEIGHT_AUTH
      : MIDDLE_CONTENT_HEIGHT_NO_AUTH,
    isMobile && MIDDLE_CONTENT_MOBILE_ROUTER
  )

  const scrollWrapClass = cx(
    SCROLL_WRAP_BASE,
    isOneClickBet && SCROLL_WRAP_ONE_CLICK,
    isYellowTheme && SCROLL_WRAP_YELLOW
  )

  return (
    <div>
      <DevAuthToggle />

      <Header />

      <div className={mainWrapperClass}>
        {showSportSidebar && (
          <div className={leftContentClass} aria-label="Sports navigation">
            <SportsSidebar />
          </div>
        )}

        <div className={cx('middle-content', middleContentClass)}>
          {isFullScreenLoader && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center">
              <Loader show message="common.loader.pleaseWait" />
            </div>
          )}
          {isMainScreenLoader && (
            <div className="absolute inset-0 z-[999] flex items-center justify-center">
              <Loader show message="common.loader.loading" />
            </div>
          )}

          {showNewsLine && <NewsLine />}
          <div className={scrollWrapClass}>
            <Suspense fallback={<Loader show variant="wrapper" />}>
              <Outlet />
            </Suspense>
          </div>

          {!isMobile && isOneClickBet && <OneClickBet />}
        </div>

        {showMobileNavigation && <MobileNavigation />}

        {showRightContent && (
          <div className={RIGHT_CONTENT} aria-label="Bet slip and open bets">
            <BetSlip />
            {isAuthenticated && <OpenBets />}
          </div>
        )}
      </div>

      <LoginModel
        isOpen={isLoginWindow}
        onClose={() => dispatch(setLoginWindow(false))}
      />
    </div>
  )
}
