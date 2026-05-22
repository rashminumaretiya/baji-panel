import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import Collapse from '../shared/components/primitives/Collapse.jsx'
import { selectIsYellowTheme } from '../store/slices/commonSlice.js'
import { selectStakesData } from '../store/slices/authSlice.js'
import {
  placeBet,
  selectActiveBetSlip,
  selectIsPlacingBet,
  selectPlacingSelectionId,
  setActiveBetSlip,
} from '../store/slices/betSlipSlice.js'
import { alertService, resolveApiMessage } from '../shared/services/alert.js'
import Loader from '../shared/components/Loader.jsx'
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

  return <NoBetSlipMsg />
}

function NoBetSlipMsg() {
  const { t } = useTranslation()
  return (
    <p className="text-center my-4 text-[13px] max-[991px]:text-[12px]">
      {t(
        'common.clickOddsToAdd',
        'Click on the odds to add selections to the betslip.'
      )}
    </p>
  )
}

function BetSlipForm({ activeMatchOdd, availableStake, isYellowTheme }) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const submitting = useSelector(selectIsPlacingBet)
  const isBack = activeMatchOdd?.betType === 'BACK'
  const [odds, setOdds] = useState(activeMatchOdd?.odd ?? '')
  const [stake, setStake] = useState('')
  const [confirmBets, setConfirmBets] = useState(false)

  const numericOdds = Number(odds) || 0
  const numericStake = Number(stake) || 0
  const profitLiability = (numericOdds - 1) * numericStake
  const liability = isBack ? numericStake : (numericOdds - 1) * numericStake

  const onStakeClick = (value) => {
    setStake(String(value))
  }

  const onPlaceBet = async () => {
    if (submitting) return
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
    const context = {
      sport: activeMatchOdd?.sport ?? '',
      eventId: String(activeMatchOdd?.eventId ?? ''),
      eventTitle: activeMatchOdd?.eventTitle ?? '',
      runners: activeMatchOdd?.runners ?? [],
    }
    try {
      const result = await dispatch(placeBet({ slip, context })).unwrap()
      alertService.success(
        resolveApiMessage(t, result?.data, 'Bet placed successfully')
      )
    } catch (err) {
      alertService.error(resolveApiMessage(t, err, 'Failed to place bet'))
    }
  }

  const onCancelAll = () => dispatch(setActiveBetSlip(null))

  const rowBg = isBack ? 'bg-[var(--md-blue-bg)]' : 'bg-[var(--md-red-bg)]'
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
                <th className="relative shadow-[inset_0_2px_0_rgba(var(--black-rgb),0.1)] bg-[var(--xxs-text-color)] px-1.5 py-[5px] pl-3 font-medium leading-[14px] text-[11px] whitespace-nowrap text-[var(--header-primary)] w-[43.23529%] text-left after:content-[''] after:absolute after:w-px after:h-1/2 after:top-1/2 after:right-0 after:-translate-y-1/2 after:rounded-[1px]">
                  {isBack
                    ? t('odds.backBetFor', 'Back (Bet For)')
                    : t('odds.layBetAgainst', 'Lay (Bet Against)')}
                </th>
                <th className="relative shadow-[inset_0_2px_0_rgba(var(--black-rgb),0.1)] bg-[var(--xxs-text-color)] px-1.5 py-[5px] font-medium leading-[14px] text-[11px] whitespace-nowrap text-[var(--header-primary)] w-[16.70588%] text-center after:content-[''] after:absolute after:w-px after:h-1/2 after:top-1/2 after:right-0 after:-translate-y-1/2 after:rounded-[1px]">
                  {t('common.odds', 'Odds')}
                </th>
                <th className="relative shadow-[inset_0_2px_0_rgba(var(--black-rgb),0.1)] bg-[var(--xxs-text-color)] px-1.5 py-[5px] font-medium leading-[14px] text-[11px] whitespace-nowrap text-[var(--header-primary)] w-[16.70588%] text-center after:content-[''] after:absolute after:w-px after:h-1/2 after:top-1/2 after:right-0 after:-translate-y-1/2 after:rounded-[1px]">
                  {t('common.stake', 'Stake')}
                </th>
                <th className="relative shadow-[inset_0_2px_0_rgba(var(--black-rgb),0.1)] bg-[var(--xxs-text-color)] px-1.5 py-[5px] pr-3 font-medium leading-[14px] text-[11px] whitespace-nowrap text-[var(--header-primary)] w-[24.11765%] text-right after:content-[''] after:absolute after:w-px after:h-1/2 after:top-1/2 after:right-0 after:-translate-y-1/2 after:rounded-[1px]">
                  {isBack
                    ? t('common.profit', 'Profit')
                    : t('common.liability', 'Liability')}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={4}
                  className="font-medium px-1.5 py-1 text-[12px] align-middle overflow-hidden bg-transparent"
                >
                  <h6 className="text-[11px] mb-0 pl-4 relative before:absolute before:content-[''] before:text-[44px] before:bg-[var(--pagination-color)] before:h-2.5 before:w-2.5 before:rounded-full before:left-0.5 before:top-0.5 after:absolute after:content-[''] after:text-[44px] after:bg-[var(--light-xs-green)] after:h-1.5 after:w-1.5 after:rounded-full after:left-1 after:top-1">
                    {activeMatchOdd?.eventTitle}
                  </h6>
                </td>
              </tr>
              <tr className={rowBg}>
                <td className="font-medium px-1.5 py-1 text-[11px] align-middle overflow-hidden bg-transparent w-[43.23529%]">
                  <div className="flex items-center">
                    <SvgIcon
                      name="cross"
                      className="mr-1 h-[15px] flex items-center [&_svg]:h-2.5 [&_svg]:w-2.5 [&_svg]:bg-red-600 [&_svg]:text-[var(--white)] [&_svg]:p-0.5 [&_svg]:rounded-[3px]"
                    />
                    <div className="flex flex-col ml-1">
                      <span className="m-0 whitespace-nowrap inline-block pr-1">
                        {activeMatchOdd?.selectionName}
                      </span>
                      <p className="opacity-50 mb-0 text-[11px]">
                        {activeMatchOdd?.marketDisplayName ||
                          activeMatchOdd?.marketName}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="font-medium px-1.5 py-1 text-[12px] align-middle overflow-hidden bg-transparent w-[14.70588%]">
                  <div className="flex justify-end">
                    <input
                      type="number"
                      className="w-full h-[22px] text-right border-0 pr-0 text-[12px] bg-white shadow-[inset_0_1px_0_rgba(0,0,0,0.5)] rounded [&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-inner-spin-button]:mr-0 [&::-webkit-inner-spin-button]:ml-[5px]"
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
                      className="w-full h-[22px] text-right border-0 pr-0 text-[12px] bg-white shadow-[inset_0_1px_0_rgba(0,0,0,0.5)] rounded [&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-inner-spin-button]:mr-0 [&::-webkit-inner-spin-button]:ml-[5px]"
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
                        className="w-1/6 cursor-pointer bg-gradient-to-t from-[#f3f3f3] to-[#fbfbfb] p-0 mx-0.5 mb-[1px] mt-0.5 border border-[#bbb] rounded text-[#1e1e1e] text-[11px] leading-[18px] font-normal min-[768px]:max-[1199px]:w-auto min-[768px]:max-[1199px]:px-2 min-[768px]:max-[1199px]:py-0.5"
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
                  className="font-medium px-1.5 py-1 text-[12px] align-middle overflow-hidden"
                >
                  <p className="text-right mb-0 text-[11px]">
                    Min Bet : <b>1</b>
                  </p>
                </td>
              </tr>
              <tr>
                <td
                  colSpan={4}
                  className="font-medium px-1.5 py-1 text-[12px] align-middle overflow-hidden bg-white"
                >
                  <p className="text-right text-[#777] text-[12px] my-[5px]">
                    {t('common.liability', 'Liability')}{' '}
                    <span className="text-[var(--red)] text-[11px]">
                      {formatNumber(Math.abs(liability))}
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
              'btn btn-white max-w-[200px] cursor-pointer mr-2 w-full',
              submitting && 'opacity-60 cursor-not-allowed'
            )}
            onClick={onCancelAll}
            disabled={submitting}
          >
            {t('common.cancelAll', 'Cancel All')}
          </button>
          <button
            type="button"
            className={cx(
              'btn btn-primary max-w-[200px] w-full cursor-pointer',
              isYellowTheme &&
                '!text-[var(--dark)] !bg-[image:linear-gradient(0deg,var(--md-primary-yellow)_0%,#ffa10c_100%)] !border-[var(--coffee)]',
              submitting && 'cursor-not-allowed'
            )}
            onClick={onPlaceBet}
            disabled={submitting}
          >
            {submitting
              ? t('common.placing', 'Placing…')
              : t('common.placeBet', 'Place Bet')}
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
            className="ml-1 inline-block cursor-pointer text-[12px]"
            htmlFor="confirmBets"
          >
            {t('common.pleaseConfirmBets', 'Please confirm your bets.')}
          </label>
        </div>
      </form>
    </div>
  )
}

export default function BetSlip() {
  const { t } = useTranslation()
  const activeMatchOdd = useSelector(selectActiveBetSlip)
  const stakesData = useSelector(selectStakesData)
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const isPlacingBet = useSelector(selectIsPlacingBet)
  const placingSelectionId = useSelector(selectPlacingSelectionId)

  const [isCollapsed, setIsCollapsed] = useState(false)

  const isOpen = !!activeMatchOdd
  const availableStake =
    stakesData?.length > 0 ? stakesData : DEFAULT_AVAILABLE_STAKE
  const isPlacingThisSlip =
    isPlacingBet &&
    !!activeMatchOdd &&
    String(placingSelectionId ?? '') ===
      String(activeMatchOdd?.selectionId ?? '')

  return (
    <div className="mb-0">
      <h2 className="relative bg-linear-to-b from-(--xts-blue) to-(--xts-blue) shadow-[0_2px_0_rgba(var(--white-rgb),0.1)] m-0">
        <button
          type="button"
          className={cx(
            'w-full text-left px-2.5 text-white text-xs leading-[25px] shadow-[0_2px_0_rgba(var(--white-rgb),0.1)] transition-[background-image] duration-200 bg-no-repeat bg-right bg-[length:auto_100%] relative flex items-center justify-between',
            isCollapsed
              ? 'bg-[url(/img/grediant-slip-plus.png)]'
              : 'bg-[url(/img/grediant-slip-minus.png)]'
          )}
          aria-expanded={!isCollapsed}
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          <span>{t('common.betSlip', 'Bet Slip')}</span>
        </button>
      </h2>
      <Collapse in={!isCollapsed}>
        <div className="relative">
          {isPlacingThisSlip && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px] cursor-wait"
              aria-busy="true"
              aria-live="polite"
            >
              <Loader
                show
                message="common.placingBet"
                fallback="Placing bet please wait..."
              />
            </div>
          )}
          <div>
            {isOpen ? (
              <BetSlipForm
                key={`${activeMatchOdd?.marketId ?? ''}-${activeMatchOdd?.selectionId ?? ''}-${activeMatchOdd?.betType ?? ''}`}
                activeMatchOdd={activeMatchOdd}
                availableStake={availableStake}
                isYellowTheme={isYellowTheme}
              />
            ) : (
              <NoBetSlip />
            )}
          </div>
        </div>
      </Collapse>
    </div>
  )
}
