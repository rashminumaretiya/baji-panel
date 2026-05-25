import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Overlay, Popover } from '../shared/components/primitives/Popover.jsx'
import { selectUplineContacts } from '../store/slices/accountSlice.js'
import { DropdownIcon, UserIcon, iconMap } from './icons.jsx'

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
  const uplineContacts = useSelector(selectUplineContacts)

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
        className={`flex h-[26px] cursor-pointer items-center justify-center rounded-[3px] border border-black/40 bg-black/30 px-1.5 text-[12px] font-normal whitespace-nowrap text-(--header-balance-color) shadow-[inset_0_1px_0_0_rgba(var(--dark-alpha),0.5)] sm:ms-2 lg:ms-4 [&_.dropdown-icon_svg]:w-[9px] [&_.user-icon_svg]:h-[18px] [&_.user-icon_svg]:w-[18px] ${
          isMobile ? 'max-md:h-[9.6vw] max-md:w-[9.6vw]' : ''
        }`}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleToggle(e)}
      >
       <UserIcon className="user-icon" />
        {!isMobile && (
          <>
            <span className="mx-1 inline-block">
              {t('common.myAccount', 'My Account')}
            </span>
           <DropdownIcon className="dropdown-icon" />
          </>
        )}
      </div>
      <Overlay
        show={show}
        target={target}
        placement={placement}
        flip
        rootClose
        onHide={() => setShow(false)}
      >
        <Popover className="w-[230px] border-0">
          <Popover.Body className="font-[Tahoma,Helvetica,sans-serif] text-[12px] text-(--popover)">
            <div className="flex justify-between border-b border-(--sm-text-color) pl-2.5 text-[12px] font-bold">
              <p className="mb-0 flex-1 border-r border-[#c5d0d7] pr-1.5 leading-[26px] font-semibold">
                {userName}
              </p>
              <p className="mb-0 px-1 py-[5px] text-[11px]">GMT +5:30</p>
            </div>
            <ul className="m-0 p-0">
              <li className="flex flex-row items-center border-b border-(--light-bg) px-2.5 leading-[25px] text-[#1e1e1e]">
                <span className="whitespace-nowrap">
                  {t('common.uplineContact', 'Upline Contact')}:
                </span>
                <div className="ml-2 flex gap-1.5 overflow-x-auto [&_a]:inline-flex [&_a]:items-center [&_i]:inline-flex [&_svg]:h-4 [&_svg]:w-4">
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
                <li
                  key={item.path}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer border-b border-(--light-bg) px-2.5 leading-[25px] text-[#1e1e1e] last:border-b-0 hover:bg-(--xxs-gray)"
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
