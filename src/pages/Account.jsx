import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  logout,
  selectIsAuthenticated,
  selectUser,
} from '../store/slices/authSlice.js'
import { selectIsMobile } from '../store/slices/commonSlice.js'
import { selectUplineContacts } from '../store/slices/accountSlice.js'
import {
  ChevronRightArrowIcon,
  LogInIcon,
  UserIcon2,
  iconMap,
} from '../components/icons.jsx'

// Ported from sbex-user-fe/src/app/features/components/my-account-mobile.
// Mobile-only menu page mounted at /account.
const MENU_ITEMS = [
  {
    id: 'my-profile',
    i18nKey: 'common.myProfile',
    fallback: 'My Profile',
    to: '/my-account/my-profile',
  },
  {
    id: 'balance-overview',
    i18nKey: 'common.balanceOverview',
    fallback: 'Balance Overview',
    to: '/my-account/balance-overview',
  },
  {
    id: 'account-statement',
    i18nKey: 'common.accountStatement',
    fallback: 'Account Statement',
    to: '/my-account/account-statement',
  },
  {
    id: 'my-bets',
    i18nKey: 'common.myBets',
    fallback: 'My Bets',
    to: '/my-account/my-bets',
  },
  {
    id: 'bet-history',
    i18nKey: 'common.betsHistory',
    fallback: 'Bets History',
    to: '/my-account/my-bets?tab=bet-history',
  },
  {
    id: 'pnl',
    i18nKey: 'common.profitLoss',
    fallback: 'Profit & Loss',
    to: '/my-account/my-bets?tab=pnl',
  },
  {
    id: 'activity-log',
    i18nKey: 'common.activityLog',
    fallback: 'Activity Log',
    to: '/my-account/activity-log',
  },
  {
    id: 'deposit',
    i18nKey: 'common.deposit',
    fallback: 'Deposit',
    to: '/my-account/deposit',
  },
  {
    id: 'deposit-history',
    i18nKey: 'common.depositHistory',
    fallback: 'Deposit History',
    to: '/my-account/deposit-history',
  },
  {
    id: 'withdraw',
    i18nKey: 'common.withdraw',
    fallback: 'Withdraw',
    to: '/my-account/withdraw',
  },
  {
    id: 'withdraw-history',
    i18nKey: 'common.withdrawHistory',
    fallback: 'Withdraw History',
    to: '/my-account/withdraw-history',
  },
]

const menuItemClass =
  'flex items-center justify-between px-[3.76vw] py-[2.13vw] bg-white border-b border-(--platinum-grey) text-(--cyanBlue) text-[4vw] leading-[1.6] font-bold cursor-pointer'

const rightArrowBtnClass =
  'flex items-center justify-center w-[6.4vw] h-[6.4vw] rounded-[1.06vw] border border-(--platinum-grey) text-(--dark-gray)'

export default function Account() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const isMobile = useSelector(selectIsMobile)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectUser)
  const uplineContacts = useSelector(selectUplineContacts)

  // Mirrors Angular's authGuard: /account is mobile-only — desktop hits the
  // standard /my-account route instead.
  useEffect(() => {
    if (!isMobile) navigate('/my-account/my-profile', { replace: true })
  }, [isMobile, navigate])

  if (!isAuthenticated) return <Navigate to="/" replace />

  const userName =
    user?.profileDetails?.userName ?? user?.userName ?? user?.fullName ?? ''

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/', { replace: true })
  }

  return (
    <div>
      <div className="flex items-center justify-between border-t border-white bg-(--xl-black) pr-0 pl-[1.86vw]">
        <div className="inline-flex items-center text-white">
          <i className="inline-flex items-center text-white">
            <UserIcon2 />
          </i>
          <span className="ml-1 inline-block text-[3.46vw] leading-[10.66vw] font-bold text-white">
            {userName}
          </span>
        </div>
        <span className="ml-[1.86vw] min-w-[21.33vw] border-l border-(--sm-black) px-[1.86vw] text-[3.46vw] leading-[10.66vw] font-bold text-white">
          GMT +05:30
        </span>
      </div>

      <ul className="m-0 mb-5 border-b border-(--sm-gray-blue) pl-0">
        <li
          className={`${menuItemClass} flex flex-row items-center [&_a]:inline-flex [&_a]:items-center [&_i]:inline-flex [&_svg]:h-[5.33vw] [&_svg]:w-[5.33vw]`}
        >
          <span className="whitespace-nowrap">
            {t('common.uplineContact', 'Upline Contact')} :
          </span>
          <div className="ml-2 flex gap-[2.13vw] overflow-x-auto">
            {uplineContacts
              ?.filter((c) => c?.link)
              ?.map((contact) => {
                const ContactIcon = iconMap[contact?.label]
                return (
                  <a
                    key={contact?.label}
                    href={contact?.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={contact?.link}
                  >
                    {ContactIcon && <ContactIcon />}
                  </a>
                )
              })}
          </div>
        </li>
        {MENU_ITEMS.map((item) => (
          <li key={item.id} className="list-none">
            <a
              href={item.to}
              target="_blank"
              rel="noopener noreferrer"
              className={`${menuItemClass} text-(--cyanBlue) no-underline`}
            >
              <span>{t(item.i18nKey, item.fallback)}</span>
              <i className={rightArrowBtnClass}>
              <ChevronRightArrowIcon />
              </i>
            </a>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handleLogout}
        className="mb-[5.33vw] flex h-[12.8vw] w-full items-center justify-center border-y border-[#8a0011] bg-gradient-to-b from-[#e93522] to-[#be2414] text-[4.26vw] leading-[1.3] font-bold text-white"
      >
        {t('common.logout', 'Logout')}
        <i className="ml-1.5 inline-flex items-center text-white">
          <LogInIcon />
        </i>
      </button>
    </div>
  )
}
