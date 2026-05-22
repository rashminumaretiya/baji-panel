import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
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
import { selectIsAuthenticated } from '../store/slices/authSlice.js'

function cx(...cs) {
  return cs.filter(Boolean).join(' ')
}

const tabs = [
  {
    path: '/my-account/my-profile',
    i18nKey: 'common.myProfile',
    fallback: 'My Profile',
  },
  {
    path: '/my-account/balance-overview',
    i18nKey: 'common.balanceOverview',
    fallback: 'Balance Overview',
  },
  {
    path: '/my-account/account-statement',
    i18nKey: 'common.accountStatement',
    fallback: 'Account Statement',
  },
  {
    path: '/my-account/my-bets',
    i18nKey: 'common.myBets',
    fallback: 'My Bets',
  },
  {
    path: '/my-account/bets-complaints',
    i18nKey: 'common.betsComplaints',
    fallback: 'Bets Complaints',
  },
  {
    path: '/my-account/activity-log',
    i18nKey: 'common.activityLog',
    fallback: 'Activity Log',
  },
  {
    path: '/my-account/deposit',
    i18nKey: 'common.deposit',
    fallback: 'Deposit',
  },
  {
    path: '/my-account/deposit-history',
    i18nKey: 'common.depositHistory',
    fallback: 'Deposit History',
  },
  {
    path: '/my-account/withdraw',
    i18nKey: 'common.withdraw',
    fallback: 'Withdraw',
  },
  {
    path: '/my-account/withdraw-history',
    i18nKey: 'common.withdrawHistory',
    fallback: 'Withdraw History',
  },
]

// Ported from layout.scss .main-wrapper auth / no-header-wrapper.
const MAIN_WRAPPER_AUTH =
  'relative mx-auto bg-[var(--xs-gray)] w-[calc(100%-40px)] mt-[105px] min-[768px]:max-[1440px]:w-[calc(100%-25px)] max-md:mt-[14.67vw] max-md:w-full'
const MAIN_WRAPPER_NO_HEADER =
  'relative mx-auto bg-[var(--xs-gray)] w-[calc(100%-40px)] mt-[31px] max-md:mt-0 max-md:w-full'

const sidebarLiBase =
  'list-none py-[5.5px] pl-2.5 pr-1.5 text-[12px] text-[var(--xl-gray)] cursor-pointer border-b border-[rgba(var(--white-rgb),0.1)] bg-[var(--xl-black)]'
const sidebarLiFirst =
  'list-none py-[5.5px] pl-2.5 pr-1.5 text-[12px] cursor-pointer text-white border-b-0 text-right relative bg-[var(--primary)]'

export default function MyAccountLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const isMcwCasinoTheme = useSelector(selectIsMcvYellowTheme)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const activeTab = tabs.find((tab) => tab.path === location.pathname)
  const showSidebar = !isMobile

  const handleSelect = (path) => {
    if (location.pathname !== path) navigate(path)
  }
  const goToAccountMobile = () => navigate('/my-account')

  const mainWrapperClass = isAuthenticated
    ? MAIN_WRAPPER_AUTH
    : MAIN_WRAPPER_NO_HEADER

  // Sidebar item active background varies by theme.
  const activeBg = isYellowTheme
    ? 'bg-gradient-to-b from-[#546d7d] to-[var(--text-color)] text-white'
    : isMcwCasinoTheme
      ? 'bg-[#e5ca3a] text-[#222222]'
      : 'bg-[#15805e99]! text-white'
  const sidebarBg = isYellowTheme
    ? 'bg-transparent'
    : isMcwCasinoTheme
      ? 'bg-transparent'
      : 'bg-[var(--xl-black)]'

  return (
    <>
      <Header isAuthenticated />
      <div className={mainWrapperClass}>
        <div className="max-w-[1349px] w-full mx-auto bg-[var(--xs-gray)] md:w-[calc(100%-40px)]">
          <NewsLine />
          <div className="relative w-full h-full pl-[15px] max-md:pl-0">
            {showSidebar && (
              <div className="absolute top-0 left-0 w-[17.36%]">
                <ul
                  className={`mb-0 pl-0 ${sidebarBg} overflow-y-auto max-h-[calc(100svh-106px)] [scrollbar-width:none]`}
                >
                  <li className={sidebarLiFirst}>
                    {t('header.myAccount', 'My Account')}
                  </li>
                  {tabs.map((tab, idx) => {
                    const isActive = location.pathname === tab.path
                    const isLast = idx === tabs.length - 1
                    return (
                      <li
                        key={tab.path}
                        tabIndex={0}
                        className={cx(
                          sidebarLiBase,
                          isActive && activeBg,
                          !isActive && 'hover:bg-[rgba(var(--white-rgb),0.1)]',
                          isLast && 'border-b-[#7e97a7]'
                        )}
                        onClick={() => handleSelect(tab.path)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            handleSelect(tab.path)
                          }
                        }}
                      >
                        {t(tab.i18nKey, tab.fallback)}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            <div className="ml-[17.36%] h-full w-[calc(100%-17.36%)] overflow-y-auto max-h-[calc(100svh-106px)] max-md:ml-0 max-md:w-auto max-md:max-h-none">
              {isMobile && activeTab && (
                <div className="flex items-center bg-gradient-to-t from-[#141e21] to-[#2f424d] border-t border-white">
                  <i
                    className="w-[10.67vw] h-[10.67vw] border-r border-[#4b4b4b] text-white bg-[url(/img/svg/play-icon.svg)] bg-no-repeat bg-center bg-contain shrink-0"
                    role="button"
                    aria-label="Back to account"
                    onClick={goToAccountMobile}
                  />
                  <ul className="pl-2 flex items-center mb-0 overflow-x-auto leading-[10.4vw]">
                    <li
                      className="whitespace-nowrap cursor-pointer text-white relative mr-[1.87vw] pr-[3.47vw] text-[3.47vw] after:absolute after:top-1/2 after:right-0 after:content-[''] after:w-[1.6vw] after:h-[2.67vw] after:bg-[url(/img/svg/next-arrow.svg)] after:bg-no-repeat after:bg-contain after:-mt-[1.33vw]"
                      onClick={goToAccountMobile}
                    >
                      {t('header.myAccount', 'My Account')}
                    </li>
                    <li className="whitespace-nowrap text-white text-[3.47vw]">
                      {t(activeTab.i18nKey, activeTab.fallback)}
                    </li>
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
