import { useSelector } from 'react-redux'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { selectIsAuthenticated } from '../store/slices/authSlice.js'
import './mobileNavigation.scss'

const MOBILE_MENUS = [
  {
    key: 'inplay',
    label: 'In-Play',
    to: '/in-play',
    icon: '/img/svg/clock-1.svg',
  },
  {
    key: 'sports',
    label: 'Sports',
    to: '/soccer',
    icon: '/img/svg/trophy-cup.svg',
  },
  {
    key: 'multiMarket',
    label: 'Multi Markets',
    to: '/multi-markets',
    icon: '/img/svg/pin.svg',
  },
]

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function MobileNavigation() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const redirectToMainSite = () => {
    const url = window.location.origin.replace('panel.', '')
    window.open(url, '_blank')
  }

  const showCasino = () => {
    if (!isAuthenticated) return
    navigate('/platform')
  }

  const goToAccount = () => {
    if (!isAuthenticated) return
    navigate('/my-account')
  }

  return (
    <div className="mobile-footer" id="mobile-navigation">
      <ul className="mb-0 mobile-menu-tabs">
        <li className="icon-promote" onClick={showCasino} role="presentation">
          <img
            src="/img/svg/game-card.svg"
            className="icon-promote"
            alt="Casino"
          />
        </li>
        <li
          className={cx('home', pathname === '/' && 'active')}
          onClick={redirectToMainSite}
          role="presentation"
        >
          <img src="/img/svg/home.svg" alt="Home" />
          <span>Home</span>
        </li>
        {MOBILE_MENUS.map((menu) => (
          <li key={menu.key}>
            <NavLink
              to={menu.to}
              end
              className={({ isActive }) => cx(isActive && 'active')}
            >
              <img src={menu.icon} alt={menu.label} />
              <span>{menu.label}</span>
            </NavLink>
          </li>
        ))}
        <li
          className={cx(pathname.startsWith('/my-account') && 'active')}
          onClick={goToAccount}
          role="presentation"
        >
          <img src="/img/svg/user-profile.svg" alt="Account" />
          <span>Account</span>
        </li>
      </ul>
    </div>
  )
}
