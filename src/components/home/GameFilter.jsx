import { useTranslation } from 'react-i18next'
import { GAME_LIST_FILTERS } from '../../core/constant/constants.js'

const DESKTOP_OPTIONS = [
  { labelKey: 'common.gameFilters.competition', value: GAME_LIST_FILTERS.COMPETITION },
  { labelKey: 'common.gameFilters.time', value: GAME_LIST_FILTERS.TIME },
  { labelKey: 'common.gameFilters.matched', value: GAME_LIST_FILTERS.MATCHED },
]

const MOBILE_OPTIONS = [
  { labelKey: 'common.gameFilters.time', value: GAME_LIST_FILTERS.TIME },
  { labelKey: 'common.gameFilters.competition', value: GAME_LIST_FILTERS.COMPETITION },
]

export function DesktopGameFilter({ value, onChange }) {
  const { t } = useTranslation()
  return (
    <div className="row mx-0">
      <div className="col-12 game-title">
        <div>{t('titles.sportHighLights')}</div>
        <div className="highlight-sorting">
          <label htmlFor="viewType">{t('common.viewBy')}</label>
          <div className="select">
            <select
              id="viewType"
              name="View"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              aria-label={t('titles.highLights')}
            >
              {DESKTOP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MobileGameFilter({ value, onChange }) {
  const { t } = useTranslation()
  return (
    <div>
      <h3 className="highlight text-center mb-0">{t('titles.highLights')}</h3>
      <div className="highlight-wrapper">
        <ul className="nav-tabs p-0 highlight-tab">
          {MOBILE_OPTIONS.map((opt) => (
            <li key={opt.value} className="nav-item">
              <button
                type="button"
                className={`nav-link${value === opt.value ? ' active' : ''}`}
                onClick={() => onChange(opt.value)}
              >
                <span>
                  {t('sportLanding.bySport', { sport: t(opt.labelKey) })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
