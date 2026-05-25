import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useIsMobile } from '../../hooks/useMediaQuery.js'
import FancyProgress from '../../shared/components/FancyProgress.jsx'
import { resolveApiMessage } from '../../shared/services/alert.js'
import { selectStakesData } from '../../store/slices/authSlice.js'

const FEEDBACK_TIMEPERIOD = {
  success: 5000,
  warning: 3500,
  failed: 4500,
}

const MarketName = {
  MATCH_ODDS: 'MATCH_ODDS',
  FANCY: 'FANCY',
  SPORTS_BOOK: 'SPORTS_BOOK',
  BOOKMAKER: 'BOOKMAKER',
}

const DEFAULT_STAKES = [100, 200, 500, 1000, 2000, 5000]

const MinusIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path fill="currentColor" d="M5 11h14v2H5z" />
  </svg>
)

const PlusIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path fill="currentColor" d="M11 5h2v14h-2zM5 11h14v2H5z" />
  </svg>
)

const CheckIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
    />
  </svg>
)

function stepStake(value, direction) {
  const current = Number(value) || 0
  if (direction === 'INC') return current + 10
  return Math.max(0, current - 10)
}

function stepOdds(value, direction) {
  const current = Number(value) || 0
  if (direction === 'INC') return +(current + 0.01).toFixed(2)
  return Math.max(0, +(current - 0.01).toFixed(2))
}

const DESKTOP_STAKE_BTN =
  'btn btn-white max-w-[100px] w-full ml-2 cursor-pointer'

const MOBILE_STAKE_BTN =
  'text-white bg-transparent border-0 flex-1 p-0 max-md:text-(--white) max-md:bg-white max-md:w-auto max-md:px-1 max-md:py-[3px] max-md:bg-[linear-gradient(-180deg,#32617f_20%,#1f4258_91%)] max-md:p-0! max-md:leading-[1.76] max-md:text-[3.7vw]'

function StakeButtons({ isMobile, onStakeClick, stakes: stakesProp }) {
  const source =
    Array.isArray(stakesProp) && stakesProp.length ? stakesProp : DEFAULT_STAKES
  const stakes = isMobile ? source.slice(0, 5) : source
  const wrapperClass = isMobile
    ? 'flex justify-end items-center text-white border-r border-[#4a4a4a] py-2 px-1 max-md:bg-[image:linear-gradient(-180deg,#32617f_20%,#1f4258_91%)] max-md:p-0 max-md:leading-[2.46] max-md:text-[3.46667vw] max-md:border-r max-md:border-[rgba(var(--black-rgb),0.15)]'
    : 'flex justify-end'
  const btnClass = isMobile ? MOBILE_STAKE_BTN : DESKTOP_STAKE_BTN
  return (
    <div className={wrapperClass}>
      {stakes.map((stake, idx) => (
        <button
          key={`${stake}-${idx}`}
          type="button"
          className={btnClass}
          onClick={() => onStakeClick(stake)}
        >
          {stake}
        </button>
      ))}
    </div>
  )
}

const BackspaceIcon = (
  <svg
    width="20"
    height="18"
    viewBox="0 0 20 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18.0159 2.2533H6.37953C5.84425 2.2533 5.42535 2.51493 5.14607 2.91112L0.949219 8.98102L5.14607 15.0434C5.42535 15.4396 5.84425 15.7087 6.37953 15.7087H18.0159C18.8692 15.7087 19.5674 15.036 19.5674 14.2137V3.74834C19.5674 2.92607 18.8692 2.2533 18.0159 2.2533ZM18.0159 14.2137H6.43383L2.81104 8.98102L6.42607 3.74834H18.0159V14.2137ZM9.02487 12.7186L11.8098 10.035L14.5948 12.7186L15.6886 11.6646L12.9037 8.98102L15.6886 6.2974L14.5948 5.24339L11.8098 7.92701L9.02487 5.24339L7.93105 6.2974L10.716 8.98102L7.93105 11.6646L9.02487 12.7186Z"
      fill="black"
    ></path>
  </svg>
)

const KEYPAD_BTN =
  'w-full cursor-pointer text-[18px] py-[6px] px-1 rounded-none border border-(--tbl-border-color) border-l-0 text-(--header-primary) bg-white max-md:text-[4vw] max-md:text-[#1e1e1e] max-md:leading-[10.4vw] max-md:p-0 max-md:bg-white max-md:border-0 max-md:border-l max-md:border-[#aaa] max-md:!border-b max-md:!border-b-[#aaa] [&_svg]:max-md:w-[4.8vw] [&_svg]:max-md:h-[3.2vw]'

function Keypad({ onValueChanged }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', '.']
  return (
    <div className="mx-0 flex flex-row flex-wrap max-md:border-t max-md:border-[#aaa]">
      <div className="w-[83.333%]">
        <div className="flex flex-row flex-wrap">
          {keys.map((key, idx) => (
            <div
              key={key}
              className={cx(
                'w-1/6',

                idx < 6 && '[&_button]:border-b-0'
              )}
            >
              <button
                type="button"
                className={KEYPAD_BTN}
                onClick={() => onValueChanged(key)}
              >
                {key}
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="w-[16.667%] max-md:-ml-px">
        <button
          type="button"
          className={`${KEYPAD_BTN} flex h-full items-center justify-center`}
          onClick={() => onValueChanged('backspace')}
        >
          <i className="not-italic max-md:[&_svg]:h-[4.8vw] max-md:[&_svg]:w-[4.8vw]">
            {BackspaceIcon}
          </i>
        </button>
      </div>
    </div>
  )
}

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Background colour for the bet-type row (back vs lay / premium sportsbook).
function isPremiumSlip(details) {
  return (
    details?.marketName === MarketName.SPORTS_BOOK ||
    details?.gtype === 'sportsBook'
  )
}

function betTypeBg(details) {
  const type = details?.type
  if (isPremiumSlip(details) && (type === 'BACK' || type === 'YES')) {
    return 'bg-(--md-green-bg)'
  }
  return type === 'BACK' || type === 'YES'
    ? 'bg-(--md-blue-bg)'
    : 'bg-(--md-red-bg)'
}

export default function InlineBetSlip({
  betSlipDetails,
  onChange,
  onCancel,
  onPlaceBet,
  isPlacing = false,
}) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  const stakesData = useSelector(selectStakesData)
  const [isMatchChecked, setIsMatchChecked] = useState(false)

  const [fancyConfig, setFancyConfig] = useState(null)
  const closeSlipAfterRef = useRef(false)

  const clearFancyConfig = () => {
    const shouldCancelSlip = closeSlipAfterRef.current
    closeSlipAfterRef.current = false
    setFancyConfig(null)
    if (shouldCancelSlip) onCancel?.()
  }

  const updateFancyLoader = (data, { closeSlipAfter = false } = {}) => {
    closeSlipAfterRef.current = closeSlipAfter
    setFancyConfig({ timePeriod: FEEDBACK_TIMEPERIOD.warning, ...data })
  }

  const handlePlace = async () => {
    if (isPlacing) return
    try {
      await onPlaceBet?.(betSlipDetails)

      updateFancyLoader(
        {
          success: true,
          odd: betSlipDetails?.odds,
          size: betSlipDetails?.size,
          timePeriod: FEEDBACK_TIMEPERIOD.success,
        },
        { closeSlipAfter: true }
      )
    } catch (err) {
      const message = resolveApiMessage(
        t,
        err,
        t('betSlip.placeFailed', 'Failed to place bet.')
      )
      updateFancyLoader({
        failed: true,
        errMsg: message,
        timePeriod: FEEDBACK_TIMEPERIOD.failed,
      })
    }
  }

  const marketData = `acceptOdds-${betSlipDetails?.marketName || 'MARKET'}-${
    betSlipDetails?.runnerId ?? ''
  }`

  const isBack =
    betSlipDetails?.type === 'BACK' || betSlipDetails?.type === 'YES'
  const betTypeClass = betTypeBg(betSlipDetails)

  const isMatchOdds = betSlipDetails?.marketName === MarketName.MATCH_ODDS
  const isFancy = betSlipDetails?.marketName === MarketName.FANCY
  const isSportsBook = betSlipDetails?.marketName === MarketName.SPORTS_BOOK
  const showAcceptOdds = betSlipDetails?.marketName !== MarketName.MATCH_ODDS

  const oddDisplay = !betSlipDetails
    ? ''
    : isFancy
      ? `${betSlipDetails.odds}/${betSlipDetails.size}`
      : `${betSlipDetails.odds}`

  const updateField = (field, direction) => {
    onChange?.({
      ...betSlipDetails,
      [field]:
        field === 'odds'
          ? stepOdds(betSlipDetails?.odds, direction)
          : stepStake(betSlipDetails?.stake, direction),
    })
  }

  const updateStake = (value) => {
    onChange?.({ ...betSlipDetails, stake: Number(value) || 0 })
  }

  const keypadChange = (value) => {
    let current = (betSlipDetails?.stake ?? 0).toString()
    if (value === 'backspace') {
      current = current.slice(0, -1)
    } else {
      current = current + value
    }
    onChange?.({ ...betSlipDetails, stake: Number(current) || 0 })
  }

  if (isPlacing) return null

  if (fancyConfig) {
    return <FancyProgress config={fancyConfig} onClose={clearFancyConfig} />
  }

  if (isMobile) {
    const lastRowBg = isBack
      ? 'md:[&_tr:last-of-type_td]:bg-[#c7dbe9]'
      : 'md:[&_tr:last-of-type_td]:bg-[#ebd5db]'

    return (
      <table
        className={`m-0 w-full max-md:-ml-px max-md:w-[calc(100%+1px)] ${betTypeClass} ${lastRowBg}`}
      >
        <tbody>
          <tr>
            <td
              colSpan={2}
              className="bg-transparent max-md:px-[1.86667vw] max-md:pt-[10px] max-md:pb-[1.86667vw]"
            >
              <div className="flex items-end justify-around">
                <div className="mr-[1.86667vw] text-center max-md:flex-[1_1_47.2vw] max-md:last-of-type:mr-0 flex-1">
                  {isSportsBook && (
                    <p className="mr-[2vw] mb-0 text-[14px] text-(--dark-gray) max-md:text-[2.93333vw] max-md:leading-[1.3] max-md:text-[#1e1e1e]">
                      {t('common.odds', 'Odds')}
                    </p>
                  )}
                  <div className="flex items-center rounded-md border border-[#4a4a4a] max-md:justify-between max-md:rounded-[1.6vw] max-md:border-[#aaa] max-md:bg-white">
                    {isMatchOdds ? (
                      <>
                        <button
                          type="button"
                          className="rounded-l-md border border-[#bfbfbf] bg-[#bfbfbf] text-(--primary) max-md:h-[10.66667vw] max-md:w-[12vw] max-md:rounded-tl-[1.6vw] max-md:rounded-tr-none max-md:rounded-br-none max-md:rounded-bl-[1.6vw] max-md:border-0 max-md:border-r max-md:border-[#aaa] max-md:bg-linear-to-t max-md:from-[#eee] max-md:to-white max-md:p-0 [&_svg]:max-md:h-[7.5vw] [&_svg]:max-md:w-[7.5vw]"
                          onClick={() => updateField('odds', 'DEC')}
                        >
                          {MinusIcon}
                        </button>
                        <input
                          type="text"
                          className="h-[34px] max-w-[63px] rounded-none border border-t-0 border-b-0 border-[#4a4a4a] bg-[#d9d9d9] p-1 text-center text-[20px] text-(--primary) max-md:h-[10.66667vw] max-md:max-w-none max-md:flex-1 max-md:border-0 max-md:bg-white max-md:p-0 max-md:text-[4vw] max-md:leading-[10.13333vw] max-md:font-bold max-md:text-[#1e1e1e] max-md:shadow-[inset_0_0.53333vw_0_0_rgba(0,0,0,0.1)] flex-1 w-full"
                          value={betSlipDetails?.odds ?? ''}
                          onKeyDown={(e) => e.preventDefault()}
                          inputMode="none"
                          readOnly
                        />
                        <button
                          type="button"
                          className="rounded-r-md border border-[#bfbfbf] bg-[#bfbfbf] text-(--primary) max-md:h-[10.66667vw] max-md:w-[12vw] max-md:rounded-tl-none max-md:rounded-tr-[1.6vw] max-md:rounded-br-[1.6vw] max-md:rounded-bl-none max-md:border-0 max-md:border-l max-md:border-[#aaa] max-md:bg-linear-to-t max-md:from-[#eee] max-md:to-white max-md:p-0 [&_svg]:max-md:h-[7.5vw] [&_svg]:max-md:w-[7.5vw]"
                          onClick={() => updateField('odds', 'INC')}
                        >
                          {PlusIcon}
                        </button>
                      </>
                    ) : (
                      <p className="m-0 flex w-full items-center justify-center border-[#dcdcdc] bg-[#dcdcdc] text-(--dark-gray) max-md:h-[10.66667vw] max-md:rounded-[1.6vw] max-md:border-0 max-md:p-0">
                        {oddDisplay}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mr-[1.86667vw] text-center max-md:flex-[1_1_47.2vw] max-md:last-of-type:mr-0 md:flex-1">
                  <p className="mr-[2vw] mb-0 text-[14px] text-(--dark-gray) max-md:text-[2.93333vw] max-md:leading-[1.3] max-md:text-[#1e1e1e]">
                    {t('common.minBet', 'Min Bet')} : {betSlipDetails?.min || 1}
                  </p>
                  <div className="flex items-center rounded-md border border-[#4a4a4a] max-md:justify-between max-md:rounded-[1.6vw] max-md:border-[#aaa] max-md:bg-white">
                    <button
                      type="button"
                      className="rounded-l-md border border-[#bfbfbf] bg-[#bfbfbf] text-(--primary) max-md:h-[10.66667vw] max-md:w-[12vw] max-md:rounded-tl-[1.6vw] max-md:rounded-tr-none max-md:rounded-br-none max-md:rounded-bl-[1.6vw] max-md:border-0 max-md:border-r max-md:border-[#aaa] max-md:bg-linear-to-t max-md:from-[#eee] max-md:to-white max-md:p-0 [&_svg]:mx-auto [&_svg]:max-md:h-[7.5vw] [&_svg]:max-md:w-[7.5vw]"
                      onClick={() => updateField('stake', 'DEC')}
                    >
                      {MinusIcon}
                    </button>
                    <input
                      type="text"
                      className="h-[34px] w-full max-w-[63px] rounded-none border border-t-0 border-b-0 border-[#4a4a4a] bg-(--xs-secondary) p-1 text-center text-[20px] text-(--primary) shadow-[inset_0_0.26667vw_1.33333vw_var(--primary)] max-md:h-[10.66667vw] max-md:max-w-none max-md:flex-1 max-md:border-0 max-md:p-0 max-md:text-[4vw] max-md:leading-[10.13333vw] max-md:font-bold max-md:text-[#1e1e1e]"
                      inputMode="none"
                      min={0}
                      value={betSlipDetails?.stake ?? ''}
                      onChange={(e) => updateStake(e.target.value)}
                    />
                    <button
                      type="button"
                      className="rounded-r-md border border-[#bfbfbf] bg-[#bfbfbf] text-(--primary) max-md:h-[10.66667vw] max-md:w-[12vw] max-md:rounded-tl-none max-md:rounded-tr-[1.6vw] max-md:rounded-br-[1.6vw] max-md:rounded-bl-none max-md:border-0 max-md:border-l max-md:border-[#aaa] max-md:bg-linear-to-t max-md:from-[#eee] max-md:to-white max-md:p-0 [&_svg]:mx-auto [&_svg]:max-md:h-[7.5vw] [&_svg]:max-md:w-[7.5vw]"
                      onClick={() => updateField('stake', 'INC')}
                    >
                      {PlusIcon}
                    </button>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td colSpan={2} className="border border-white bg-[#103c59] p-0">
              <StakeButtons
                isMobile
                onStakeClick={updateStake}
                stakes={stakesData}
              />
            </td>
          </tr>

          <tr>
            <td colSpan={2} className="bg-transparent p-0">
              <div className="bg-transparent pt-2">
                <Keypad onValueChanged={keypadChange} />
              </div>
            </td>
          </tr>

          <tr>
            <td colSpan={2} className="bg-transparent max-md:p-[1.86667vw]">
              <div className="flex justify-around min-[768px]:gap-6">
                <button
                  type="button"
                  className={cx(
                    'w-full max-w-[75px] min-w-0 flex-1 rounded border border-[#bbb] bg-linear-to-b from-white to-[#eeeeee] p-0 py-2 text-[12px] leading-[31px] font-semibold',
                    'max-md:mr-[1.86667vw] max-md:w-1/2 max-md:max-w-none! max-md:rounded-[1.6vw] max-md:p-0! max-md:text-[4vw] max-md:leading-[2.6] max-md:font-bold max-md:text-[#1e1e1e]',
                    isPlacing && 'cursor-not-allowed opacity-60'
                  )}
                  onClick={onCancel}
                  disabled={isPlacing}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  className={cx(
                    'btn btn-primary w-1/2 max-w-[120px] rounded-[1.6vw]! p-0! py-2 text-[4vw]! leading-[2.6] font-bold text-white!',
                    isPlacing && 'cursor-not-allowed opacity-60'
                  )}
                  onClick={handlePlace}
                  disabled={isPlacing}
                >
                  {isPlacing ? (
                    <span className="inline-flex items-center">
                      <span
                        className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent"
                        role="status"
                        aria-hidden="true"
                      />
                      {t('common.placing', 'Placing…')}
                    </span>
                  ) : (
                    t('common.placeBet', 'Place Bet')
                  )}
                </button>
              </div>
            </td>
          </tr>

          {showAcceptOdds && (
            <tr className="table-row">
              <td
                colSpan={2}
                className="max-md:h-[8.53333vw] max-md:px-[1.86667vw]"
              >
                <div className="flex h-full items-center">
                  <div
                    className={cx(
                      'relative max-md:h-[4.8vw] max-md:w-[4.8vw] max-md:rounded-[1.06667vw] max-md:bg-white max-md:shadow-[inset_0_0.53333vw_0_0_rgba(0,0,0,0.4)]',
                      isMatchChecked && 'max-md:bg-(--spanish-yellow)'
                    )}
                  >
                    <i
                      className={cx(
                        'not-italic',
                        '[&_svg]:max-md:absolute [&_svg]:max-md:top-1/2 [&_svg]:max-md:left-1/2 [&_svg]:max-md:h-[3vw] [&_svg]:max-md:w-[3vw] [&_svg]:max-md:-translate-x-1/2 [&_svg]:max-md:-translate-y-1/2',
                        isMatchChecked
                          ? '[&_svg]:max-md:block'
                          : '[&_svg]:max-md:hidden'
                      )}
                    >
                      {CheckIcon}
                    </i>
                    <input
                      id={marketData}
                      type="checkbox"
                      checked={isMatchChecked}
                      onChange={() => setIsMatchChecked((v) => !v)}
                      className="max-md:absolute max-md:top-0 max-md:left-0 max-md:z-2 max-md:h-[4.8vw] max-md:w-[4.8vw] max-md:opacity-0"
                    />
                  </div>
                  <label
                    className="whitespace-nowrap text-black max-md:ml-[1.86667vw] max-md:text-[#1e1e1e]"
                    htmlFor={marketData}
                  >
                    {t('common.acceptAnyOdds', 'Accept Any Odds')}
                  </label>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="m-0 w-full">
        <tbody>
          <tr>
            <td
              className={cx(
                'px-1.5 py-2 text-right align-middle text-[14px] leading-[10px] font-medium text-[#254c5d]',
                betTypeClass
              )}
            >
              <div className="flex items-center justify-end">
                <div className="mr-auto">
                  <input id={marketData} type="checkbox" />
                  <label
                    className="ml-1 whitespace-nowrap text-black"
                    htmlFor={marketData}
                  >
                    {t('common.acceptAnyOdds', 'Accept Any Odds')}
                  </label>
                </div>

                <button
                  type="button"
                  className={cx(
                    'ml-2 w-full max-w-[75px] min-w-0 rounded border border-[#bbb] bg-linear-to-b from-white to-[#eeeeee] p-0 text-[12px] leading-[31px] font-semibold',
                    isPlacing && 'cursor-not-allowed opacity-60'
                  )}
                  onClick={onCancel}
                  disabled={isPlacing}
                >
                  {t('common.cancel', 'Cancel')}
                </button>

                <div className="ml-2 flex">
                  <div
                    className={cx(
                      'mr-2 flex flex-col justify-center max-[1440px]:w-[70px] max-[1440px]:p-1 min-[768px]:min-h-[33px] min-[768px]:w-[69px] min-[768px]:rounded min-[768px]:border-0 min-[768px]:bg-white/50 min-[768px]:p-0 [&_p]:m-0 [&_p]:text-right min-[768px]:[&_p]:px-[8px] min-[768px]:[&_p]:text-[12px] min-[768px]:[&_p]:leading-[18px] min-[768px]:[&_p]:font-semibold min-[768px]:[&_p]:text-[#1e1e1e] [&_small]:text-right min-[768px]:[&_small]:px-[5px] min-[768px]:[&_small]:text-[10px] min-[768px]:[&_small]:leading-[12px] min-[768px]:[&_small]:font-medium min-[768px]:[&_small]:text-[#222] min-[768px]:[&_small]:opacity-50',
                      betTypeClass
                    )}
                  >
                    <p>{betSlipDetails?.odds || 0}</p>
                    {isFancy && <small>{betSlipDetails?.size || 0}</small>}
                  </div>

                  <input
                    type="number"
                    className="mr-2 text-right max-[1440px]:w-[70px] max-[1440px]:px-2 max-[1440px]:py-1 min-[768px]:min-h-[33px] min-[768px]:w-[100px] min-[768px]:rounded min-[768px]:border-0 min-[768px]:bg-white min-[768px]:p-0 min-[768px]:text-[12px] min-[768px]:text-[#1e1e1e] min-[768px]:shadow-[inset_0_1px_0_rgba(0,0,0,0.5)] [&::-webkit-inner-spin-button]:mr-0 [&::-webkit-inner-spin-button]:ml-[5px] [&::-webkit-inner-spin-button]:opacity-100"
                    min={0}
                    value={betSlipDetails?.stake ?? ''}
                    onChange={(e) => updateStake(e.target.value)}
                    inputMode="none"
                    disabled={isPlacing}
                  />
                </div>

                <button
                  type="button"
                  className={cx(
                    'btn btn-primary h-[31px] min-w-[182px] md:text-xs!',
                    isPlacing && 'cursor-not-allowed opacity-60'
                  )}
                  onClick={handlePlace}
                  disabled={isPlacing}
                >
                  {isPlacing ? (
                    <span className="inline-flex items-center">
                      <span
                        className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent"
                        role="status"
                        aria-hidden="true"
                      />
                      {t('common.placing', 'Placing…')}
                    </span>
                  ) : (
                    t('common.placeBet', 'Place Bet')
                  )}
                </button>
              </div>
            </td>
          </tr>

          <tr>
            <td
              className={cx(
                'px-1.5 py-2 text-right align-middle text-[14px] leading-[10px] font-medium text-[#254c5d]',
                betTypeClass
              )}
            >
              <StakeButtons
                isMobile={false}
                onStakeClick={updateStake}
                stakes={stakesData}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
