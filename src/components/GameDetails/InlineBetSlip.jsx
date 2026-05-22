import { useState } from 'react'
import { useIsMobile } from '../../hooks/useMediaQuery.js'

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
  'text-white bg-transparent border-0 flex-1 p-0 max-mobile:text-[var(--white)] max-mobile:bg-white max-mobile:w-auto max-mobile:px-1 max-mobile:py-[3px]'

function StakeButtons({ isMobile, onStakeClick }) {
  const stakes = isMobile ? DEFAULT_STAKES.slice(0, 5) : DEFAULT_STAKES
  // Wrapper differs: desktop `.stake`, mobile `.mobile-stake` (with full bg).
  const wrapperClass = isMobile
    ? 'flex justify-end items-center text-white border-r border-[#4a4a4a] py-2 px-1 max-mobile:bg-[image:linear-gradient(-180deg,#32617f_20%,#1f4258_91%)] max-mobile:p-0 max-mobile:leading-[2.46] max-mobile:text-[3.46667vw] max-mobile:border-r max-mobile:border-[rgba(var(--black-rgb),0.15)]'
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
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="14"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12z"
    />
  </svg>
)

// Common keypad button (`.keypad-wrapper .btn`).
const KEYPAD_BTN =
  'w-full cursor-pointer text-[18px] py-[6px] px-1 rounded-none border border-[var(--tbl-border-color)] border-l-0 text-[var(--header-primary)] bg-white max-mobile:text-[4vw] max-mobile:text-[#1e1e1e] max-mobile:leading-[10.4vw] max-mobile:p-0 max-mobile:bg-white max-mobile:border-0 max-mobile:border-l max-mobile:border-[#aaa] max-mobile:!border-b max-mobile:!border-b-[#aaa] [&_svg]:max-mobile:w-[4.8vw] [&_svg]:max-mobile:h-[3.2vw]'

function Keypad({ onValueChanged }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', '.']
  return (
    <div className="flex flex-row flex-wrap mx-0 max-mobile:border-t max-mobile:border-[#aaa]">
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
      <div className="w-[16.667%] max-mobile:-ml-px">
        <button
          type="button"
          className={`${KEYPAD_BTN} flex h-full items-center justify-center`}
          onClick={() => onValueChanged('backspace')}
        >
          <i className="not-italic">{BackspaceIcon}</i>
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

export default function InlineBetSlip({ betSlipDetails, onChange, onCancel, onPlaceBet, isPlacing = false }) {
  const isMobile = useIsMobile()
  const [isMatchChecked, setIsMatchChecked] = useState(false)

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

  if (isMobile) {
    // Mobile last-row backgrounds (`.mobile-betslip-wrapper.light-back / light-lay`).
    const lastRowBg = isBack
      ? '[&_tr:last-of-type_td]:bg-[#c7dbe9]'
      : '[&_tr:last-of-type_td]:bg-[#ebd5db]'

    return (
      <table
        className={`w-full m-0 max-mobile:-ml-px max-mobile:w-[calc(100%+1px)] ${betTypeClass} ${lastRowBg}`}
      >
        <tbody>
          <tr>
            <td
              colSpan={2}
              className="bg-transparent max-mobile:pt-[10px] max-mobile:px-[1.86667vw] max-mobile:pb-[1.86667vw]"
            >
              <div className="flex items-end justify-around">
                <div className="text-center flex-1 mr-[1.86667vw] max-mobile:[&:last-of-type]:mr-0 max-mobile:flex-[1_1_47.2vw]">
                  {isSportsBook && (
                    <p className="text-[var(--dark-gray)] text-[14px] mb-0 mr-[2vw] max-mobile:text-[2.93333vw] max-mobile:text-[#1e1e1e] max-mobile:leading-[1.3]">
                      Odds
                    </p>
                  )}
                  <div className="flex items-center border border-[#4a4a4a] rounded-md max-mobile:border-[#aaa] max-mobile:justify-between max-mobile:bg-white max-mobile:rounded-[1.6vw]">
                    {isMatchOdds ? (
                      <>
                        <button
                          type="button"
                          className="bg-[#bfbfbf] text-[var(--primary)] border border-[#bfbfbf] rounded-l-md max-mobile:h-[10.66667vw] max-mobile:w-[12vw] max-mobile:bg-gradient-to-t max-mobile:from-[#eee] max-mobile:to-white max-mobile:p-0 max-mobile:border-0 max-mobile:border-r max-mobile:border-[#aaa] max-mobile:rounded-tl-[1.6vw] max-mobile:rounded-bl-[1.6vw] max-mobile:rounded-tr-none max-mobile:rounded-br-none [&_svg]:max-mobile:w-[7.5vw] [&_svg]:max-mobile:h-[7.5vw]"
                          onClick={() => updateField('odds', 'DEC')}
                        >
                          {MinusIcon}
                        </button>
                        <input
                          type="text"
                          className="p-1 text-center max-w-[63px] bg-[#d9d9d9] text-[var(--primary)] h-[34px] rounded-none border border-[#4a4a4a] border-t-0 border-b-0 text-[20px] max-mobile:h-[10.66667vw] max-mobile:border-0 max-mobile:p-0 max-mobile:text-[#1e1e1e] max-mobile:text-[4vw] max-mobile:leading-[10.13333vw] max-mobile:font-bold max-mobile:bg-white max-mobile:shadow-[inset_0_0.53333vw_0_0_rgba(0,0,0,0.1)] max-mobile:max-w-none max-mobile:flex-1"
                          value={betSlipDetails?.odds ?? ''}
                          onKeyDown={(e) => e.preventDefault()}
                          inputMode="none"
                          readOnly
                        />
                        <button
                          type="button"
                          className="bg-[#bfbfbf] text-[var(--primary)] border border-[#bfbfbf] rounded-r-md max-mobile:h-[10.66667vw] max-mobile:w-[12vw] max-mobile:bg-gradient-to-t max-mobile:from-[#eee] max-mobile:to-white max-mobile:p-0 max-mobile:border-0 max-mobile:border-l max-mobile:border-[#aaa] max-mobile:rounded-tr-[1.6vw] max-mobile:rounded-br-[1.6vw] max-mobile:rounded-tl-none max-mobile:rounded-bl-none [&_svg]:max-mobile:w-[7.5vw] [&_svg]:max-mobile:h-[7.5vw]"
                          onClick={() => updateField('odds', 'INC')}
                        >
                          {PlusIcon}
                        </button>
                      </>
                    ) : (
                      <p className="m-0 flex items-center justify-center bg-[#dcdcdc] text-[var(--dark-gray)] border-[#dcdcdc] w-full max-mobile:h-[10.66667vw] max-mobile:p-0 max-mobile:border-0 max-mobile:rounded-[1.6vw]">
                        {oddDisplay}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-center flex-1 mr-[1.86667vw] max-mobile:[&:last-of-type]:mr-0 max-mobile:flex-[1_1_47.2vw]">
                  <p className="text-[var(--dark-gray)] text-[14px] mb-0 mr-[2vw] max-mobile:text-[2.93333vw] max-mobile:text-[#1e1e1e] max-mobile:leading-[1.3]">
                    Min Bet : {betSlipDetails?.min || 1}
                  </p>
                  <div className="flex items-center border border-[#4a4a4a] rounded-md max-mobile:border-[#aaa] max-mobile:justify-between max-mobile:bg-white max-mobile:rounded-[1.6vw]">
                    <button
                      type="button"
                      className="bg-[#bfbfbf] text-[var(--primary)] border border-[#bfbfbf] rounded-l-md max-mobile:h-[10.66667vw] max-mobile:w-[12vw] max-mobile:bg-gradient-to-t max-mobile:from-[#eee] max-mobile:to-white max-mobile:p-0 max-mobile:border-0 max-mobile:border-r max-mobile:border-[#aaa] max-mobile:rounded-tl-[1.6vw] max-mobile:rounded-bl-[1.6vw] max-mobile:rounded-tr-none max-mobile:rounded-br-none [&_svg]:max-mobile:w-[7.5vw] [&_svg]:max-mobile:h-[7.5vw]"
                      onClick={() => updateField('stake', 'DEC')}
                    >
                      {MinusIcon}
                    </button>
                    <input
                      type="text"
                      className="p-1 text-center max-w-[63px] bg-[var(--xs-secondary)] shadow-[inset_0_0.26667vw_1.33333vw_var(--primary)] text-[var(--primary)] h-[34px] rounded-none border border-[#4a4a4a] border-t-0 border-b-0 text-[20px] max-mobile:h-[10.66667vw] max-mobile:border-0 max-mobile:p-0 max-mobile:text-[#1e1e1e] max-mobile:text-[4vw] max-mobile:leading-[10.13333vw] max-mobile:font-bold max-mobile:max-w-none max-mobile:flex-1"
                      inputMode="none"
                      min={0}
                      value={betSlipDetails?.stake ?? ''}
                      onChange={(e) => updateStake(e.target.value)}
                    />
                    <button
                      type="button"
                      className="bg-[#bfbfbf] text-[var(--primary)] border border-[#bfbfbf] rounded-r-md max-mobile:h-[10.66667vw] max-mobile:w-[12vw] max-mobile:bg-gradient-to-t max-mobile:from-[#eee] max-mobile:to-white max-mobile:p-0 max-mobile:border-0 max-mobile:border-l max-mobile:border-[#aaa] max-mobile:rounded-tr-[1.6vw] max-mobile:rounded-br-[1.6vw] max-mobile:rounded-tl-none max-mobile:rounded-bl-none [&_svg]:max-mobile:w-[7.5vw] [&_svg]:max-mobile:h-[7.5vw]"
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
            <td colSpan={2} className="p-0 bg-transparent bg-[#103c59]">
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
            <td colSpan={2} className="bg-transparent max-mobile:p-[1.86667vw]">
              <div className="flex justify-around min-[768px]:gap-6">
                <button
                  type="button"
                  className={cx(
                    'bg-gradient-to-b from-white to-[#eeeeee] text-[12px] border border-[#bbb] rounded p-0 min-w-0 w-full max-w-[75px] leading-[31px] font-semibold flex-1 py-2',
                    'max-mobile:text-[4vw] max-mobile:font-bold max-mobile:leading-[2.6] max-mobile:text-[#1e1e1e] max-mobile:!p-0 max-mobile:!max-w-none max-mobile:rounded-[1.6vw] max-mobile:w-1/2 max-mobile:mr-[1.86667vw]',
                    isPlacing && 'opacity-60 cursor-not-allowed'
                  )}
                  onClick={onCancel}
                  disabled={isPlacing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={cx(
                    'text-[4vw] font-bold leading-[2.6] !text-white !p-0 !max-w-none rounded-[1.6vw] bg-[var(--primary)] border border-[var(--lg-primary)] w-1/2 py-2 max-w-[120px]',
                    isPlacing && 'opacity-60 cursor-not-allowed'
                  )}
                  onClick={() => !isPlacing && onPlaceBet?.(betSlipDetails)}
                  disabled={isPlacing}
                >
                  {isPlacing ? (
                    <span className="inline-flex items-center">
                      <span
                        className="inline-block w-3 h-3 mr-2 border-2 border-current border-r-transparent rounded-full animate-spin"
                        role="status"
                        aria-hidden="true"
                      />
                      Placing…
                    </span>
                  ) : (
                    'Place Bet'
                  )}
                </button>
              </div>
            </td>
          </tr>

          {showAcceptOdds && (
            <tr className="table-row">
              <td colSpan={2} className="max-mobile:px-[1.86667vw] max-mobile:h-[8.53333vw]">
                <div className="flex items-center h-full">
                  <div
                    className={cx(
                      'relative max-mobile:h-[4.8vw] max-mobile:w-[4.8vw] max-mobile:shadow-[inset_0_0.53333vw_0_0_rgba(0,0,0,0.4)] max-mobile:bg-white max-mobile:rounded-[1.06667vw]',
                      isMatchChecked && 'max-mobile:bg-[var(--spanish-yellow)]'
                    )}
                  >
                    <i
                      className={cx(
                        'not-italic',
                        '[&_svg]:max-mobile:h-[3vw] [&_svg]:max-mobile:w-[3vw] [&_svg]:max-mobile:absolute [&_svg]:max-mobile:top-1/2 [&_svg]:max-mobile:left-1/2 [&_svg]:max-mobile:-translate-x-1/2 [&_svg]:max-mobile:-translate-y-1/2',
                        isMatchChecked
                          ? '[&_svg]:max-mobile:block'
                          : '[&_svg]:max-mobile:hidden'
                      )}
                    >
                      {CheckIcon}
                    </i>
                    <input
                      id={marketData}
                      type="checkbox"
                      checked={isMatchChecked}
                      onChange={() => setIsMatchChecked((v) => !v)}
                      className="max-mobile:h-[4.8vw] max-mobile:w-[4.8vw] max-mobile:opacity-0 max-mobile:absolute max-mobile:top-0 max-mobile:left-0 max-mobile:z-[2]"
                    />
                  </div>
                  <label
                    className="text-black whitespace-nowrap max-mobile:ml-[1.86667vw] max-mobile:text-[#1e1e1e]"
                    htmlFor={marketData}
                  >
                    Accept Any Odds
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
                    Accept Any Odds
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
                  Cancel
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
                    'rounded min-w-[154px] !p-0 leading-[33px] bg-[var(--primary)] text-white font-semibold border-0 text-[12px]',
                    isPlacing && 'opacity-60 cursor-not-allowed'
                  )}
                  onClick={() => !isPlacing && onPlaceBet?.(betSlipDetails)}
                  disabled={isPlacing}
                >
                  {isPlacing ? (
                    <span className="inline-flex items-center">
                      <span
                        className="inline-block w-3 h-3 mr-2 border-2 border-current border-r-transparent rounded-full animate-spin"
                        role="status"
                        aria-hidden="true"
                      />
                      Placing…
                    </span>
                  ) : (
                    'Place Bet'
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
