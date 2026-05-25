import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useNavigate } from 'react-router-dom'
import { selectUser } from '../../store/slices/authSlice.js'
import { ensureCasinoDataLoaded } from '../../store/slices/casinoSlice.js'
import SvgIcon from '../../components/SvgIcon.jsx'

const FOOTER_TABS = [
  {
    key: 'recent',
    icon: 'recentIcon',
    i18nKey: 'platform.footer.recent',
    isDisabled: true,
  },
  {
    key: 'favorite',
    icon: 'favouriteIcon',
    i18nKey: 'platform.footer.favorite',
    isDisabled: true,
  },
  {
    key: 'rankings',
    icon: 'rankingIcon',
    i18nKey: 'platform.footer.rankings',
    isDisabled: true,
  },
  {
    key: 'games',
    icon: 'gamesIcon',
    i18nKey: 'platform.footer.games',
    isDisabled: true,
  },
  { key: 'platform', icon: 'platformIcon', i18nKey: 'platform.footer.platform' },
]

// Treat Enter/Space on a role="button" element as a click activation so
// keyboard users get the same behaviour as mouse users.
function activateOnKey(handler) {
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handler(e)
    }
  }
}

export default function PlatformWrapper() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const [selectedTab, setSelectedTab] = useState('platform')

  useEffect(() => {
    dispatch(ensureCasinoDataLoaded())
  }, [dispatch])

  return (
    <div className="fixed inset-0 z-[9999] bg-[radial-gradient(circle,#262626_0%,#0a0a0a_100%)] overflow-y-auto transition-all duration-100 ease-in-out">
      <div className="fixed top-0 left-0 right-0 z-[99] bg-white bg-[url(/img/platform/bg-header.jpg)] w-full">
        <div className="flex items-center max-w-[1280px] w-full mx-auto py-1 max-md:py-1">
          <img
            src="/img/platform/logo-AWC.webp"
            alt="logo-AWC"
            className="h-auto max-w-[88px] max-h-[40px] cursor-pointer max-md:w-[20%] max-md:ml-2"
            tabIndex={0}
            role="button"
            onClick={() => navigate('/')}
            onKeyDown={activateOnKey(() => navigate('/'))}
          />
          <div className="flex items-center justify-between max-w-[42rem] w-full bg-white p-2 rounded-md mx-1 max-md:flex-1">
            <div className="flex flex-col md:flex-row w-full">
              <p className="text-xs text-[var(--coffie)] mb-[3px] flex-1 md:mb-0 max-md:mb-1">
                <img
                  src="/img/platform/user.webp"
                  alt="user"
                  className="h-[14px] w-[14px] mr-1 inline-block align-middle"
                />
                <span className="align-middle">
                  {user?.profileDetails?.userName ?? ''}
                </span>
              </p>
              <p className="text-xs text-[var(--coffie)] mb-0 flex-1 max-md:mb-1">
                <img
                  src="/img/platform/coins.webp"
                  alt="coins"
                  className="h-[14px] w-[14px] mr-1 inline-block align-middle"
                />
                <span className="align-middle">************</span>
              </p>
            </div>
            <img
              className="h-[32px] w-auto"
              src="/img/platform/balance-hide.webp"
              alt="balance-hide"
            />
          </div>
          <img
            src="/img/platform/menu.webp"
            alt="menu"
            className="h-[40px] w-auto md:ml-auto"
          />
        </div>
      </div>

      <div className="mt-[65px] mb-[66px] text-[#fadda6] bg-[radial-gradient(circle,#262626,#0a0a0a)]">
        <Outlet />
      </div>

      <div
        id="mobile-navigation"
        className="fixed bottom-0 left-0 right-0 z-[99] bg-white"
      >
        <ul className="flex items-center mb-0 pl-0">
          {FOOTER_TABS.map((tab) => {
            const isActive = selectedTab === tab.key
            return (
              <li
                key={tab.key}
                className="flex-1 text-center"
                onClick={() => !tab.isDisabled && setSelectedTab(tab.key)}
                role="presentation"
              >
                <SvgIcon
                  name={tab.icon}
                  className={
                    isActive
                      ? 'flex items-center justify-center mx-auto rounded-full text-white! border-4 border-white bg-[linear-gradient(to_bottom,var(--coffie-xs),var(--coffie-md),var(--coffie-lg))] h-[52px] w-[52px] -translate-y-[11px] [&_svg]:h-8 [&_svg]:w-8'
                      : 'flex items-center justify-center mx-auto rounded-full text-[var(--gray-text-2)]! h-[44px] w-[44px] [&_svg]:h-8 [&_svg]:w-8'
                  }
                />
                <span
                  className={
                    isActive
                      ? 'block text-xs text-[var(--coffie)] -translate-y-1'
                      : 'block text-xs text-[var(--gray-text-2)]'
                  }
                >
                  {t(tab.i18nKey, tab.key)}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
