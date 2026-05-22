import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Overlay, Popover } from '../shared/components/primitives/Popover.jsx'
import SvgIcon from './SvgIcon.jsx'

const SITE_LOGO =
  'https://backend-1ten365.s3.ap-south-2.amazonaws.com/admins/6800f38aa57265d98c2a5110/logo/Baji36%202%20copy-1745137890392.png'

const MENU_ITEMS = [
  { label: 'My Profile', path: '/my-account/my-profile' },
  { label: 'Account Statement', path: '/my-account/account-statement' },
  { label: 'Bets History', path: '/my-account/bets-complaints' },
  { label: 'Deposit', path: '/my-account/deposit' },
  { label: 'Withdraw', path: '/my-account/withdraw' },
  { label: 'Balance Overview', path: '/my-account/balance-overview' },
  { label: 'My Bets', path: '/my-account/my-bets' },
  { label: 'Activity Log', path: '/my-account/activity-log' },
  { label: 'Deposit History', path: '/my-account/deposit-history' },
  { label: 'Withdraw History', path: '/my-account/withdraw-history' },
]

export default function MyAccountPopup({
  isMobile = false,
  userName = 'User',
}) {
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
        className="flex items-center justify-center cursor-pointer ms-lg-3 sm:ms-2 text-[var(--header-balance-color)] h-[26px] px-1.5 bg-black/30 border border-black/40 shadow-[inset_0_1px_0_0_rgba(var(--dark-alpha),0.5)] font-normal text-[12px] rounded-[3px] whitespace-nowrap max-mobile:h-[9.6vw] max-mobile:w-[9.6vw] [&_.user-icon_svg]:h-[18px] [&_.user-icon_svg]:w-[18px] [&_.dropdown-icon_svg]:w-[9px] [&_.dropdown-icon_svg]:ml-2"
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleToggle(e)}
      >
        <SvgIcon name="userIcon" className="user-icon" />
        <span className="inline-block mx-1 max-mobile:hidden">My Account</span>
        {!isMobile && <SvgIcon name="dropdown" className="dropdown-icon" />}
      </div>
      <Overlay
        show={show}
        target={target}
        placement="bottom"
        rootClose
        onHide={() => setShow(false)}
      >
        <Popover className="border-0 w-[230px]">
          <Popover.Body className="p-0 text-[12px] font-[Tahoma,Helvetica,sans-serif] text-[var(--popover)]">
            <div className="flex justify-between font-bold text-[12px] border-b border-[var(--sm-text-color)] pl-2.5">
              <p className="mb-0 leading-[26px] font-semibold flex-1 pr-1.5 border-r border-[#c5d0d7]">
                {userName}
              </p>
              <p className="mb-0 text-[11px] px-1 py-[5px]">GMT +5:30</p>
            </div>
            <ul className="m-0 p-0">
              <li className="flex flex-row items-center px-2.5 leading-[25px] border-b border-[var(--light-bg)] text-[#1e1e1e]">
                <span className="whitespace-nowrap">Upline Contact:</span>
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
                  {item.label}
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
