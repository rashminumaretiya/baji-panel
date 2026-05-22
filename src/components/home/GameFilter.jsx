import { useTranslation } from 'react-i18next'
import { GAME_LIST_FILTERS } from '../../core/constant/constants.js'

const DESKTOP_OPTIONS = [
  {
    labelKey: 'common.gameFilters.competition',
    value: GAME_LIST_FILTERS.COMPETITION,
  },
  { labelKey: 'common.gameFilters.time', value: GAME_LIST_FILTERS.TIME },
  { labelKey: 'common.gameFilters.matched', value: GAME_LIST_FILTERS.MATCHED },
]

const MOBILE_OPTIONS = [
  { labelKey: 'common.gameFilters.time', value: GAME_LIST_FILTERS.TIME },
  {
    labelKey: 'common.gameFilters.competition',
    value: GAME_LIST_FILTERS.COMPETITION,
  },
]

// ─── Desktop game-title row ────────────────────────────────────────────────
// Pixel-for-pixel port of `.sports-landing .game-title` + `.highlight-sorting`
// from the original home.scss. Renders as: flex justify-between, white label,
// custom <select> with a hand-rolled chevron via the after pseudo-element.
export function DesktopGameFilter({ value, onChange }) {
  const { t } = useTranslation()
  return (
    <div className="mx-0">
      <div className="w-full flex items-center justify-between">
        <div>{t('titles.sportHighLights')}</div>
        <div className="inline-flex items-center gap-1.5 font-normal">
          <label
            htmlFor="viewType"
            className="text-[12px] text-white whitespace-nowrap mb-0 cursor-default"
          >
            {t('common.viewBy')}
          </label>
          <div
            className={
              'relative ' +
              "after:content-[''] after:absolute after:right-[7px] after:top-1/2 after:-translate-y-1/2 " +
              'after:w-0 after:h-0 after:border-l-[4px] after:border-l-transparent ' +
              'after:border-r-[4px] after:border-r-transparent after:border-t-[5px] after:border-t-white ' +
              'after:pointer-events-none'
            }
          >
            <select
              id="viewType"
              name="View"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              aria-label={t('titles.highLights')}
              className={
                'w-[108px] h-[23px] border border-black/40 ' +
                'shadow-[inset_0_1px_rgba(var(--white-rgb),0.5)] rounded-[4px] ' +
                'bg-white/20 mr-0.5 ml-[7px] inline-block text-white ' +
                'appearance-none leading-[14px] pl-1 text-[12px] ' +
                '[&_option]:bg-[var(--dark-black)] [&_option]:text-white'
              }
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

// ─── Mobile horizontal tabs row ────────────────────────────────────────────
// Port of `.sports-landing .highlight` + `.highlight-tab` from home.scss
// (originally inside `@media (max-width: 787px)`). Must render as a horizontal
// flex tabs row — Cricket | Soccer | Tennis | Horse Racing | Greyhound Racing.
export function MobileGameFilter({ value, onChange }) {
  const { t } = useTranslation()
  return (
    <div>
      <h3
        className={
          'text-center mb-0 max-md:px-[1.87vw] ' +
          'max-md:bg-gradient-to-t max-md:from-[var(--xxl-blue)] max-md:to-[var(--xl-blue)] ' +
          'max-md:text-white max-md:text-[3.73vw] max-md:leading-[2.2] max-md:font-bold'
        }
      >
        {t('titles.highLights')}
      </h3>
      <div className="max-md:flex max-md:justify-center max-md:items-center max-md:h-[10.67vw]">
        <ul
          className={
            'p-0 flex max-md:w-[80%] max-md:mx-auto max-md:h-fit ' +
            'max-md:bg-[var(--light-xl-bg)] max-md:shadow-[inset_0_1px_3px_0_rgba(var(--black-rgb),0.15)] ' +
            'max-md:rounded-[1.6vw] max-md:p-[0.27vw]'
          }
          role="tablist"
        >
          {MOBILE_OPTIONS.map((opt) => {
            const isActive = value === opt.value
            return (
              <li
                key={opt.value}
                className={
                  'max-md:flex-1 max-md:text-[3.2vw] max-md:font-bold ' +
                  'max-md:flex max-md:items-center max-md:justify-center'
                }
                role="presentation"
              >
                <button
                  type="button"
                  className={
                    'max-md:h-[8vw] max-md:w-[calc(100%-0.5vw)] max-md:bg-transparent ' +
                    'max-md:text-black max-md:rounded-[1.33vw] max-md:p-0 max-md:mb-0 ' +
                    'max-md:text-[3.2vw] max-md:leading-[3.2vw] max-md:border ' +
                    'max-md:border-transparent max-md:m-[0.25vw] max-md:font-semibold ' +
                    (isActive
                      ? 'max-md:!bg-white max-md:!text-[var(--active-blue)] ' +
                        'max-md:shadow-[0_0_3px_0_rgba(var(--black-rgb),0.15)]'
                      : '')
                  }
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onChange(opt.value)}
                >
                  <span>
                    {t('sportLanding.bySport', { sport: t(opt.labelKey) })}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
