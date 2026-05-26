import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useNavigate } from 'react-router-dom'
import { selectUser } from '../../store/slices/authSlice.js'
import { ensureCasinoDataLoaded } from '../../store/slices/casinoSlice.js'
import { iconMap } from '../../components/icons.jsx'

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
  {
    key: 'platform',
    icon: 'platformIcon',
    i18nKey: 'platform.footer.platform',
  },
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
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[radial-gradient(circle,#262626_0%,#0a0a0a_100%)] transition-all duration-100 ease-in-out">
      <div className="fixed top-0 right-0 left-0 z-[99] w-full bg-white bg-[url(/img/platform/bg-header.webp)]">
        <div className="mx-auto flex w-full max-w-[1280px] items-center py-1 max-md:py-1">
          <img
            loading="lazy"
            decoding="async"
            src="/img/platform/logo-AWC.webp"
            alt="logo-AWC"
            className="h-auto max-h-[40px] max-w-[88px] cursor-pointer max-md:ml-2 max-md:w-[20%]"
            tabIndex={0}
            role="button"
            onClick={() => navigate('/')}
            onKeyDown={activateOnKey(() => navigate('/'))}
          />
          <div className="mx-1 flex w-full max-w-[42rem] items-center justify-between rounded-md bg-white p-2 max-md:flex-1">
            <div className="flex w-full flex-col md:flex-row">
              <p className="mb-[3px] flex-1 text-xs text-[var(--coffie)] max-md:mb-1 md:mb-0">
                <img
                  loading="lazy"
                  decoding="async"
                  src="/img/platform/user.webp"
                  alt="user"
                  className="mr-1 inline-block h-[14px] w-[14px] align-middle"
                />
                <span className="align-middle">
                  {user?.profileDetails?.userName ?? ''}
                </span>
              </p>
              <p className="mb-0 flex-1 text-xs text-[var(--coffie)] max-md:mb-1">
                <img
                  loading="lazy"
                  decoding="async"
                  src="/img/platform/coins.webp"
                  alt="coins"
                  className="mr-1 inline-block h-[14px] w-[14px] align-middle"
                />
                <span className="align-middle">************</span>
              </p>
            </div>
            <img
              loading="lazy"
              decoding="async"
              className="h-[32px] w-auto"
              src="/img/platform/balance-hide.webp"
              alt="balance-hide"
            />
          </div>
          <img
            loading="lazy"
            decoding="async"
            src="/img/platform/menu.webp"
            alt="menu"
            className="h-[40px] w-auto md:ml-auto"
          />
        </div>
      </div>

      <div className="mt-[65px] mb-[66px] bg-[radial-gradient(circle,#262626,#0a0a0a)] text-[#fadda6]">
        <Outlet />
      </div>

      <div
        id="mobile-navigation"
        className="fixed right-0 bottom-0 left-0 z-[99] bg-white"
      >
        <ul className="mb-0 flex items-center pl-0">
          {FOOTER_TABS.map((tab) => {
            const isActive = selectedTab === tab.key
            const TabIcon = iconMap[tab.icon]
            return (
              <li
                key={tab.key}
                className="flex-1 text-center"
                onClick={() => !tab.isDisabled && setSelectedTab(tab.key)}
                role="presentation"
              >
                {TabIcon && (
                  <TabIcon
                    className={
                      isActive
                        ? 'mx-auto flex h-[52px] w-[52px] -translate-y-[11px] items-center justify-center rounded-full border-4 border-white bg-[linear-gradient(to_bottom,var(--coffie-xs),var(--coffie-md),var(--coffie-lg))] text-white! [&_svg]:h-8 [&_svg]:w-8'
                        : 'mx-auto flex h-[44px] w-[44px] items-center justify-center rounded-full text-[var(--gray-text-2)]! [&_svg]:h-8 [&_svg]:w-8'
                    }
                  />
                )}
                <span
                  className={
                    isActive
                      ? 'block -translate-y-1 text-xs text-[var(--coffie)]'
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
