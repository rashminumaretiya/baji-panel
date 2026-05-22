import { Suspense, useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import BetSlip from '../components/BetSlip.jsx'
import Header from '../components/Header.jsx'
import MobileNavigation from '../components/MobileNavigation.jsx'
import NewsLine from '../components/NewsLine.jsx'
import OpenBets from '../components/OpenBets.jsx'
import Loader from '../shared/components/Loader.jsx'
import { selectIsAuthenticated } from '../store/slices/authSlice.js'
import {
  selectIsMobile,
  selectIsYellowTheme,
} from '../store/slices/commonSlice.js'

export default function InPlayLayout() {
  const { pathname } = useLocation()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isMobile = useSelector(selectIsMobile)
  const isYellowTheme = useSelector(selectIsYellowTheme)

  const isPlatformPage = useMemo(
    () => pathname.includes('platform'),
    [pathname]
  )
  const showNewsLine = isAuthenticated && !isPlatformPage && !isYellowTheme
  const showMobileNavigation = isMobile && !isPlatformPage

  return (
    <div>
      <div className="fixed top-0 left-0 right-0 z-[1000]">
        <Header />
      </div>

      <div className="relative mx-auto bg-[var(--xs-gray)] w-[calc(100%-40px)] mt-[105px] min-[768px]:max-[1440px]:w-[calc(100%-25px)] max-mobile:mt-[14.67vw] max-mobile:w-full">
        <div className="relative h-[calc(100svh-105px)] overflow-y-auto ml-0 pl-0 mr-[26.04%] px-[15px] max-mobile:mr-0 max-mobile:px-0">
          {showNewsLine && <NewsLine />}
          <div className="min-h-[calc(100vh-148px)] overflow-y-auto max-mobile:min-h-[unset] max-mobile:max-h-[unset] max-mobile:overflow-y-visible">
            <Suspense fallback={<Loader show variant="wrapper" />}>
              <Outlet />
            </Suspense>
          </div>

          {showMobileNavigation && <MobileNavigation />}
        </div>

        {!isMobile && (
          <div className="absolute w-[26.04%] z-[8] right-0 top-0 bottom-0 bg-white">
            <BetSlip />
            <OpenBets />
          </div>
        )}
      </div>
    </div>
  )
}
