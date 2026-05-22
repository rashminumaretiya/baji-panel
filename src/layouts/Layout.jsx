import { Suspense, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useLocation } from 'react-router-dom'
import {
  selectIsAuthenticated,
  selectIsLoginWindow,
  selectIsOneClickBet,
  setLoginWindow,
} from '../store/slices/authSlice'
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

const cx = (...classes) => classes.filter(Boolean).join(' ')

// Ported from the original layout.scss .main-wrapper / .left-content /
// .middle-content / .right-content / .scroll-wrap rules.
const MAIN_WRAPPER_BASE =
  'relative mx-auto bg-[var(--xs-gray)] lg:w-[calc(100%-40px)] mt-[105px] md:w-[calc(100%-25px)] max-md:mt-[14.67vw] max-md:w-full'

const MAIN_WRAPPER_NO_HEADER =
  'relative mx-auto bg-[var(--xs-gray)] w-[calc(100%-40px)] mt-[31px] max-md:mt-0 max-md:w-full'

const LEFT_CONTENT_BASE =
  'absolute left-0 top-0 w-[17.36%] h-[calc(100vh-105px)] max-md:h-[calc(100vh-14.67vw)] bg-[var(--xl-black)]'

const LEFT_CONTENT_LIGHT =
  'absolute left-0 top-0 w-[17.36%] h-[calc(100vh-105px)] max-md:h-[calc(100vh-14.67vw)] bg-white md:w-[16.33%]'

const LEFT_CONTENT_MCW =
  'absolute left-0 top-0 w-[17.36%] h-[calc(100vh-105px)] max-md:h-[calc(100vh-14.67vw)] bg-white'

const MIDDLE_CONTENT_BASE =
  'relative ml-[17.36%] mr-[26.04%] px-[15px] h-[calc(100svh-105px)] overflow-y-auto max-md:ml-0 max-md:mr-0 max-md:px-0'

const MIDDLE_CONTENT_YELLOW =
  'relative md:ml-[16.36%] ml-[17.36%] mr-[26.04%] px-[15px] h-[calc(100svh-105px)] overflow-y-auto max-md:ml-0 max-md:mr-0 max-md:px-0'

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

  const mainWrapperClass = isAuthenticated
    ? MAIN_WRAPPER_BASE
    : MAIN_WRAPPER_NO_HEADER

  const leftContentClass = isYellowTheme
    ? LEFT_CONTENT_LIGHT
    : isMcwCasinoTheme
      ? LEFT_CONTENT_MCW
      : LEFT_CONTENT_BASE

  const middleContentClass = cx(
    isYellowTheme ? MIDDLE_CONTENT_YELLOW : MIDDLE_CONTENT_BASE,
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
          <div className={leftContentClass}>
            <SportsSidebar />
          </div>
        )}

        <div className={middleContentClass}>
          {isFullScreenLoader && (
            <div className="fixed inset-0 flex items-center justify-center z-[9999]">
              <Loader show message="common.loader.pleaseWait" />
            </div>
          )}
          {isMainScreenLoader && (
            <div className="absolute inset-0 flex items-center justify-center z-[999]">
              <Loader show message="common.loader.loading" />
            </div>
          )}

          {showNewsLine && <NewsLine />}
          <div className={scrollWrapClass}>
            <Suspense fallback={<Loader show variant="wrapper" />}>
              <Outlet />
            </Suspense>
          </div>

          {isOneClickBet && <OneClickBet />}
        </div>

        {showMobileNavigation && <MobileNavigation />}

        {showRightContent && (
          <div className={RIGHT_CONTENT}>
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
