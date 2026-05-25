import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { selectIsAuthenticated } from '../store/slices/authSlice.js'

// Translation keys per menu entry — labels resolved inside the component so we
// can localise without recreating the array on every render.
const MOBILE_MENUS = [
  {
    key: 'inplay',
    i18nKey: 'common.inPlay',
    fallback: 'In-Play',
    to: '/in-play',
    icon: '/img/svg/clock-1.svg',
  },
  {
    key: 'sports',
    i18nKey: 'common.sports',
    fallback: 'Sports',
    to: '/soccer',
    icon: '/img/svg/trophy-cup.svg',
  },
  {
    key: 'multiMarket',
    i18nKey: 'common.multiMarket',
    fallback: 'Multi Markets',
    to: '/multi-markets',
    icon: '/img/svg/pin.svg',
  },
]

const itemBase =
  'cursor-pointer text-center text-white block w-[16.15vw] relative h-[13.33vw] pt-[1.87vw] pr-[2.67vw] pl-[2.67vw] [&_a]:text-white [&_a]:no-underline [&_img]:w-auto [&_img]:mx-auto [&_img]:mb-[0.03vw] [&_img]:h-[5.33vw] [&_span]:block [&_span]:whitespace-nowrap [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:w-full [&_span]:text-[3.2vw] [&_span]:leading-[1.5]'

const promoteItem =
  "cursor-pointer text-center text-white block w-[16.15vw] relative h-[13.33vw] pt-[1.87vw] before:content-[''] before:absolute before:-top-[4.27vw] before:left-[1vw] before:w-full before:h-[4.53vw] before:bg-[url(/img/svg/home-shape.svg)] before:bg-no-repeat before:bg-[size:100%_100%] before:pointer-events-none before:-z-[1] [&_img.icon-promote]:w-[15.53vw] [&_img.icon-promote]:h-auto [&_img.icon-promote]:-mt-[4.53vw] [&_img.icon-promote]:mb-[1vw] [&_img.icon-promote]:ml-[1vw]"

const activeBg =
  'bg-gradient-to-t from-[var(--xl-blue-bg)] to-[var(--xsm-blue-bg)]'

export default function MobileNavigation() {
  const { t } = useTranslation()
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
    navigate('/account')
  }

  const isHome = pathname === '/'
  const isAccount =
    pathname === '/account' || pathname.startsWith('/my-account')

  return (
    <div
      className="fixed z-[99] -bottom-px left-0 right-0 pt-[4vw]"
      id="mobile-navigation"
    >
      <ul className="m-0 flex justify-between p-0 bg-gradient-to-t from-[var(--xsm-blue)] to-[var(--xxl-blue)]">
        <li className={promoteItem} onClick={showCasino} role="presentation">
          <img
            src="/img/svg/game-card.svg"
            className="icon-promote"
            alt="Casino"
          />
        </li>
        <li
          className={`${itemBase} ${isHome ? `${activeBg} before:bg-[url(/img/svg/home-shape-active.svg)]` : ''}`}
          onClick={redirectToMainSite}
          role="presentation"
        >
          <img src="/img/svg/home.svg" alt={t('common.home', 'Home')} />
          <span>{t('common.home', 'Home')}</span>
        </li>
        {MOBILE_MENUS.map((menu) => {
          const label = t(menu.i18nKey, menu.fallback)
          return (
            <li key={menu.key} className={itemBase}>
              <NavLink
                to={menu.to}
                end
                className={({ isActive }) =>
                  isActive
                    ? `block w-full h-full ${activeBg} -mx-[2.67vw] -mt-[1.87vw] pt-[1.87vw] px-[2.67vw]`
                    : 'block w-full h-full'
                }
              >
                <img src={menu.icon} alt={label} />
                <span>{label}</span>
              </NavLink>
            </li>
          )
        })}
        <li
          className={`${itemBase} ${isAccount ? activeBg : ''}`}
          onClick={goToAccount}
          role="presentation"
        >
          <img
            src="/img/svg/user-profile.svg"
            alt={t('common.account', 'Account')}
          />
          <span>{t('common.account', 'Account')}</span>
        </li>
      </ul>
    </div>
  )
}
