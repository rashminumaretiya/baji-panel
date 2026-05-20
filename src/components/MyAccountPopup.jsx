/* eslint-disable react/prop-types */
import { useState } from 'react'
import { Overlay, Popover } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import SvgIcon from './SvgIcon.jsx'
import './myAccountPopup.scss'

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

  const popoverContent = (
    <div className="my-account-popover">
      <div className="title d-flex justify-content-between">
        <p className="mb-0">{userName}</p>
        <p className="timezone mb-0">GMT +5:30</p>
      </div>
      <ul className="list-unstyled mb-0">
        <li className="d-flex flex-row align-items-center social-icons">
          <span className="w-nowrap">Upline Contact:</span>
          <div className="d-flex ms-2 overflow-x-auto" />
        </li>
        {MENU_ITEMS.map((item) => (
          <li
            key={item.path}
            role="button"
            tabIndex={0}
            onClick={() => handleMenuClick(item.path)}
            onKeyDown={(e) => e.key === 'Enter' && handleMenuClick(item.path)}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <>
      <div
        className="my-account cursor-pointer d-flex justify-content-center align-items-center"
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleToggle(e)}
      >
        <SvgIcon name="userIcon" className="user-icon" />
        <span className="d-inline-block mx-1">My Account</span>
        {!isMobile && <SvgIcon name="dropdown" className="dropdown-icon" />}
      </div>
      <Overlay
        show={show}
        target={target}
        placement="bottom"
        rootClose
        onHide={() => setShow(false)}
      >
        <Popover
          id="my-account-popover"
          className="my-account-popup"
          arrowProps={{ style: { display: 'none' } }}
        >
          <Popover.Body>{popoverContent}</Popover.Body>
        </Popover>
      </Overlay>
    </>
  )
}

export { SITE_LOGO }
