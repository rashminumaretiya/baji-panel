import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import Collapse from '../shared/components/primitives/Collapse.jsx'
import { selectIsYellowTheme } from '../store/slices/commonSlice.js'
import { selectStakesData } from '../store/slices/authSlice.js'
import {
  clearFancyProgress,
  placeBet,
  selectActiveBetSlip,
  selectIsPlacingBet,
  selectMatchOddsFancyProgress,
  selectPlacingSelectionId,
  setActiveBetSlip,
  setFancyProgress,
  setPreExposure,
} from '../store/slices/betSlipSlice.js'
import FancyProgress from '../shared/components/FancyProgress.jsx'
import { resolveApiMessage } from '../shared/services/alert.js'
import Loader from '../shared/components/Loader.jsx'
import { formatAmount as formatNumber } from '../utils/customFunction.js'
import { CrossIcon } from './icons.jsx'

const DEFAULT_AVAILABLE_STAKE = [100, 200, 500, 1000, 2000, 5000]

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
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
    <p className="my-4 text-center text-[13px] max-[991px]:text-[12px]">
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

  const selectionId = activeMatchOdd?.selectionId
  const marketId = activeMatchOdd?.marketId
  const betType = activeMatchOdd?.betType
  const marketName = activeMatchOdd?.marketName ?? 'MATCH_ODDS'
  useEffect(() => {
    if (!selectionId || numericStake <= 0 || numericOdds <= 0) {
      dispatch(setPreExposure(null))
      return
    }
    const pl = Number(((numericOdds - 1) * numericStake).toFixed(2))
    const profit = pl > 0 ? (isBack ? 1 : -1) * pl : 0
    const liabilityVal = numericStake > 0 ? (isBack ? -1 : 1) * numericStake : 0
    dispatch(
      setPreExposure({
        selectionId,
        marketId,
        profit,
        liability: liabilityVal,
        betType,
        marketName,
      })
    )
  }, [
    dispatch,
    selectionId,
    marketId,
    betType,
    isBack,
    numericStake,
    numericOdds,
    marketName,
  ])

  const onStakeClick = (value) => {
    setStake(String(value))
  }

  const onPlaceBet = async () => {
    if (submitting) return
    const selectionId = activeMatchOdd?.selectionId
    const writeFancyProgress = (config) =>
      dispatch(
        setFancyProgress({
          selectionId,
          config: { ...config, marketName: 'MATCH_ODDS' },
        })
      )

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
    writeFancyProgress({ progress: true, timePeriod: 5000 })
    try {
      await dispatch(placeBet({ slip, context })).unwrap()
      writeFancyProgress({
        success: true,
        odd: numericOdds,
        size: activeMatchOdd?.size,
        timePeriod: 5000,
      })
    } catch (err) {
      writeFancyProgress({
        failed: true,
        errMsg: resolveApiMessage(t, err, 'Failed to place bet'),
        timePeriod: 4500,
      })
    }
  }

  const onCancelAll = () => dispatch(setActiveBetSlip(null))

  const rowBg = isBack ? 'bg-(--md-blue-bg)' : 'bg-(--md-red-bg)'
  const stakeRowBg = isBack
    ? 'bg-(--xs-blue-bg) [&_td]:border-t [&_td]:border-[#7dbbe9]'
    : 'bg-(--xs-red-bg) [&_td]:border-t [&_td]:border-[#dfa3b3]'
  const keepRowBg = isBack
    ? 'bg-(--xs-blue-bg) [&_td]:border-t [&_td]:border-b [&_td]:border-[#7dbbe9]'
    : 'bg-(--xs-red-bg) [&_td]:border-t [&_td]:border-b [&_td]:border-[#dfa3b3]'

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <div className="overflow-x-auto">
          <table className="mb-0 w-full">
            <thead>
              <tr>
                <th className="relative w-[43.23529%] bg-(--xxs-text-color) px-1.5 py-[5px] pl-3 text-left text-[11px] leading-[14px] font-medium whitespace-nowrap text-(--header-primary) shadow-[inset_0_2px_0_rgba(var(--black-rgb),0.1)] after:absolute after:top-1/2 after:right-0 after:h-1/2 after:w-px after:-translate-y-1/2 after:rounded-[1px] after:content-['']">
                  {isBack
                    ? t('odds.backBetFor', 'Back (Bet For)')
                    : t('odds.layBetAgainst', 'Lay (Bet Against)')}
                </th>
                <th className="relative w-[16.70588%] bg-(--xxs-text-color) px-1.5 py-[5px] text-center text-[11px] leading-[14px] font-medium whitespace-nowrap text-(--header-primary) shadow-[inset_0_2px_0_rgba(var(--black-rgb),0.1)] after:absolute after:top-1/2 after:right-0 after:h-1/2 after:w-px after:-translate-y-1/2 after:rounded-[1px] after:content-['']">
                  {t('common.odds', 'Odds')}
                </th>
                <th className="relative w-[16.70588%] bg-(--xxs-text-color) px-1.5 py-[5px] text-center text-[11px] leading-[14px] font-medium whitespace-nowrap text-(--header-primary) shadow-[inset_0_2px_0_rgba(var(--black-rgb),0.1)] after:absolute after:top-1/2 after:right-0 after:h-1/2 after:w-px after:-translate-y-1/2 after:rounded-[1px] after:content-['']">
                  {t('common.stake', 'Stake')}
                </th>
                <th className="relative w-[24.11765%] bg-(--xxs-text-color) px-1.5 py-[5px] pr-3 text-right text-[11px] leading-[14px] font-medium whitespace-nowrap text-(--header-primary) shadow-[inset_0_2px_0_rgba(var(--black-rgb),0.1)] after:absolute after:top-1/2 after:right-0 after:h-1/2 after:w-px after:-translate-y-1/2 after:rounded-[1px] after:content-['']">
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
                  className="overflow-hidden bg-transparent px-1.5 py-1 align-middle text-[12px] font-medium"
                >
                  <h6 className="relative mb-0 pl-4 text-[11px] before:absolute before:top-0.5 before:left-0.5 before:h-2.5 before:w-2.5 before:rounded-full before:bg-(--pagination-color) before:text-[44px] before:content-[''] after:absolute after:top-1 after:left-1 after:h-1.5 after:w-1.5 after:rounded-full after:bg-(--light-xs-green) after:text-[44px] after:content-['']">
                    {activeMatchOdd?.eventTitle}
                  </h6>
                </td>
              </tr>
              <tr className={rowBg}>
                <td className="w-[43.23529%] overflow-hidden bg-transparent px-1.5 py-1 align-middle text-[11px] font-medium">
                  <div className="flex items-center">
                    <CrossIcon
                      className="[&_svg]:text- mr-1 flex h-[15px] items-center [&_svg]:h-2.5 [&_svg]:w-2.5 [&_svg]:rounded-[3px] [&_svg]:bg-red-600 [&_svg]:p-0.5"
                    />
                    <div className="ml-1 flex flex-col">
                      <span className="m-0 inline-block pr-1 whitespace-nowrap">
                        {activeMatchOdd?.selectionName}
                      </span>
                      <p className="mb-0 text-[11px] opacity-50">
                        {activeMatchOdd?.marketDisplayName ||
                          activeMatchOdd?.marketName}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="w-[14.70588%] overflow-hidden bg-transparent px-1.5 py-1 align-middle text-[12px] font-medium">
                  <div className="flex justify-end">
                    <input
                      type="number"
                      className="h-[22px] w-full rounded border-0 bg-white pr-0 text-right text-[12px] shadow-[inset_0_1px_0_rgba(0,0,0,0.5)] [&::-webkit-inner-spin-button]:mr-0 [&::-webkit-inner-spin-button]:ml-[5px] [&::-webkit-inner-spin-button]:opacity-100"
                      step="0.01"
                      min={0}
                      value={odds}
                      onChange={(e) => setOdds(e.target.value)}
                      onKeyDown={(e) => e.preventDefault()}
                    />
                  </div>
                </td>
                <td className="w-[14.70588%] overflow-hidden bg-transparent px-1.5 py-1 align-middle text-[12px] font-medium">
                  <div className="flex justify-end">
                    <input
                      type="number"
                      className="h-[22px] w-full rounded border-0 bg-white pr-0 text-right text-[12px] shadow-[inset_0_1px_0_rgba(0,0,0,0.5)] [&::-webkit-inner-spin-button]:mr-0 [&::-webkit-inner-spin-button]:ml-[5px] [&::-webkit-inner-spin-button]:opacity-100"
                      min={0}
                      value={stake}
                      onChange={(e) => setStake(e.target.value)}
                    />
                  </div>
                </td>
                <td className="w-[24.11765%] overflow-hidden bg-transparent px-1.5 py-1 pr-3 align-middle text-[12px] font-medium">
                  <p className="mb-0 text-right text-[11px]">
                    {formatNumber(profitLiability)}
                  </p>
                </td>
              </tr>
              <tr className={stakeRowBg}>
                <td
                  colSpan={4}
                  className="overflow-hidden px-1.5 py-1 align-middle text-[12px] font-medium"
                >
                  <div className="flex justify-between">
                    {availableStake.map((stakeValue) => (
                      <button
                        key={stakeValue}
                        type="button"
                        className="mx-0.5 mt-0.5 mb-[1px] w-1/6 cursor-pointer rounded border border-[#bbb] bg-gradient-to-t from-[#f3f3f3] to-[#fbfbfb] p-0 text-[11px] leading-[18px] font-normal text-[#1e1e1e] min-[768px]:max-[1199px]:w-auto min-[768px]:max-[1199px]:px-2 min-[768px]:max-[1199px]:py-0.5"
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
                  className="overflow-hidden px-1.5 py-1 align-middle text-[12px] font-medium"
                >
                  <p className="mb-0 text-right text-[11px]">
                    Min Bet : <b>1</b>
                  </p>
                </td>
              </tr>
              <tr>
                <td
                  colSpan={4}
                  className="overflow-hidden bg-white px-1.5 py-1 align-middle text-[12px] font-medium"
                >
                  <p className="my-[5px] text-right text-[12px] text-[#777]">
                    {t('common.liability', 'Liability')}{' '}
                    <span className="text-[11px] text-(--red)">
                      {formatNumber(Math.abs(liability))}
                    </span>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mx-2 flex justify-between">
          <button
            type="button"
            className={cx(
              'btn btn-white mr-2 w-full max-w-[200px] cursor-pointer',
              submitting && 'cursor-not-allowed opacity-60'
            )}
            onClick={onCancelAll}
            disabled={submitting}
          >
            {t('common.cancelAll', 'Cancel All')}
          </button>
          <button
            type="button"
            className={cx(
              'btn btn-primary w-full max-w-[200px] cursor-pointer',
              isYellowTheme &&
                '!border-(--coffee) !bg-[image:linear-gradient(0deg,var(--md-primary-yellow)_0%,#ffa10c_100%)] !text-(--dark)',
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
        <div className="mt-[7px] mb-[10px] border-t border-[#e0e6e6] pt-[3px] pl-[5px]">
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
  const dispatch = useDispatch()
  const activeMatchOdd = useSelector(selectActiveBetSlip)
  const stakesData = useSelector(selectStakesData)
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const isPlacingBet = useSelector(selectIsPlacingBet)
  const placingSelectionId = useSelector(selectPlacingSelectionId)
  // Match-odds bets surface their FancyProgress feedback here (not inline on
  // the row). Picks up the most recent MATCH_ODDS entry from the global map.
  const matchOddsFancyProgress = useSelector(selectMatchOddsFancyProgress)

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
      <h2 className="relative m-0 bg-linear-to-b from-(--xts-blue) to-(--xts-blue) shadow-[0_2px_0_rgba(var(--white-rgb),0.1)]">
        <button
          type="button"
          className={cx(
            'relative flex w-full items-center justify-between bg-[length:auto_100%] bg-right bg-no-repeat px-2.5 text-left text-xs leading-[25px] text-white shadow-[0_2px_0_rgba(var(--white-rgb),0.1)] transition-[background-image] duration-200',
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
              className="absolute inset-0 z-10 flex cursor-wait items-center justify-center bg-white/70 backdrop-blur-[1px]"
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
          {matchOddsFancyProgress && (
            <FancyProgress
              config={matchOddsFancyProgress.config}
              onClose={() =>
                dispatch(clearFancyProgress(matchOddsFancyProgress.selectionId))
              }
            />
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
