import { Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Header from '../components/Header.jsx'
import NewsLine from '../components/NewsLine.jsx'
import Loader from '../shared/components/Loader.jsx'
import {
  selectIsMcvYellowTheme,
  selectIsYellowTheme,
} from '../store/slices/commonSlice.js'
import { selectIsAuthenticated } from '../store/slices/authSlice.js'
import {
  fetchUplineContacts,
  selectUplineContacts,
} from '../store/slices/accountSlice.js'
import SvgIcon from '../components/SvgIcon.jsx'

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
  'relative mx-auto bg-(--xs-gray) w-[calc(100%-40px)] mt-[105px] min-[768px]:max-[1440px]:w-[calc(100%-25px)] max-md:mt-[14.67vw] max-md:w-full'
const MAIN_WRAPPER_NO_HEADER =
  'relative mx-auto bg-(--xs-gray) w-[calc(100%-40px)] mt-[31px] max-md:mt-0 max-md:w-full'

const sidebarLiBase =
  'list-none py-[5.5px] pl-2.5 pr-1.5 text-[12px] text-(--xl-gray) cursor-pointer border-b border-[rgba(var(--white-rgb),0.1)] bg-(--xl-black)'
const sidebarLiFirst =
  'list-none py-[5.5px] pl-2.5 pr-1.5 text-[12px] cursor-pointer text-white border-b-0 text-right relative bg-(--primary)'

export default function MyAccountLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const isMcwCasinoTheme = useSelector(selectIsMcvYellowTheme)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const uplineContacts = useSelector(selectUplineContacts)

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchUplineContacts())
  }, [isAuthenticated, dispatch])


  const handleSelect = (path) => {
    if (location.pathname !== path) navigate(path)
  }

  const mainWrapperClass = isAuthenticated
    ? MAIN_WRAPPER_AUTH
    : MAIN_WRAPPER_NO_HEADER

  // Sidebar item active background varies by theme.
  const activeBg = isYellowTheme
    ? 'bg-gradient-to-b from-[#546d7d] to-(--text-color) text-white'
    : isMcwCasinoTheme
      ? 'bg-[#e5ca3a] text-[#222222]'
      : 'bg-[#15805e99]! text-white'
  const sidebarBg = isYellowTheme
    ? 'bg-transparent'
    : isMcwCasinoTheme
      ? 'bg-transparent'
      : 'bg-(--xl-black)'

  return (
    <>
      <Header isAuthenticated />
      <div className={mainWrapperClass}>
        <div className="mx-auto w-[1350px] bg-(--xs-gray)">
          <NewsLine />
          <div className="relative h-full w-full">
              <div className="absolute top-0 left-0 w-[17.36%]">
                <ul
                  className={`mb-0 pl-0 ${sidebarBg} max-h-[calc(100svh-106px)] [scrollbar-width:none] overflow-y-auto`}
                >
                  <li className={sidebarLiFirst}>
                    {t('header.myAccount', 'My Account')}
                  </li>
                  <li
                    className={`${sidebarLiBase} flex flex-row items-center gap-1.5 [&_a]:inline-flex [&_a]:items-center [&_i]:inline-flex [&_svg]:h-4 [&_svg]:w-4`}
                  >
                    <span className="whitespace-nowrap text-white">
                      {t('common.uplineContact', 'Upline Contact')} :
                    </span>
                    <div className="ml-2 flex gap-1.5 overflow-x-auto">
                      {uplineContacts
                        ?.filter((c) => c?.link)
                        ?.map((contact) => (
                          <a
                            key={contact?.label}
                            href={contact?.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={contact?.link}
                          >
                            <SvgIcon name={contact?.label} />
                          </a>
                        ))}
                    </div>
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
            <div className="ml-[17.36%] h-full max-h-[calc(100svh-130px)] w-[calc(100%-17.36%)] overflow-y-auto pl-[15px]">
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
