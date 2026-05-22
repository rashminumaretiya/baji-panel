import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Collapse from '../shared/components/primitives/Collapse.jsx'
import { selectIsYellowTheme } from '../store/slices/commonSlice.js'
import { selectStakesData } from '../store/slices/authSlice.js'
import {
  placeBet,
  selectActiveBetSlip,
  selectIsPlacingBet,
  setActiveBetSlip,
} from '../store/slices/betSlipSlice.js'
import { alertService } from '../shared/services/alert.js'
import SvgIcon from './SvgIcon.jsx'

const DEFAULT_AVAILABLE_STAKE = [100, 200, 500, 1000, 2000, 5000]

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0)
}

function NoBetSlip({ isShowLoader }) {
  if (isShowLoader) {
    return (
      <div className="side-loader bet-slip-loader">
        <span>Loading…</span>
      </div>
    )
  }

  return (
    <p className="text-center mt-3 text-[var(--white)] text-[13px] max-[991px]:text-[12px]">
      Click on the odds to add selections to the betslip.
    </p>
  )
}

function BetSlipForm({ activeMatchOdd, availableStake, isYellowTheme }) {
  const dispatch = useDispatch()
  const submitting = useSelector(selectIsPlacingBet)
  const isBack = activeMatchOdd?.betType === 'BACK'
  const [odds, setOdds] = useState(activeMatchOdd?.odd ?? '')
  const [stake, setStake] = useState('')
  const [confirmBets, setConfirmBets] = useState(false)
  const [preExposureLiability, setPreExposureLiability] = useState(0)

  const profitLiability = Number(stake) * Number(odds) - Number(stake) || 0

  const onStakeClick = (value) => {
    setStake(String(value))
  }

  const onPlaceBet = async () => {
    if (submitting) return
    const numericOdds = Number(odds)
    const numericStake = Number(stake)
    if (!numericOdds || !numericStake) {
      alertService.error('Please enter odds and stake')
      return
    }
    const slip = {
      ...activeMatchOdd,
      odd: numericOdds,
      odds: numericOdds,
      stake: numericStake,
    }
    try {
      await dispatch(placeBet({ slip })).unwrap()
      alertService.success('Bet placed successfully')
      setPreExposureLiability(0)
    } catch (msg) {
      alertService.error(typeof msg === 'string' ? msg : 'Failed to place bet')
    }
  }

  const onCancelAll = () => dispatch(setActiveBetSlip(null))

  // Selection background colours for the back/lay rows.
  const stakeRowBg = isBack
    ? 'bg-[var(--xs-blue-bg)] [&_td]:border-t [&_td]:border-[#7dbbe9]'
    : 'bg-[var(--xs-red-bg)] [&_td]:border-t [&_td]:border-[#dfa3b3]'
  const keepRowBg = isBack
    ? 'bg-[var(--xs-blue-bg)] [&_td]:border-t [&_td]:border-b [&_td]:border-[#7dbbe9]'
    : 'bg-[var(--xs-red-bg)] [&_td]:border-t [&_td]:border-b [&_td]:border-[#dfa3b3]'

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full mb-0">
            <thead>
              <tr>
                <th
                  className="relative shadow-[inset_0_2px_0_rgba(var(--black-rgb),0.1)] bg-[var(--xxs-text-color)] px-1.5 py-[5px] pl-3 font-medium leading-[14px] text-[11px] whitespace-nowrap text-[var(--header-primary)] w-[43.23529%] text-left after:content-[''] after:absolute after:w-px after:h-1/2 after:top-1/2 after:right-0 after:-translate-y-1/2 after:rounded-[1px]"
                >
                  {isBack ? 'Back (Bet For)' : 'Lay (Bet Against)'}
                </th>
                <th className="relative shadow-[inset_0_2px_0_rgba(var(--black-rgb),0.1)] bg-[var(--xxs-text-color)] px-1.5 py-[5px] font-medium leading-[14px] text-[11px] whitespace-nowrap text-[var(--header-primary)] w-[16.70588%] text-center after:content-[''] after:absolute after:w-px after:h-1/2 after:top-1/2 after:right-0 after:-translate-y-1/2 after:rounded-[1px]">
                  Odds
                </th>
                <th className="relative shadow-[inset_0_2px_0_rgba(var(--black-rgb),0.1)] bg-[var(--xxs-text-color)] px-1.5 py-[5px] font-medium leading-[14px] text-[11px] whitespace-nowrap text-[var(--header-primary)] w-[16.70588%] text-center after:content-[''] after:absolute after:w-px after:h-1/2 after:top-1/2 after:right-0 after:-translate-y-1/2 after:rounded-[1px]">
                  Stake
                </th>
                <th className="relative shadow-[inset_0_2px_0_rgba(var(--black-rgb),0.1)] bg-[var(--xxs-text-color)] px-1.5 py-[5px] pr-3 font-medium leading-[14px] text-[11px] whitespace-nowrap text-[var(--header-primary)] w-[24.11765%] text-right after:content-[''] after:absolute after:w-px after:h-1/2 after:top-1/2 after:right-0 after:-translate-y-1/2 after:rounded-[1px]">
                  {isBack ? 'Profit' : 'Liability'}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={4}
                  className="font-medium px-1.5 py-1 text-[12px] align-middle overflow-hidden bg-transparent"
                >
                  <h6 className="text-[11px] mb-0 pl-4 relative text-[var(--white)] before:absolute before:content-[''] before:text-[44px] before:bg-[var(--pagination-color)] before:h-2.5 before:w-2.5 before:rounded-full before:left-0.5 before:top-0.5 after:absolute after:content-[''] after:text-[44px] after:bg-[var(--light-xs-green)] after:h-1.5 after:w-1.5 after:rounded-full after:left-1 after:top-1">
                    {activeMatchOdd?.eventTitle}
                  </h6>
                </td>
              </tr>
              <tr>
                <td className="font-medium px-1.5 py-1 text-[12px] align-middle overflow-hidden bg-transparent w-[43.23529%]">
                  <div className="flex items-center">
                    <SvgIcon
                      name="cross"
                      className="mr-1 [&_svg]:h-2.5 [&_svg]:w-2.5 [&_svg]:bg-red-600 [&_svg]:text-[var(--white)] [&_svg]:p-0.5 [&_svg]:rounded-[3px]"
                    />
                    <div className="flex flex-wrap ml-1">
                      <span className="m-0 whitespace-nowrap inline-block pr-1">
                        {activeMatchOdd?.selectionName}
                      </span>
                      <p className="opacity-50 mb-0 text-[11px]">
                        {activeMatchOdd?.marketName}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="font-medium px-1.5 py-1 text-[12px] align-middle overflow-hidden bg-transparent w-[14.70588%]">
                  <div className="flex justify-end">
                    <input
                      type="number"
                      className="w-full h-[22px] text-right border-0 pr-0 text-[12px] shadow-[inset_0_1px_0_rgba(0,0,0,0.5)] rounded [&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-inner-spin-button]:mr-0 [&::-webkit-inner-spin-button]:ml-[5px]"
                      step="0.01"
                      min={0}
                      value={odds}
                      onChange={(e) => setOdds(e.target.value)}
                      onKeyDown={(e) => e.preventDefault()}
                    />
                  </div>
                </td>
                <td className="font-medium px-1.5 py-1 text-[12px] align-middle overflow-hidden bg-transparent w-[14.70588%]">
                  <div className="flex justify-end">
                    <input
                      type="number"
                      className="w-full h-[22px] text-right border-0 pr-0 text-[12px] shadow-[inset_0_1px_0_rgba(0,0,0,0.5)] rounded [&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-inner-spin-button]:mr-0 [&::-webkit-inner-spin-button]:ml-[5px]"
                      min={0}
                      value={stake}
                      onChange={(e) => setStake(e.target.value)}
                    />
                  </div>
                </td>
                <td className="font-medium px-1.5 py-1 pr-3 text-[12px] align-middle overflow-hidden bg-transparent w-[24.11765%]">
                  <p className="text-right mb-0 text-[11px]">
                    {formatNumber(profitLiability)}
                  </p>
                </td>
              </tr>
              <tr className={stakeRowBg}>
                <td
                  colSpan={4}
                  className="font-medium px-1.5 py-1 text-[12px] align-middle overflow-hidden"
                >
                  <div className="flex justify-between">
                    {availableStake.map((stakeValue) => (
                      <button
                        key={stakeValue}
                        type="button"
                        className="w-1/6 bg-gradient-to-t from-[#f3f3f3] to-[#fbfbfb] p-0 mx-0.5 mb-[1px] mt-0.5 border border-[#bbb] rounded text-[#1e1e1e] text-[11px] leading-[18px] font-normal min-[768px]:max-[1199px]:w-auto min-[768px]:max-[1199px]:px-2 min-[768px]:max-[1199px]:py-0.5"
                        onClick={() => onStakeClick(stakeValue)}
                      >
                        {stakeValue}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
              <tr className={keepRowBg}>
                <td
                  colSpan={4}
                  className="font-medium px-1.5 py-1 pr-3 text-[12px] align-middle overflow-hidden"
                >
                  <p className="text-right mb-0 text-[11px]">
                    Min Bet : <b>1</b>
                  </p>
                </td>
              </tr>
              <tr>
                <td
                  colSpan={4}
                  className="font-medium px-1.5 py-1 pr-3 text-[12px] align-middle overflow-hidden bg-white"
                >
                  <p className="text-right text-[#777] text-[12px] my-[5px]">
                    Liability{' '}
                    <span className="text-[var(--red)]">
                      {formatNumber(
                        preExposureLiability > 0
                          ? preExposureLiability
                          : preExposureLiability * -1
                      )}
                    </span>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex justify-between mx-2">
          <button
            type="button"
            className={cx(
              'max-w-[200px] w-full text-[12px] rounded text-[#1e1e1e] font-bold leading-[23px] p-0 mr-2 bg-white border border-[#bbb]',
              submitting && 'opacity-60 cursor-not-allowed'
            )}
            onClick={onCancelAll}
            disabled={submitting}
          >
            Cancel All
          </button>
          <button
            type="button"
            className={cx(
              'max-w-[200px] w-full text-[12px] rounded text-white font-bold leading-[23px] p-0 bg-[var(--primary)] border border-[var(--lg-primary)]',
              isYellowTheme && '!text-[var(--dark)] !bg-[image:linear-gradient(0deg,var(--md-primary-yellow)_0%,#ffa10c_100%)] !border-[var(--coffee)]',
              (!stake || submitting) && 'opacity-40 cursor-not-allowed'
            )}
            onClick={onPlaceBet}
            disabled={!stake || submitting}
          >
            {submitting ? 'Placing…' : 'Place Bet'}
          </button>
        </div>
        <div className="mt-[7px] pt-[3px] border-t border-[#e0e6e6] mb-[10px] pl-[5px]">
          <input
            id="confirmBets"
            type="checkbox"
            checked={confirmBets}
            onChange={(e) => setConfirmBets(e.target.checked)}
          />
          <label
            className="ml-1 inline-block cursor-pointer text-[var(--white)] text-[12px]"
            htmlFor="confirmBets"
          >
            Please confirm your bets.
          </label>
        </div>
      </form>
    </div>
  )
}

export default function BetSlip() {
  const activeMatchOdd = useSelector(selectActiveBetSlip)
  const stakesData = useSelector(selectStakesData)
  const isYellowTheme = useSelector(selectIsYellowTheme)

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isShowLoader] = useState(false)

  const isOpen = !!activeMatchOdd
  const availableStake =
    stakesData?.length > 0 ? stakesData : DEFAULT_AVAILABLE_STAKE

  return (
    <div>
      <div>
        <div className="mb-0">
          <h2 className="relative bg-gradient-to-b from-[var(--xts-blue)] to-[var(--xts-blue)] shadow-[0_2px_0_rgba(var(--white-rgb),0.1)] m-0">
            <button
              type="button"
              className={cx(
                'w-full text-left px-4 py-3 text-white text-[14px] font-semibold shadow-[0_2px_0_rgba(var(--white-rgb),0.1)] transition-[background-image] duration-200 bg-no-repeat bg-right bg-[length:auto_100%] relative flex items-center justify-between',
                isCollapsed
                  ? 'bg-[url(/img/grediant-slip-plus.png)]'
                  : 'bg-[url(/img/grediant-slip-minus.png)]'
              )}
              aria-expanded={!isCollapsed}
              onClick={() => setIsCollapsed((prev) => !prev)}
            >
              <span>Bet Slip</span>
            </button>
          </h2>
          <Collapse in={!isCollapsed}>
            <div>
              <div>
                {isOpen ? (
                  <BetSlipForm
                    // Key remounts the form whenever the active selection / betType
                    // changes so the controlled `odds` and `stake` inputs reset.
                    key={`${activeMatchOdd?.marketId ?? ''}-${activeMatchOdd?.selectionId ?? ''}-${activeMatchOdd?.betType ?? ''}`}
                    activeMatchOdd={activeMatchOdd}
                    availableStake={availableStake}
                    isYellowTheme={isYellowTheme}
                  />
                ) : (
                  <NoBetSlip isShowLoader={isShowLoader} />
                )}
              </div>
            </div>
          </Collapse>
        </div>
      </div>
    </div>
  )
}
