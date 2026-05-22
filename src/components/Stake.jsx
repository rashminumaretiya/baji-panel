import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectIsMcvYellowTheme,
  selectIsYellowTheme,
} from '../store/slices/commonSlice.js'
import {
  loadStakes,
  selectStakesData,
  updateStakes,
} from '../store/slices/authSlice.js'
import { alertService } from '../shared/services/alert.js'
import SvgIcon from './SvgIcon.jsx'

const QUICK_STAKE_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8]

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Section wrapper used for "Default Stake", "Stake/Quick Stakes",
// "Odds", "Fancy Bet", "Sportsbook" and "Win Selection Forecast".
const SECTION_WRAPPER =
  'relative border-b border-[var(--sm-text-color)] shadow-[0_1px_0_rgba(var(--white-rgb),0.8)] leading-[15px] pb-0.5 mb-[5px] max-md:text-[4vw] max-md:text-[var(--light-navy)] max-md:border-b max-md:border-[var(--light-bg)] max-md:px-[1.86667vw] max-md:py-0 max-md:mb-0'

// `.title` from the SCSS — bold blue/dark heading on desktop, full-width
// gradient bar on mobile.
const TITLE_CLASS =
  'text-[11px] leading-3.25 font-bold mb-[5px] max-md:mx-[-2.4vw] max-md:mb-[1.86667vw] max-md:px-[1.86667vw] max-md:bg-[image:linear-gradient(-180deg,var(--xl-blue)_0%,var(--xxl-blue)_82%)] max-md:text-white max-md:text-[3.73333vw] max-md:leading-[2.2] max-md:font-bold'

// `.title.odds` variant on mobile.
const TITLE_ODDS_OVERRIDE =
  'max-md:bg-none max-md:text-[var(--light-navy)] max-md:m-0 max-md:p-0 max-md:font-normal'

// The mobile-only switch (toggle) — replaces the BS form-check styling.
const SWITCH_LABEL =
  'relative inline-block w-[9.33333vw] h-[9.33333vw] min-[768px]:hidden m-0 ml-1 [&>input]:opacity-0 [&>input]:w-0 [&>input]:h-0'
const SLIDER =
  'absolute cursor-pointer inset-0 bg-[var(--chip-xl-color)] rounded-[1.6vw] shadow-[inset_0_0.26667vw_0.8vw_0_rgba(var(--black-rgb),0.5)] before:absolute before:content-[""] before:h-[7.2vw] before:w-[2.66667vw] before:left-[1.06667vw] before:top-1/2 before:-translate-y-1/2 before:bg-white before:rounded-[1.06667vw] before:shadow-[0_0.53333vw_1.06667vw_0_rgba(var(--black-rgb),0.5),inset_0_-0.8vw_0_0_var(--chip-sm-color)] after:content-[""] after:w-[1.06667vw] after:h-[1.33333vw] after:bg-[var(--light-bg)] after:shadow-[inset_0_0.26667vw_0.26667vw_0_rgba(var(--black-rgb),0.26)] after:rounded-[0.53333vw] after:absolute after:top-1/2 after:left-[7px] after:-translate-y-1/2 peer-checked:bg-[var(--light-green)] peer-checked:before:left-auto peer-checked:before:right-[1.06667vw] peer-checked:after:left-auto peer-checked:after:right-[7px]'

// Footer-button wrapper (half-width on desktop, flex-1 on mobile).
const BTN_WRAPPER = 'w-1/2 max-md:flex-1 max-md:w-auto'

// `.btn` inside `.btn-wrapper` — 90% wide on desktop, full on mobile.
const FOOTER_BTN_BASE =
  'w-[90%] max-md:h-[10.93333vw] max-md:w-full max-md:text-[4vw] max-md:rounded-[1.6vw] text-[11px] font-bold leading-[23px] p-0 border rounded'

export default function Stake({
  isMobile = false,
  onCancel,
  isYellowTheme: isYellowThemeProp,
  isMcwCasinoTheme: isMcwCasinoThemeProp,
}) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const stakesData = useSelector(selectStakesData)
  const isYellowThemeFromStore = useSelector(selectIsYellowTheme)
  const isMcwCasinoThemeFromStore = useSelector(selectIsMcvYellowTheme)
  const isYellowTheme = isYellowThemeProp ?? isYellowThemeFromStore
  const isMcwCasinoTheme = isMcwCasinoThemeProp ?? isMcwCasinoThemeFromStore

  const [defaultStake, setDefaultStake] = useState(0)
  const [editedStake, setEditedStake] = useState(null)
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [fancyBetAcceptAnyOdds, setFancyBetAcceptAnyOdds] = useState(false)
  const [isStakeEditable, setIsStakeEditable] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const stakesLocked = !isStakeEditable

  useEffect(() => {
    if (!stakesData?.length) dispatch(loadStakes())
  }, [dispatch, stakesData?.length])

  const availableStake =
    editedStake ??
    Object.fromEntries(
      QUICK_STAKE_SLOTS.map((slot, i) => [slot, stakesData?.[i] ?? ''])
    )

  const toggleStakeEdit = () => setIsStakeEditable((prev) => !prev)

  const updateQuickStake = (slot, value) => {
    setEditedStake((prev) => ({ ...(prev ?? availableStake), [slot]: value }))
  }

  const handleSave = async () => {
    const stake = QUICK_STAKE_SLOTS.map((slot) => Number(availableStake[slot]))
    if (stake.some((n) => Number.isNaN(n))) {
      alertService.error(t('common.invalidStake', 'Invalid stake value'))
      return
    }
    setIsSaving(true)
    try {
      const action = await dispatch(updateStakes(stake)).unwrap()
      if (action?.key) alertService.success(t(action.key))
      setEditedStake(null)
      onCancel?.()
    } catch {
      // error toast is handled by the axios error interceptor
    } finally {
      setIsSaving(false)
    }
  }

  // Theme-specific overrides for the green "Save" / "OK" buttons.
  const themedOkBtn = cx(
    isYellowTheme &&
      '!bg-[image:linear-gradient(0deg,var(--md-primary-yellow)_0%,#ffa10c_100%)] !border-[var(--coffee)] !text-black hover:!bg-[image:linear-gradient(0deg,#ffa10c_0%,var(--md-primary-yellow)_100%)]',
    isMcwCasinoTheme &&
      '!text-[#ffd354] !border-[#222] !bg-[image:linear-gradient(180deg,#474747_0%,#070707_100%)] hover:!bg-[image:linear-gradient(180deg,#474747_0%,#070707_100%)]'
  )

  return (
    <div>
      <div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          {isMobile ? (
            <>
              <div className="flex items-center justify-between [&>div]:flex [&>div]:items-center">
                <div>
                  <SvgIcon name="settingIcon" />
                  <span>{t('common.settings', 'Setting')}</span>
                </div>
                <SvgIcon
                  name="closePopover"
                  className="cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={onCancel}
                  onKeyDown={(e) => e.key === 'Enter' && onCancel?.()}
                />
              </div>
              <h3 className="mb-0 bg-[var(--xxl-blue)] text-white px-[1.86667vw] py-[1.86667vw] text-[3.73333vw] font-bold leading-[2.2]">
                {t('common.stake', 'Stake')}
              </h3>
            </>
          ) : (
            <h6 className="block md:hidden text-[12px] font-bold p-2 bg-[var(--xl-th-bg)]">
              {t('common.stake', 'Stake')}
            </h6>
          )}

          <div className={SECTION_WRAPPER}>
            <div className="flex items-center text-[11px] mr-[5px] mb-[5px] max-md:my-[1.86667vw] max-md:mx-0 max-md:text-[4vw] [&_label]:font-bold [&_label]:text-[var(--text-color)] max-md:[&_label]:font-normal">
              <label htmlFor="stake-default">
                {t('common.defaultStake', 'Default Stake')}
              </label>
              <input
                id="stake-default"
                type="number"
                className="h-5 leading-5 px-[5px] mx-[5px] w-[29.16666%] text-[11px] border border-[var(--input-group-border)] rounded max-md:w-[29.66667vw] max-md:px-[1.86667vw] max-md:py-[2.66667vw] max-md:mx-[1.6666vw] max-md:my-0 max-md:h-auto max-md:text-[4vw] max-md:leading-normal max-md:border-[var(--xxl-gray)] max-md:rounded-[1.6vw] max-md:shadow-[inset_0_0.53333vw_0_0_rgba(var(--black-rgb),0.1)] max-md:text-right focus:max-md:shadow-[inset_0_0.26667vw_1.33333vw_rgba(var(--xss-yellow),0.6)] focus:max-md:border-[var(--coffee)] bg-white"
                min={0}
                value={defaultStake}
                onChange={(e) => setDefaultStake(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className={SECTION_WRAPPER}>
              <div className="max-md:mr-[-1.86667vw]">
                <h6
                  className={cx(
                    'block md:hidden',
                    TITLE_CLASS,
                    isMobile && TITLE_ODDS_OVERRIDE
                  )}
                >
                  {t('common.quickStakes', 'Quick Stakes')}
                </h6>
                <h6 className={cx('hidden md:block leading-3.25', TITLE_CLASS)}>
                  {t('common.stake', 'Stake')}
                </h6>
                <div className="block md:flex">
                  <div>
                    <div className="flex flex-wrap">
                      {QUICK_STAKE_SLOTS.map((slot) => (
                        <div
                          key={slot}
                          className="w-[50px] mr-[5px] mb-[5px] max-md:w-[22.65vw] max-md:mr-[1.86667vw] max-md:mb-[1.86667vw]"
                        >
                          <input
                            type="text"
                            className="w-full bg-gradient-to-b from-white to-[var(--xs-gray)] border border-[var(--lg-black)] shadow-[inset_0_2px_0_0_rgba(var(--black-rgb),0.1)] leading-[18px] p-0 text-center text-[11px] hover:bg-gradient-to-b hover:from-[var(--xs-gray)] hover:to-white rounded max-md:rounded-[1.6vw] max-md:text-[4vw] max-md:font-bold max-md:leading-[2.2]"
                            value={availableStake[slot]}
                            disabled={stakesLocked}
                            onChange={(e) =>
                              updateQuickStake(slot, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={cx(
                      'border border-[var(--sm-text-color)] shadow-[inset_0_1px_0_0_rgba(var(--white-rgb),0.8)] bg-transparent text-[var(--text-color)] h-[45px] flex items-center justify-center text-[11px] p-0 w-[82px] font-normal max-md:w-[calc(100%-1.86667vw)] max-md:h-auto max-md:leading-[2.6] max-md:font-bold max-md:bg-[rgba(var(--xss-darkest),0.4)] max-md:border-[0.26667vw] max-md:border-[var(--sm-text-color)] max-md:shadow-[inset_0_0.53333vw_0_0_rgba(var(--white-rgb),0.8)] max-md:rounded-[1.6vw] max-md:text-[4vw] max-md:mb-[1.86667vw] [&>span]:text-[var(--light-navy)] rounded',
                      !stakesLocked &&
                        'text-white border-[var(--lg-primary)] bg-gradient-to-b from-[var(--xs-primary)] to-[var(--xxs-primary)] hover:bg-gradient-to-b hover:from-[var(--xxs-primary)] hover:to-[var(--xs-primary)]',
                      !stakesLocked && themedOkBtn
                    )}
                    onClick={toggleStakeEdit}
                  >
                    {stakesLocked ? (
                      <>
                        <span>{t('common.edit', 'Edit')}</span>
                        <div className="h-[9px] w-[9px] bg-[url('/img/icon-stake-edit.png')] bg-no-repeat bg-right max-md:w-[4vw] max-md:h-[4vw] max-md:bg-[url('/img/svg/edit-big.svg')] max-md:ml-[1.33333vw] max-md:bg-contain" />
                      </>
                    ) : (
                      t('common.ok', 'OK')
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={cx(SECTION_WRAPPER, 'max-md:pb-[1.86667vw]')}>
            <h6 className={TITLE_CLASS}>Odds</h6>
            <div className="flex items-center justify-between md:justify-start md:mb-2 max-md:flex-row-reverse">
              {isMobile ? (
                <>
                  <label className={SWITCH_LABEL} htmlFor="highlight">
                    <input
                      type="checkbox"
                      id="highlight"
                      className="peer"
                      checked={isHighlighted}
                      onChange={(e) => setIsHighlighted(e.target.checked)}
                    />
                    <span className={SLIDER} />
                  </label>
                  <span>
                    {t(
                      'common.highlightWhenOddsChange',
                      'Highlight when odds change'
                    )}
                  </span>
                </>
              ) : (
                <>
                  <input
                    type="checkbox"
                    id="highlight"
                    checked={isHighlighted}
                    onChange={(e) => setIsHighlighted(e.target.checked)}
                  />
                  <label className="m-0 ml-1" htmlFor="highlight">
                    {t(
                      'common.highlightWhenOddsChange',
                      'Highlight when odds change'
                    )}
                  </label>
                </>
              )}
            </div>
          </div>

          <div className={cx(SECTION_WRAPPER, 'max-md:pb-[1.86667vw]')}>
            <h6 className={TITLE_CLASS}>{t('common.fancyBet', 'Fancy Bet')}</h6>
            <div className="flex items-center justify-between md:justify-start md:mb-2 max-md:flex-row-reverse">
              {isMobile ? (
                <>
                  <label className={SWITCH_LABEL} htmlFor="fancyBet">
                    <input
                      type="checkbox"
                      id="fancyBet"
                      className="peer"
                      checked={fancyBetAcceptAnyOdds}
                      onChange={(e) =>
                        setFancyBetAcceptAnyOdds(e.target.checked)
                      }
                    />
                    <span className={SLIDER} />
                  </label>
                  <span className="m-0 ml-1">
                    {t('common.acceptAnyOdds', 'Accept Any Odds')}
                  </span>
                </>
              ) : (
                <>
                  <input
                    type="checkbox"
                    id="fancyBet"
                    checked={fancyBetAcceptAnyOdds}
                    onChange={(e) => setFancyBetAcceptAnyOdds(e.target.checked)}
                  />
                  <label className="m-0 ml-1" htmlFor="fancyBet">
                    {t('common.acceptAnyOdds', 'Accept Any Odds')}
                  </label>
                </>
              )}
            </div>
          </div>

          <div className={cx(SECTION_WRAPPER, 'max-md:pb-[1.86667vw]')}>
            <h6 className={TITLE_CLASS}>
              {t('common.sportsbook', 'Sportsbook')}
            </h6>
            <div className="flex items-center justify-between md:justify-start md:mb-2 max-md:flex-row-reverse" />
          </div>

          <div className={cx(SECTION_WRAPPER, 'max-md:pb-[1.86667vw]')}>
            <h6 className={TITLE_CLASS}>
              {t('common.winSelectionForecast', 'Win Selection Forecast')}
            </h6>
            <div className="flex items-center justify-between md:justify-start md:mb-2 max-md:flex-row-reverse" />
          </div>

          <div className="flex justify-center md:gap-0 max-md:gap-[2vw] max-md:py-[3.86667vw] max-md:px-[1.86667vw] max-md:pt-[3.86667vw] max-md:pb-[1.86667vw]">
            <div className={BTN_WRAPPER}>
              <button
                type="button"
                className={cx(
                  FOOTER_BTN_BASE,
                  'md:mr-2 btn btn-white border-[#bbb] text-[#1e1e1e]',
                  isSaving && 'opacity-60 cursor-not-allowed'
                )}
                onClick={onCancel}
                disabled={isSaving}
              >
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
            <div className={cx(BTN_WRAPPER, 'text-right')}>
              <button
                type="button"
                className={cx(
                  FOOTER_BTN_BASE,
                  'btn btn-primary border-[var(--lg-primary)] text-white',
                  themedOkBtn,
                  (!stakesLocked || isSaving) && 'opacity-60 cursor-not-allowed'
                )}
                onClick={handleSave}
                disabled={!stakesLocked || isSaving}
              >
                {isSaving
                  ? t('common.saving', 'Saving...')
                  : t('common.save', 'Save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
