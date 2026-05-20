/* eslint-disable react/prop-types */
import { useState } from 'react'
import { Overlay, Popover } from 'react-bootstrap'
import SvgIcon from './SvgIcon.jsx'

const SITE_LOGO =
  'https://backend-1ten365.s3.ap-south-2.amazonaws.com/admins/6800f38aa57265d98c2a5110/logo/Baji36%202%20copy-1745137890392.png'

const MENU_ITEMS = [
  { label: 'My Profile', path: '/my-account/profile' },
  { label: 'Account Statement', path: '/my-account/statement' },
  { label: 'Bet History', path: '/my-account/bets' },
  { label: 'Profit & Loss', path: '/my-account/pnl' },
]

export default function MyAccountPopup({ isMobile = false, userName = 'User' }) {
  const [show, setShow] = useState(false)
  const [target, setTarget] = useState(null)

  const handleToggle = (e) => {
    setTarget(e.currentTarget)
    setShow((prev) => !prev)
  }

  const popoverContent = (
    <div className="my-account-popover">
      <div className="title d-flex justify-content-between">
        <p className="mb-0">{userName}</p>
        <p className="timezone mb-0">GMT +5:30</p>
      </div>
      <ul className="list-unstyled mb-0">
        <li className="d-flex flex-row align-items-center social-icons py-2">
          <span className="w-nowrap">Upline Contact:</span>
          <div className="d-flex ms-2 overflow-x-auto" />
        </li>
        {MENU_ITEMS.map((item) => (
          <li key={item.path} className="py-1 cursor-pointer">
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
        <p className="mb-0 d-flex align-items-center">
          <SvgIcon name="userIcon" className="user-icon" />
          <span className="d-inline-block mx-1">My Account</span>
          {!isMobile && <SvgIcon name="dropdown" className="dropdown-icon" />}
        </p>
      </div>
      <Overlay
        show={show}
        target={target}
        placement="bottom"
        rootClose
        onHide={() => setShow(false)}
      >
        <Popover id="my-account-popover" className="my-account-popup">
          <Popover.Body>{popoverContent}</Popover.Body>
        </Popover>
      </Overlay>
    </>
  )
}

export { SITE_LOGO }
