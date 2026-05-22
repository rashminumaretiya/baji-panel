import { useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import BetSlip from '../components/BetSlip.jsx'
import Header from '../components/Header.jsx'
import MobileNavigation from '../components/MobileNavigation.jsx'
import NewsLine from '../components/NewsLine.jsx'
import OpenBets from '../components/OpenBets.jsx'
import { selectIsAuthenticated } from '../store/slices/authSlice.js'
import {
  selectIsMobile,
  selectIsYellowTheme,
} from '../store/slices/commonSlice.js'
import './layout.scss'

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
    <div className="app-layout">
      <div className="header-wrapper">
        <Header />
      </div>

      <div className="main-wrapper">
        <div className="middle-content ms-0 ps-0">
          {showNewsLine && <NewsLine />}
          <div className="scroll-wrap">
            <Outlet />
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
    </div>
  )
}
