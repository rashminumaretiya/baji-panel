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
import SvgIcon from '../components/SvgIcon.jsx'

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

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6Z" />
    </svg>
  )
}

function RightArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

const menuItemClass =
  'flex items-center justify-between px-[3.76vw] py-[2.13vw] bg-white border-b border-[var(--platinum-grey)] text-[var(--cyanBlue)] text-[4vw] leading-[1.6] font-bold cursor-pointer'

const rightArrowBtnClass =
  'flex items-center justify-center w-[6.4vw] h-[6.4vw] rounded-[1.06vw] border border-[var(--platinum-grey)] text-[var(--dark-gray)]'

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
      <div className="flex items-center justify-between bg-[var(--xl-black)] pl-[1.86vw] pr-0 border-t border-white">
        <div className="inline-flex items-center text-white">
          <i className="inline-flex items-center text-white">
            <UserIcon />
          </i>
          <span className="inline-block ml-1 text-white text-[3.46vw] leading-[10.66vw] font-bold">
            {userName}
          </span>
        </div>
        <span className="px-[1.86vw] min-w-[21.33vw] ml-[1.86vw] border-l border-[var(--sm-black)] text-white text-[3.46vw] leading-[10.66vw] font-bold">
          GMT +05:30
        </span>
      </div>

      <ul className="m-0 pl-0 mb-5 border-b border-[var(--sm-gray-blue)]">
        <li
          className={`${menuItemClass} flex flex-row items-center [&_a]:inline-flex [&_a]:items-center [&_i]:inline-flex [&_svg]:w-[5.33vw] [&_svg]:h-[5.33vw]`}
        >
          <span className="whitespace-nowrap">
            {t('common.uplineContact', 'Upline Contact')} :
          </span>
          <div className="flex ml-2 overflow-x-auto gap-[2.13vw]">
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
        {MENU_ITEMS.map((item) => (
          <li key={item.id} className="list-none">
            <a
              href={item.to}
              target="_blank"
              rel="noopener noreferrer"
              className={`${menuItemClass} no-underline text-[var(--cyanBlue)]`}
            >
              <span>{t(item.i18nKey, item.fallback)}</span>
              <i className={rightArrowBtnClass}>
                <RightArrowIcon />
              </i>
            </a>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center justify-center h-[12.8vw] mb-[5.33vw] bg-gradient-to-b from-[#e93522] to-[#be2414] text-white border-y border-[#8a0011] font-bold text-[4.26vw] leading-[1.3]"
      >
        {t('common.logout', 'Logout')}
        <i className="inline-flex items-center ml-1.5 text-white">
          <LogoutIcon />
        </i>
      </button>
    </div>
  )
}
