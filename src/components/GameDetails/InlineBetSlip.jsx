import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../../hooks/useMediaQuery.js'
import { resolveApiMessage } from '../../shared/services/alert.js'

// Auto-dismiss delay for the inline feedback banner.
const FEEDBACK_AUTOCLOSE_MS = {
  success: 2500,
  warning: 3500,
  error: 4500,
}

const CloseIconSvg = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    width="12"
    height="12"
    aria-hidden="true"
  >
    <path d="M20,2H4C2.9,2,2,2.9,2,4v16c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z M16.9,15.6L15.5,17l-3.5-3.5L8.4,17 L7,15.6l3.5-3.5L7,8.5l1.4-1.4l3.5,3.5l3.5-3.5l1.4,1.4L13.4,12L16.9,15.6z" />
  </svg>
)

// Angular `.fancy-warning` banner — colour flips on `type`. Sits across the
// full width of the bet slip with a close icon on the right.
function FancyWarning({ type = 'warning', message, onClose }) {
  const variantBg = {
    warning: 'bg-[#fff3cd] text-[#856404] border-y border-[#ffeeba]',
    success: 'bg-[#d4edda] text-[#155724] border-y border-[#c3e6cb]',
    error: 'bg-[#f8d7da] text-[#721c24] border-y border-[#f5c6cb]',
  }[type]

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative text-center px-8 py-2 text-[12px] font-medium ${variantBg}`}
    >
      <p className="mb-0">{message}</p>
      <button
        type="button"
        aria-label="Close"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-current cursor-pointer p-1 leading-none [&_svg]:w-3 [&_svg]:h-3"
        onClick={onClose}
      >
        {CloseIconSvg}
      </button>
    </div>
  )
}

const MarketName = {
  MATCH_ODDS: 'MATCH_ODDS',
  FANCY: 'FANCY',
  SPORTS_BOOK: 'SPORTS_BOOK',
  BOOKMAKER: 'BOOKMAKER',
}

const DEFAULT_STAKES = [10, 20, 50, 100, 200, 500, 1000, 2000]

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

// Desktop stake buttons (`.stake button`).
const DESKTOP_STAKE_BTN =
  'p-0 m-0.5 mb-px border border-[#bbb] rounded text-[#1e1e1e] text-[11px] leading-[18px] font-normal w-1/6 bg-gradient-to-t from-[#f3f3f3] to-[#fbfbfb] hover:text-[var(--primary)] min-[768px]:w-full min-[768px]:text-[13px] min-[768px]:h-[25px] min-[768px]:max-w-[100px] min-[768px]:bg-gradient-to-b min-[768px]:from-white min-[768px]:to-[#eee] min-[768px]:border min-[768px]:border-[#bbb] min-[768px]:rounded min-[768px]:max-[1199px]:w-auto min-[768px]:max-[1199px]:px-2 min-[768px]:max-[1199px]:text-[11px]'

// Mobile stake buttons (`.mobile-stake button`).
const MOBILE_STAKE_BTN =
  'text-white bg-transparent border-0 flex-1 p-0 max-md:text-[var(--white)] max-md:bg-white max-md:w-auto max-md:px-1 max-md:py-[3px] max-md:bg-[linear-gradient(-180deg,#32617f_20%,#1f4258_91%)] max-md:p-0! max-md:leading-[1.76] max-md:text-[3.7vw]'

function StakeButtons({ isMobile, onStakeClick }) {
  const stakes = isMobile ? DEFAULT_STAKES.slice(0, 5) : DEFAULT_STAKES
  // Wrapper differs: desktop `.stake`, mobile `.mobile-stake` (with full bg).
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

// Common keypad button (`.keypad-wrapper .btn`).
const KEYPAD_BTN =
  'w-full cursor-pointer text-[18px] py-[6px] px-1 rounded-none border border-[var(--tbl-border-color)] border-l-0 text-[var(--header-primary)] bg-white max-md:text-[4vw] max-md:text-[#1e1e1e] max-md:leading-[10.4vw] max-md:p-0 max-md:bg-white max-md:border-0 max-md:border-l max-md:border-[#aaa] max-md:!border-b max-md:!border-b-[#aaa] [&_svg]:max-md:w-[4.8vw] [&_svg]:max-md:h-[3.2vw]'

function Keypad({ onValueChanged }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', '.']
  return (
    <div className="flex flex-row flex-wrap mx-0 max-md:border-t max-md:border-[#aaa]">
      <div className="w-[83.333%]">
        <div className="flex flex-row flex-wrap">
          {keys.map((key, idx) => (
            <div
              key={key}
              className={cx(
                'w-1/6',
                // Top two rows lose their bottom border on desktop.
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
          <i className="not-italic max-md:[&_svg]:w-[4.8vw] max-md:[&_svg]:h-[4.8vw]">
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

// Background colour for the bet-type row (back vs lay).
function betTypeBg(type) {
  return type === 'BACK' || type === 'YES'
    ? 'bg-[var(--md-blue-bg)]'
    : 'bg-[var(--md-red-bg)]'
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
  const [isMatchChecked, setIsMatchChecked] = useState(false)
  // Inline feedback banner (Angular `.fancy-warning`). One of:
  //   { type: 'warning'|'success'|'error', message: string }
  const [feedback, setFeedback] = useState(null)
  const feedbackTimerRef = useRef(null)

  // Cleanup the auto-close timer on unmount so a late tick doesn't try to
  // setFeedback on an unmounted slip.
  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    },
    []
  )

  const clearFeedback = () => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    setFeedback(null)
  }

  // `closeSlipAfter` — when truthy, runs `onCancel()` once the auto-close
  // timer fires. Used for the success case so the slip clears itself.
  const showFeedback = ({ type, message, closeSlipAfter = false }) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    setFeedback({ type, message })
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null)
      if (closeSlipAfter) onCancel?.()
    }, FEEDBACK_AUTOCLOSE_MS[type] ?? 3500)
  }

  const handlePlace = async () => {
    if (isPlacing) return
    const stake = Number(betSlipDetails?.stake) || 0
    const min = Number(betSlipDetails?.min) || 0
    if (!stake) {
      showFeedback({
        type: 'warning',
        message: t(
          'betSlip.enterStake',
          'Please enter a stake to place the bet.'
        ),
      })
      return
    }
    if (min && stake < min) {
      showFeedback({
        type: 'warning',
        message: t(
          'betSlip.belowMinimum',
          'The stake you have entered are below the minimum.'
        ),
      })
      return
    }
    try {
      const result = await onPlaceBet?.(betSlipDetails)
      // result = { data: { key, message, data }, slip } from the placeBet thunk.
      const message = resolveApiMessage(
        t,
        result?.data,
        t('betSlip.betPlaced', 'Bet placed successfully.')
      )
      showFeedback({ type: 'success', message, closeSlipAfter: true })
    } catch (err) {
      // err is the rejectWithValue body — { key, message } or { message }.
      const message = resolveApiMessage(
        t,
        err,
        t('betSlip.placeFailed', 'Failed to place bet.')
      )
      showFeedback({ type: 'error', message })
    }
  }

  const marketData = `acceptOdds-${betSlipDetails?.marketName || 'MARKET'}-${
    betSlipDetails?.runnerId ?? ''
  }`

  const isBack =
    betSlipDetails?.type === 'BACK' || betSlipDetails?.type === 'YES'
  const betTypeClass = betTypeBg(betSlipDetails?.type)

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

  // Single-state UX: render exactly one thing at a time.
  //   1. Placing  → render nothing (parent shows <PlacingBetStrip />).
  //   2. Feedback → render only the <FancyWarning /> banner.
  //   3. Idle     → render the full bet-slip controls.
  if (isPlacing) return null

  if (feedback) {
    return (
      <FancyWarning
        type={feedback.type}
        message={feedback.message}
        onClose={clearFeedback}
      />
    )
  }

  if (isMobile) {
    // Mobile last-row backgrounds (`.mobile-betslip-wrapper.light-back / light-lay`).
    const lastRowBg = isBack
      ? '[&_tr:last-of-type_td]:bg-[#c7dbe9]'
      : '[&_tr:last-of-type_td]:bg-[#ebd5db]'

    return (
      <table
        className={`w-full m-0 max-md:-ml-px max-md:w-[calc(100%+1px)] ${betTypeClass} ${lastRowBg}`}
      >
        <tbody>
          <tr>
            <td
              colSpan={2}
              className="bg-transparent max-md:pt-[10px] max-md:px-[1.86667vw] max-md:pb-[1.86667vw]"
            >
              <div className="flex items-end justify-around">
                <div className="text-center md:flex-1 mr-[1.86667vw] max-md:[&:last-of-type]:mr-0 max-md:flex-[1_1_47.2vw]">
                  {isSportsBook && (
                    <p className="text-[var(--dark-gray)] text-[14px] mb-0 mr-[2vw] max-md:text-[2.93333vw] max-md:text-[#1e1e1e] max-md:leading-[1.3]">
                      {t('common.odds', 'Odds')}
                    </p>
                  )}
                  <div className="flex items-center border border-[#4a4a4a] rounded-md max-md:border-[#aaa] max-md:justify-between max-md:bg-white max-md:rounded-[1.6vw]">
                    {isMatchOdds ? (
                      <>
                        <button
                          type="button"
                          className="bg-[#bfbfbf] text-[var(--primary)] border border-[#bfbfbf] rounded-l-md max-md:h-[10.66667vw] max-md:w-[12vw] max-md:bg-gradient-to-t max-md:from-[#eee] max-md:to-white max-md:p-0 max-md:border-0 max-md:border-r max-md:border-[#aaa] max-md:rounded-tl-[1.6vw] max-md:rounded-bl-[1.6vw] max-md:rounded-tr-none max-md:rounded-br-none [&_svg]:max-md:w-[7.5vw] [&_svg]:max-md:h-[7.5vw]"
                          onClick={() => updateField('odds', 'DEC')}
                        >
                          {MinusIcon}
                        </button>
                        <input
                          type="text"
                          className="p-1 text-center max-w-[63px] bg-[#d9d9d9] text-[var(--primary)] h-[34px] rounded-none border border-[#4a4a4a] border-t-0 border-b-0 text-[20px] max-md:h-[10.66667vw] max-md:border-0 max-md:p-0 max-md:text-[#1e1e1e] max-md:text-[4vw] max-md:leading-[10.13333vw] max-md:font-bold max-md:bg-white max-md:shadow-[inset_0_0.53333vw_0_0_rgba(0,0,0,0.1)] max-md:max-w-none max-md:flex-1"
                          value={betSlipDetails?.odds ?? ''}
                          onKeyDown={(e) => e.preventDefault()}
                          inputMode="none"
                          readOnly
                        />
                        <button
                          type="button"
                          className="bg-[#bfbfbf] text-[var(--primary)] border border-[#bfbfbf] rounded-r-md max-md:h-[10.66667vw] max-md:w-[12vw] max-md:bg-gradient-to-t max-md:from-[#eee] max-md:to-white max-md:p-0 max-md:border-0 max-md:border-l max-md:border-[#aaa] max-md:rounded-tr-[1.6vw] max-md:rounded-br-[1.6vw] max-md:rounded-tl-none max-md:rounded-bl-none [&_svg]:max-md:w-[7.5vw] [&_svg]:max-md:h-[7.5vw]"
                          onClick={() => updateField('odds', 'INC')}
                        >
                          {PlusIcon}
                        </button>
                      </>
                    ) : (
                      <p className="m-0 flex items-center justify-center bg-[#dcdcdc] text-[var(--dark-gray)] border-[#dcdcdc] w-full max-md:h-[10.66667vw] max-md:p-0 max-md:border-0 max-md:rounded-[1.6vw]">
                        {oddDisplay}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-center md:flex-1 mr-[1.86667vw] max-md:[&:last-of-type]:mr-0 max-md:flex-[1_1_47.2vw]">
                  <p className="text-[var(--dark-gray)] text-[14px] mb-0 mr-[2vw] max-md:text-[2.93333vw] max-md:text-[#1e1e1e] max-md:leading-[1.3]">
                    {t('common.minBet', 'Min Bet')} : {betSlipDetails?.min || 1}
                  </p>
                  <div className="flex items-center border border-[#4a4a4a] rounded-md max-md:border-[#aaa] max-md:justify-between max-md:bg-white max-md:rounded-[1.6vw]">
                    <button
                      type="button"
                      className="bg-[#bfbfbf] text-[var(--primary)] border border-[#bfbfbf] rounded-l-md max-md:h-[10.66667vw] max-md:w-[12vw] max-md:bg-gradient-to-t max-md:from-[#eee] max-md:to-white max-md:p-0 max-md:border-0 max-md:border-r max-md:border-[#aaa] max-md:rounded-tl-[1.6vw] max-md:rounded-bl-[1.6vw] max-md:rounded-tr-none max-md:rounded-br-none [&_svg]:max-md:w-[7.5vw] [&_svg]:max-md:h-[7.5vw] [&_svg]:mx-auto
[&_svg]:mx-auto"
                      onClick={() => updateField('stake', 'DEC')}
                    >
                      {MinusIcon}
                    </button>
                    <input
                      type="text"
                      className="p-1 text-center max-w-[63px] bg-[var(--xs-secondary)] shadow-[inset_0_0.26667vw_1.33333vw_var(--primary)] text-[var(--primary)] h-[34px] rounded-none border border-[#4a4a4a] border-t-0 border-b-0 text-[20px] max-md:h-[10.66667vw] max-md:border-0 max-md:p-0 max-md:text-[#1e1e1e] max-md:text-[4vw] max-md:leading-[10.13333vw] max-md:font-bold max-md:max-w-none max-md:flex-1 w-full"
                      inputMode="none"
                      min={0}
                      value={betSlipDetails?.stake ?? ''}
                      onChange={(e) => updateStake(e.target.value)}
                    />
                    <button
                      type="button"
                      className="bg-[#bfbfbf] text-[var(--primary)] border border-[#bfbfbf] rounded-r-md max-md:h-[10.66667vw] max-md:w-[12vw] max-md:bg-gradient-to-t max-md:from-[#eee] max-md:to-white max-md:p-0 max-md:border-0 max-md:border-l max-md:border-[#aaa] max-md:rounded-tr-[1.6vw] max-md:rounded-br-[1.6vw] max-md:rounded-tl-none max-md:rounded-bl-none [&_svg]:max-md:w-[7.5vw] [&_svg]:max-md:h-[7.5vw] [&_svg]:mx-auto
[&_svg]:mx-auto"
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
            <td
              colSpan={2}
              className="p-0 bg-transparent bg-[#103c59] border border-white"
            >
              <StakeButtons isMobile onStakeClick={updateStake} />
            </td>
          </tr>

          <tr>
            <td colSpan={2} className="p-0 bg-transparent">
              <div className="pt-2 bg-transparent">
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
                    'bg-gradient-to-b from-white to-[#eeeeee] text-[12px] border border-[#bbb] rounded p-0 min-w-0 w-full max-w-[75px] leading-[31px] font-semibold flex-1 py-2',
                    'max-md:text-[4vw] max-md:font-bold max-md:leading-[2.6] max-md:text-[#1e1e1e] max-md:!p-0 max-md:!max-w-none max-md:rounded-[1.6vw] max-md:w-1/2 max-md:mr-[1.86667vw]',
                    isPlacing && 'opacity-60 cursor-not-allowed'
                  )}
                  onClick={onCancel}
                  disabled={isPlacing}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  className={cx(
                    'text-[4vw]! font-bold leading-[2.6] !text-white !p-0 !max-w-none rounded-[1.6vw]! btn btn-primary w-1/2 py-2 max-w-[120px]',
                    isPlacing && 'opacity-60 cursor-not-allowed'
                  )}
                  onClick={handlePlace}
                  disabled={isPlacing}
                >
                  {isPlacing ? (
                    <span className="inline-flex items-center">
                      <span
                        className="inline-block w-3 h-3 mr-2 border-2 border-current border-r-transparent rounded-full animate-spin"
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
                className="max-md:px-[1.86667vw] max-md:h-[8.53333vw]"
              >
                <div className="flex items-center h-full">
                  <div
                    className={cx(
                      'relative max-md:h-[4.8vw] max-md:w-[4.8vw] max-md:shadow-[inset_0_0.53333vw_0_0_rgba(0,0,0,0.4)] max-md:bg-white max-md:rounded-[1.06667vw]',
                      isMatchChecked && 'max-md:bg-[var(--spanish-yellow)]'
                    )}
                  >
                    <i
                      className={cx(
                        'not-italic',
                        '[&_svg]:max-md:h-[3vw] [&_svg]:max-md:w-[3vw] [&_svg]:max-md:absolute [&_svg]:max-md:top-1/2 [&_svg]:max-md:left-1/2 [&_svg]:max-md:-translate-x-1/2 [&_svg]:max-md:-translate-y-1/2',
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
                      className="max-md:h-[4.8vw] max-md:w-[4.8vw] max-md:opacity-0 max-md:absolute max-md:top-0 max-md:left-0 max-md:z-[2]"
                    />
                  </div>
                  <label
                    className="text-black whitespace-nowrap max-md:ml-[1.86667vw] max-md:text-[#1e1e1e]"
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
      <table className="w-full m-0">
        <tbody>
          <tr>
            <td
              className={cx(
                'font-medium leading-[10px] text-[#254c5d] px-1.5 py-2 text-[14px] align-middle text-right',
                betTypeClass
              )}
            >
              <div className="flex justify-end items-center">
                <div className="mr-auto">
                  <input id={marketData} type="checkbox" />
                  <label
                    className="ml-1 text-black whitespace-nowrap"
                    htmlFor={marketData}
                  >
                    {t('common.acceptAnyOdds', 'Accept Any Odds')}
                  </label>
                </div>

                <button
                  type="button"
                  className={cx(
                    'ml-2 bg-gradient-to-b from-white to-[#eeeeee] text-[12px] border border-[#bbb] rounded p-0 min-w-0 w-full max-w-[75px] leading-[31px] font-semibold',
                    isPlacing && 'opacity-60 cursor-not-allowed'
                  )}
                  onClick={onCancel}
                  disabled={isPlacing}
                >
                  {t('common.cancel', 'Cancel')}
                </button>

                <div className="flex ml-2">
                  <div
                    className={cx(
                      'mr-2 min-[768px]:w-[69px] min-[768px]:p-0 min-[768px]:border-0 min-[768px]:bg-white/50 min-[768px]:rounded min-[768px]:min-h-[33px] max-[1440px]:w-[70px] max-[1440px]:p-1 flex flex-col justify-center [&_p]:m-0 [&_p]:text-right min-[768px]:[&_p]:leading-[18px] min-[768px]:[&_p]:text-[12px] min-[768px]:[&_p]:px-[5px] min-[768px]:[&_p]:font-semibold min-[768px]:[&_p]:text-[#1e1e1e] min-[768px]:[&_small]:leading-[12px] min-[768px]:[&_small]:text-[10px] min-[768px]:[&_small]:px-[5px] min-[768px]:[&_small]:text-[#222] min-[768px]:[&_small]:opacity-50 min-[768px]:[&_small]:font-medium [&_small]:text-right',
                      betTypeClass
                    )}
                  >
                    <p>{betSlipDetails?.odds || 0}</p>
                    {isFancy && <small>{betSlipDetails?.size || 0}</small>}
                  </div>

                  <input
                    type="number"
                    className="text-right mr-2 min-[768px]:w-[86px] min-[768px]:p-0 min-[768px]:border-0 min-[768px]:bg-white min-[768px]:rounded min-[768px]:min-h-[33px] min-[768px]:shadow-[inset_0_1px_0_rgba(0,0,0,0.5)] min-[768px]:text-[#1e1e1e] min-[768px]:text-[12px] max-[1440px]:w-[70px] max-[1440px]:px-2 max-[1440px]:py-1 [&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-inner-spin-button]:mr-0 [&::-webkit-inner-spin-button]:ml-[5px]"
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
                    'min-w-[182px] h-[31px] btn btn-primary',
                    isPlacing && 'opacity-60 cursor-not-allowed'
                  )}
                  onClick={handlePlace}
                  disabled={isPlacing}
                >
                  {isPlacing ? (
                    <span className="inline-flex items-center">
                      <span
                        className="inline-block w-3 h-3 mr-2 border-2 border-current border-r-transparent rounded-full animate-spin"
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
                'font-medium leading-[10px] text-[#254c5d] px-1.5 py-2 text-[14px] align-middle text-right',
                betTypeClass
              )}
            >
              <StakeButtons isMobile={false} onStakeClick={updateStake} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
