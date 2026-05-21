import { useMemo } from "react"
import { useSelector } from "react-redux"
import { Outlet, useLocation } from "react-router-dom"
import { selectIsAuthenticated, selectIsOneClickBet } from "../store/slices/authSlice"
import {
  selectIsMcvYellowTheme,
  selectIsMobile,
  selectIsYellowTheme,
} from "../store/slices/commonSlice"
import { selectLayoutedRoutes } from "../store/slices/layoutSlice"
import BetSlip from "../components/BetSlip"
import DevAuthToggle from "../components/DevAuthToggle"
import Header from "../components/Header"
import NewsLine from "../components/NewsLine"
import SportsSidebar from "../shared/components/sports-sidebar/SportsSidebar"
import "./layout.scss"

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function Layout() {
  const { pathname } = useLocation()

  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isMobile = useSelector(selectIsMobile)
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const isMcwCasinoTheme = useSelector(selectIsMcvYellowTheme)
  const isOneClickBet = useSelector(selectIsOneClickBet)
  const layoutedRoutes = useSelector(selectLayoutedRoutes)

  const firstSegment = useMemo(() => pathname.split('/')[1] ?? '', [pathname])
  const isAccountRoute = useMemo(
    () => pathname.includes('/my-account'),
    [pathname],
  )
  const isPlatformPage = useMemo(() => pathname.includes('platform'), [pathname])
  const showNewsLine = isAuthenticated && !isPlatformPage && !isYellowTheme

  const showSportSidebar = useMemo(() => {
    if (isMobile) return false
    return layoutedRoutes.includes(firstSegment) && firstSegment !== 'inplay'
  }, [isMobile, layoutedRoutes, firstSegment])

  const showRightContent = !isMobile && !isAccountRoute

    const showRightSidebar = useMemo(() => {
    if (isMobile) return false
    return layoutedRoutes.includes(firstSegment)
  }, [isMobile, layoutedRoutes, firstSegment])
  
  const mainWrapperClass = cx(
    'main-wrapper',
    isAuthenticated && 'auth',
    !isAuthenticated && 'no-header-wrapper',
  )
  const leftContentClass = cx(
    'left-content',
    isYellowTheme && 'light-sidebar',
    isMcwCasinoTheme && 'mcw-casino-sidebar',
  )
  const middleContentClass = cx(
    'middle-content',
    isYellowTheme && 'yellow-theme',
    isMobile && 'mobile-router-outlet',
  )
  const scrollWrapClass = cx(
    'scroll-wrap',
    isOneClickBet && 'show-one-click',
    isYellowTheme && 'yellow-theme',
  )

  return (
    <div className="app-layout">
      <DevAuthToggle />

      <div className="header-wrapper">
        <Header />
      </div>

      <div className={mainWrapperClass}>
        {showSportSidebar && (
          <div className={leftContentClass}>
            <SportsSidebar />
          </div>
        )}

        <div className={middleContentClass}>
          {showNewsLine && <NewsLine />}
          <div className={scrollWrapClass}>
            <Outlet />
          </div>

          {showRightSidebar && (
            <div className="right-data">
              <BetSlip />
            </div>
          )}
        </div>

        {showRightContent && <div className="right-content" />}
      </div>
    </div>
  )
}
