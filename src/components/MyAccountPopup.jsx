import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Overlay, Popover } from '../shared/components/primitives/Popover.jsx'
import SvgIcon from './SvgIcon.jsx'

const SITE_LOGO =
  'https://backend-1ten365.s3.ap-south-2.amazonaws.com/admins/6800f38aa57265d98c2a5110/logo/Baji36%202%20copy-1745137890392.png'

// Translation keys per menu entry — labels are resolved at render time so we
// can keep the array module-level + still localise the labels.
const MENU_ITEMS = [
  {
    i18nKey: 'common.myProfile',
    fallback: 'My Profile',
    path: '/my-account/my-profile',
  },
  {
    i18nKey: 'common.accountStatement',
    fallback: 'Account Statement',
    path: '/my-account/account-statement',
  },
  {
    i18nKey: 'common.betsHistory',
    fallback: 'Bets History',
    path: '/my-account/bets-complaints',
  },
  {
    i18nKey: 'common.deposit',
    fallback: 'Deposit',
    path: '/my-account/deposit',
  },
  {
    i18nKey: 'common.withdraw',
    fallback: 'Withdraw',
    path: '/my-account/withdraw',
  },
  {
    i18nKey: 'common.balanceOverview',
    fallback: 'Balance Overview',
    path: '/my-account/balance-overview',
  },
  {
    i18nKey: 'common.myBets',
    fallback: 'My Bets',
    path: '/my-account/my-bets',
  },
  {
    i18nKey: 'common.activityLog',
    fallback: 'Activity Log',
    path: '/my-account/activity-log',
  },
  {
    i18nKey: 'common.depositHistory',
    fallback: 'Deposit History',
    path: '/my-account/deposit-history',
  },
  {
    i18nKey: 'common.withdrawHistory',
    fallback: 'Withdraw History',
    path: '/my-account/withdraw-history',
  },
]

export default function MyAccountPopup({
  isMobile = false,
  userName = 'User',
  placement = 'bottom-end',
}) {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)
  const [target, setTarget] = useState(null)
  const navigate = useNavigate()

  const handleToggle = (e) => {
    setTarget(e.currentTarget)
    setShow((prev) => !prev)
  }

  const handleMenuClick = (path) => {
    setShow(false)
    navigate(path)
  }

  return (
    <>
      <div
        className="flex items-center justify-center cursor-pointer lg:ms-4 sm:ms-2 text-[var(--header-balance-color)] h-[26px] px-1.5 bg-black/30 border border-black/40 shadow-[inset_0_1px_0_0_rgba(var(--dark-alpha),0.5)] font-normal text-[12px] rounded-[3px] whitespace-nowrap max-md:h-[9.6vw] max-md:w-[9.6vw] [&_.user-icon_svg]:h-[18px] [&_.user-icon_svg]:w-[18px] [&_.dropdown-icon_svg]:w-[9px]"
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleToggle(e)}
      >
        <SvgIcon name="userIcon" className="user-icon" />
        <span className="inline-block mx-1 max-md:hidden">
          {t('common.myAccount', 'My Account')}
        </span>
        {!isMobile && <SvgIcon name="dropdown" className="dropdown-icon" />}
      </div>
      <Overlay
        show={show}
        target={target}
        placement={placement}
        flip
        rootClose
        onHide={() => setShow(false)}
      >
        <Popover className="border-0 w-[230px]">
          <Popover.Body className="text-[12px] font-[Tahoma,Helvetica,sans-serif] text-[var(--popover)]">
            <div className="flex justify-between font-bold text-[12px] border-b border-[var(--sm-text-color)] pl-2.5">
              <p className="mb-0 leading-[26px] font-semibold flex-1 pr-1.5 border-r border-[#c5d0d7]">
                {userName}
              </p>
              <p className="mb-0 text-[11px] px-1 py-[5px]">GMT +5:30</p>
            </div>
            <ul className="m-0 p-0">
              <li className="flex flex-row items-center px-2.5 leading-[25px] border-b border-[var(--light-bg)] text-[#1e1e1e]">
                <span className="whitespace-nowrap">
                  {t('common.uplineContact', 'Upline Contact')}:
                </span>
                <div className="flex ml-2 overflow-x-auto" />
              </li>
              {MENU_ITEMS.map((item) => (
                <li
                  key={item.path}
                  role="button"
                  tabIndex={0}
                  className="px-2.5 leading-[25px] border-b last:border-b-0 border-[var(--light-bg)] text-[#1e1e1e] cursor-pointer hover:bg-[var(--xxs-gray)]"
                  onClick={() => handleMenuClick(item.path)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleMenuClick(item.path)
                  }
                >
                  {t(item.i18nKey, item.fallback)}
                </li>
              ))}
            </ul>
          </Popover.Body>
        </Popover>
      </Overlay>
    </>
  )
}

export { SITE_LOGO }
