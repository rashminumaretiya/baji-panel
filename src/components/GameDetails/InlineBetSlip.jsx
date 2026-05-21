import { useState } from 'react'
import { useIsMobile } from '../../hooks/useMediaQuery.js'
import './inline-bet-slip.scss'
import './stake-buttons.scss'

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

function StakeButtons({ isMobile, onStakeClick }) {
  const stakes = isMobile ? DEFAULT_STAKES.slice(0, 5) : DEFAULT_STAKES
  return (
    <div
      className={`d-flex justify-content-end ${isMobile ? 'mobile-stake' : 'stake'}`}
    >
      {stakes.map((stake, idx) => (
        <button
          key={`${stake}-${idx}`}
          type="button"
          className="btn"
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

function Keypad({ onValueChanged }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', '.']
  return (
    <div className="keypad-wrapper row g-0 mx-0">
      <div className="col-10 key-wrapper">
        <div className="row g-0">
          {keys.map((key) => (
            <div key={key} className="col-2 key-out">
              <button
                type="button"
                className="btn"
                onClick={() => onValueChanged(key)}
              >
                {key}
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="col-2">
        <button
          type="button"
          className="btn d-flex h-100 align-items-center justify-content-center"
          onClick={() => onValueChanged('backspace')}
        >
          <i>{BackspaceIcon}</i>
        </button>
      </div>
    </div>
  )
}

export default function InlineBetSlip({
  betSlipDetails,
  onChange,
  onCancel,
  onPlaceBet,
}) {
  const isMobile = useIsMobile()
  const [isMatchChecked, setIsMatchChecked] = useState(false)

  const marketData = `acceptOdds-${betSlipDetails?.marketName || 'MARKET'}-${
    betSlipDetails?.runnerId ?? ''
  }`

  const betTypeClass =
    betSlipDetails?.type === 'BACK' || betSlipDetails?.type === 'YES'
      ? 'bet-blue-md'
      : 'bet-red-md'

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
    return (
      <table className={`table m-0 mobile-betslip-wrapper ${betTypeClass}`}>
        <tbody>
          <tr>
            <td colSpan={2} className="bg-transparent bet-box">
              <div className="odd-stake align-items-end d-flex justify-content-around">
                <div className="text-center single-bet-box">
                  {isSportsBook && <p className="min-bet">Odds</p>}
                  <div className="counter">
                    {isMatchOdds ? (
                      <>
                        <button
                          type="button"
                          className="btn dec"
                          onClick={() => updateField('odds', 'DEC')}
                        >
                          {MinusIcon}
                        </button>
                        <input
                          type="text"
                          className="form-control"
                          value={betSlipDetails?.odds ?? ''}
                          onKeyDown={(e) => e.preventDefault()}
                          inputMode="none"
                          readOnly
                        />
                        <button
                          type="button"
                          className="btn inc"
                          onClick={() => updateField('odds', 'INC')}
                        >
                          {PlusIcon}
                        </button>
                      </>
                    ) : (
                      <p className="m-0 d-flex align-items-center justify-content-center">
                        {oddDisplay}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-center single-bet-box">
                  <p className="min-bet">
                    Min Bet : {betSlipDetails?.min || 1}
                  </p>
                  <div className="counter min-bet-counter">
                    <button
                      type="button"
                      className="btn dec"
                      onClick={() => updateField('stake', 'DEC')}
                    >
                      {MinusIcon}
                    </button>
                    <input
                      type="text"
                      className="form-control"
                      inputMode="none"
                      min={0}
                      value={betSlipDetails?.stake ?? ''}
                      onChange={(e) => updateStake(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn inc"
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
            <td colSpan={2} className="p-0 bg-transparent stake-row">
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
            <td colSpan={2} className="bg-transparent betslip-btn-main">
              <div className="d-flex justify-content-around button-wrapper">
                <button
                  type="button"
                  className="btn btn-cancel flex-1 py-2"
                  onClick={onCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-place-bet py-2"
                  onClick={() => onPlaceBet?.(betSlipDetails)}
                >
                  Place Bet
                </button>
              </div>
            </td>
          </tr>

          {showAcceptOdds && (
            <tr className="accept-bet">
              <td colSpan={2}>
                <div className="d-flex align-items-center h-100">
                  <div
                    className={`cstm-checkbox${isMatchChecked ? ' checked' : ''}`}
                  >
                    <i className="chekIcon">{CheckIcon}</i>
                    <input
                      id={marketData}
                      type="checkbox"
                      checked={isMatchChecked}
                      onChange={() => setIsMatchChecked((v) => !v)}
                    />
                  </div>
                  <label className="text-black w-nowrap" htmlFor={marketData}>
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
    <div className="table-responsive">
      <table className="table m-0 inline-betslip-wrapper">
        <tbody>
          <tr>
            <td className={betTypeClass}>
              <div className="d-flex justify-content-end align-items-center">
                <div className="accept-odds me-auto">
                  <input id={marketData} type="checkbox" />
                  <label
                    className="ms-1 text-black w-nowrap"
                    htmlFor={marketData}
                  >
                    Accept Any Odds
                  </label>
                </div>

                <button
                  type="button"
                  className="btn btn-cancel ms-2"
                  onClick={onCancel}
                >
                  Cancel
                </button>

                <div className="d-flex match-odds ms-2">
                  <div
                    className={`form-control d-flex flex-column justify-content-center me-2 ${betTypeClass}`}
                  >
                    <p className="m-0 text-end">{betSlipDetails?.odds || 0}</p>
                    {isFancy && (
                      <small className="text-end">
                        {betSlipDetails?.size || 0}
                      </small>
                    )}
                  </div>

                  <input
                    type="number"
                    className="form-control text-end me-2"
                    min={0}
                    value={betSlipDetails?.stake ?? ''}
                    onChange={(e) => updateStake(e.target.value)}
                    inputMode="none"
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-primary place-order-btn"
                  onClick={() => onPlaceBet?.(betSlipDetails)}
                >
                  Place Bet
                </button>
              </div>
            </td>
          </tr>

          <tr>
            <td className={`stake-wrapper ${betTypeClass}`}>
              <StakeButtons isMobile={false} onStakeClick={updateStake} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
