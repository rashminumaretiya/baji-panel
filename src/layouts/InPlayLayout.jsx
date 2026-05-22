import { Suspense, useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import BetSlip from '../components/BetSlip.jsx'
import Header from '../components/Header.jsx'
import MobileNavigation from '../components/MobileNavigation.jsx'
import NewsLine from '../components/NewsLine.jsx'
import OpenBets from '../components/OpenBets.jsx'
import Loader from '../shared/components/Loader.jsx'
import LoginModel from '../shared/components/loginModel/LoginModel.jsx'
import {
  selectIsAuthenticated,
  selectIsLoginWindow,
  setLoginWindow,
} from '../store/slices/authSlice.js'
import {
  selectIsMobile,
  selectIsYellowTheme,
} from '../store/slices/commonSlice.js'
import './layout.scss'

export default function InPlayLayout() {
  const { pathname } = useLocation()
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isMobile = useSelector(selectIsMobile)
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const isLoginWindow = useSelector(selectIsLoginWindow)

  const isPlatformPage = useMemo(
    () => pathname.includes('platform'),
    [pathname]
  )
  const showNewsLine = isAuthenticated && !isPlatformPage && !isYellowTheme
  const showMobileNavigation = isMobile && !isPlatformPage

  return (
    <div className="app-layout">
      <div className="header-wrapper">
        <Header />
      </div>

      <div className="main-wrapper">
        <div className="middle-content ms-0 ps-0">
          {showNewsLine && <NewsLine />}
          <div className="scroll-wrap">
            <Suspense fallback={<Loader show variant="wrapper" />}>
              <Outlet />
            </Suspense>
          </div>

          {showMobileNavigation && <MobileNavigation />}
        </div>

        {!isMobile && (
          <div className="right-content">
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
