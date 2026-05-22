import { Suspense } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Header from '../components/Header.jsx'
import NewsLine from '../components/NewsLine.jsx'
import Loader from '../shared/components/Loader.jsx'
import { useIsMobile } from '../hooks/useMediaQuery.js'
import {
  selectIsMcvYellowTheme,
  selectIsYellowTheme,
} from '../store/slices/commonSlice.js'
import './myAccountLayout.scss'
import { selectIsAuthenticated } from '../store/slices/authSlice.js'

function cx(...cs) {
  return cs.filter(Boolean).join(' ')
}

const tabs = [
  { path: '/my-account/my-profile', label: 'My Profile' },
  { path: '/my-account/balance-overview', label: 'Balance Overview' },
  { path: '/my-account/account-statement', label: 'Account Statement' },
  { path: '/my-account/my-bets', label: 'My Bets' },
  { path: '/my-account/bets-complaints', label: 'Bets Complaints' },
  { path: '/my-account/activity-log', label: 'Activity Log' },
  { path: '/my-account/deposit', label: 'Deposit' },
  { path: '/my-account/deposit-history', label: 'Deposit History' },
  { path: '/my-account/withdraw', label: 'Withdraw' },
  { path: '/my-account/withdraw-history', label: 'Withdraw History' },
]

export default function MyAccountLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const isMcwCasinoTheme = useSelector(selectIsMcvYellowTheme)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const activeTab = tabs.find((tab) => tab.path === location.pathname)
  const showSidebar = !isMobile

  const sideLeftClass = cx(
    'side-left',
    isYellowTheme && 'yellow-theme',
    isMcwCasinoTheme && 'mcw-theme'
  )
  const sidebarUlClass = cx(
    'mb-0 ps-0 sidebar',
    isYellowTheme && 'light-sidebar',
    isMcwCasinoTheme && 'mcw-sidebar'
  )

  const handleSelect = (path) => {
    if (location.pathname !== path) navigate(path)
  }

  const goToAccountMobile = () => navigate('/my-account')

  const mainWrapperClass = cx(
    'main-wrapper',
    isAuthenticated && 'auth',
    !isAuthenticated && 'no-header-wrapper'
  )

  return (
    <>
      <Header isAuthenticated />
      <div className={mainWrapperClass}>
        <div className="my-account-wrap">
          <NewsLine />
          <div className="position-relative outlet-wrap">
            {showSidebar && (
              <div className={sideLeftClass}>
                <ul className={sidebarUlClass}>
                  <li>My Account</li>
                  {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path
                    return (
                      <li
                        key={tab.path}
                        tabIndex={0}
                        className={isActive ? 'active' : ''}
                        onClick={() => handleSelect(tab.path)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            handleSelect(tab.path)
                          }
                        }}
                      >
                        {tab.label}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            <div className="content-wrap">
              {isMobile && activeTab && (
                <div className="header-breadcumb">
                  <i
                    className="play"
                    role="button"
                    aria-label="Back to account"
                    onClick={goToAccountMobile}
                  />
                  <ul className="ps-2 d-flex align-items-center mb-0 overflow-x-auto">
                    <li
                      className="text-nowrap cursor-pointer"
                      onClick={goToAccountMobile}
                    >
                      My Account
                    </li>
                    <li className="text-nowrap">{activeTab.label}</li>
                  </ul>
                </div>
              )}
              <Suspense fallback={<Loader show variant="wrapper" />}>
                <Outlet />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
