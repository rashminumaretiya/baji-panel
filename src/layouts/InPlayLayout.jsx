import { Suspense, useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import BetSlip from '../components/BetSlip.jsx'
import Header from '../components/Header.jsx'
import MobileNavigation from '../components/MobileNavigation.jsx'
import NewsLine from '../components/NewsLine.jsx'
import OneClickBet from '../components/OneClickBet.jsx'
import OpenBets from '../components/OpenBets.jsx'
import Loader from '../shared/components/Loader.jsx'
import LoginModel from '../shared/components/loginModel/LoginModel.jsx'
import {
  selectIsAuthenticated,
  selectIsLoginWindow,
  selectIsOneClickBet,
  setLoginWindow,
} from '../store/slices/authSlice.js'
import {
  selectIsFullScreenLoader,
  selectIsMobile,
  selectIsYellowTheme,
} from '../store/slices/commonSlice.js'

export default function InPlayLayout() {
  const { pathname } = useLocation()
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isMobile = useSelector(selectIsMobile)
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const isLoginWindow = useSelector(selectIsLoginWindow)
  const isOneClickBet = useSelector(selectIsOneClickBet)
  const isFullScreenLoader = useSelector(selectIsFullScreenLoader)

  const isPlatformPage = useMemo(
    () => pathname.includes('platform'),
    [pathname]
  )
  const showNewsLine = isAuthenticated && !isPlatformPage && !isYellowTheme
  const showMobileNavigation = isMobile && !isPlatformPage

  return (
    <div>
      <Header />

      <div className="relative mx-auto bg-[var(--xs-gray)] w-[calc(100%-40px)] mt-[105px] min-[768px]:max-[1440px]:w-[calc(100%-25px)] max-md:mt-[14.67vw] max-md:w-full">
        {isFullScreenLoader && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999]">
            <Loader show message="common.loader.pleaseWait" />
          </div>
        )}
        <div className="relative h-[calc(100svh-105px)] overflow-y-auto ml-0 pl-0 mr-[26.04%] px-[15px] max-md:mr-0 max-md:px-0">
          {showNewsLine && <NewsLine />}
          <div className="min-h-[calc(100vh-148px)] overflow-y-auto max-md:min-h-[unset] max-md:max-h-[unset] max-md:overflow-y-visible md:pt-2">
            <Suspense fallback={<Loader show variant="wrapper" />}>
              <Outlet />
            </Suspense>
          </div>

          {isOneClickBet && <OneClickBet />}

          {showMobileNavigation && <MobileNavigation />}
        </div>

        {!isMobile && (
          <div className="absolute w-[26.04%] z-[8] right-0 top-0 bottom-0 bg-white">
            <BetSlip />
            <OpenBets />
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
