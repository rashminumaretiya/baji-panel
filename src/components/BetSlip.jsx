import { useState } from 'react'
import Collapse from 'react-bootstrap/Collapse'
import { useSelector } from 'react-redux'
import { selectIsYellowTheme } from '../store/slices/commonSlice.js'
import { selectStakesData } from '../store/slices/authSlice.js'
import { selectActiveBetSlip } from '../store/slices/betSlipSlice.js'
import SvgIcon from './SvgIcon.jsx'
import './betSlip.scss'

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
    <p className="text-center mt-3 no-betslip">
      Click on the odds to add selections to the betslip.
    </p>
  )
}

function BetSlipForm({ activeMatchOdd, availableStake, isYellowTheme }) {
  const isBack = activeMatchOdd?.betType === 'BACK'
  const [odds, setOdds] = useState(activeMatchOdd?.odd ?? '')
  const [stake, setStake] = useState('')
  const [confirmBets, setConfirmBets] = useState(false)
  const [preExposureLiability, setPreExposureLiability] = useState(0)

  const profitLiability = Number(stake) * Number(odds) - Number(stake) || 0

  const onStakeClick = (value) => {
    setStake(String(value))
  }

  return (
    <div className="bet-slip-wrapper">
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>{isBack ? 'Back (Bet For)' : 'Lay (Bet Against)'}</th>
                <th className="text-center">Odds</th>
                <th className="text-center">Stake</th>
                <th className="text-end">{isBack ? 'Profit' : 'Liability'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4}>
                  <h6>{activeMatchOdd?.eventTitle}</h6>
                </td>
              </tr>
              <tr
                className={cx(
                  'match-odds',
                  isBack ? 'bet-blue-md' : 'bet-red-md'
                )}
              >
                <td>
                  <div className="d-flex align-items-center">
                    <SvgIcon name="cross" className="me-md-1" />
                    <div className="d-flex flex-wrap ms-1">
                      <span className="m-0 w-nowrap d-inline-block pe-1">
                        {activeMatchOdd?.selectionName}
                      </span>
                      <p className="mt-ods">{activeMatchOdd?.marketName}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="d-flex justify-content-end">
                    <input
                      type="number"
                      className="form-control"
                      step="0.01"
                      min={0}
                      value={odds}
                      onChange={(e) => setOdds(e.target.value)}
                      onKeyDown={(e) => e.preventDefault()}
                    />
                  </div>
                </td>
                <td>
                  <div className="d-flex justify-content-end">
                    <input
                      type="number"
                      className="form-control"
                      min={0}
                      value={stake}
                      onChange={(e) => setStake(e.target.value)}
                    />
                  </div>
                </td>
                <td>
                  <p className="text-end">{formatNumber(profitLiability)}</p>
                </td>
              </tr>
              <tr
                className={cx(
                  'col-stake_list',
                  isBack ? 'lightest-blue' : 'light-pink'
                )}
              >
                <td colSpan={4}>
                  <div className="d-flex stake justify-content-between">
                    {availableStake.map((stakeValue) => (
                      <button
                        key={stakeValue}
                        type="button"
                        className="btn"
                        onClick={() => onStakeClick(stakeValue)}
                      >
                        {stakeValue}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
              <tr
                className={cx(
                  'keep-option',
                  isBack ? 'lightest-blue' : 'light-pink'
                )}
              >
                <td colSpan={4}>
                  <p className="text-end">
                    Min Bet : <b>1</b>
                  </p>
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="bg-white">
                  <p className="text-end liability">
                    Liability{' '}
                    <span className="text-danger">
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
        <div className="d-flex justify-content-between button-wrapper mx-2">
          <button type="button" className="btn btn-white me-2">
            Cancel All
          </button>
          <button
            type="button"
            className={cx(
              'btn btn-primary',
              isYellowTheme && 'yellow-btn',
              isYellowTheme && !stake && 'disabled'
            )}
          >
            Place Bet
          </button>
        </div>
        <div className="confirm-bets-checkbox">
          <input
            id="confirmBets"
            type="checkbox"
            checked={confirmBets}
            onChange={(e) => setConfirmBets(e.target.checked)}
          />
          <label
            className="confirm-bets ms-1 d-inline-block cursor-pointer"
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
    <div className="accordion">
      <div className="accordion-item mb-0">
        <h2 className="accordion-header">
          <button
            type="button"
            className={cx('accordion-button', isCollapsed && 'collapsed')}
            aria-expanded={!isCollapsed}
            onClick={() => setIsCollapsed((prev) => !prev)}
          >
            Bet Slip
          </button>
        </h2>
        <Collapse in={!isCollapsed}>
          <div className="accordion-collapse">
            <div className="accordion-body">
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
  )
}
