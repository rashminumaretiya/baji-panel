import { useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { selectSportTabs } from '../../store/slices/sportSlice.js'
import EventSearch from '../EventSearch.jsx'
import SvgIcon from '../SvgIcon.jsx'
import './mobile-sports.scss'

export default function MobileSports() {
  const { t } = useTranslation()
  const tabs = useSelector(selectSportTabs)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  function onKeyActivate(e, url) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(url)
    }
  }

  return (
    <>
      <div className="banner-placeholder" />
      <div className="games-tab">
        <div className="overflow-x-auto tabs-wrapper">
          <ul className="tabs">
            {tabs.map((tab) => {
              const url = `/${tab.route}`
              const isActive = pathname === url
              return (
                <li
                  key={tab.id}
                  className={[tab.classList || '', isActive ? 'active' : ''].filter(Boolean).join(' ')}
                  onClick={() => navigate(url)}
                  onKeyDown={(e) => onKeyActivate(e, url)}
                  role="button"
                  tabIndex={0}
                >
                  {tab.icon && <SvgIcon name={tab.icon} />}
                  <span>{tab.label ? t(tab.label) : tab.name}</span>
                  {(tab.count != null) && (
                    <div className="live-chip">
                      <div className="icon-out" />
                      <p className="number">{tab.count}</p>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
        <EventSearch />
      </div>
    </>
  )
}
