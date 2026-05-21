import { useState } from 'react'
import { useIsMobile } from '../../hooks/useMediaQuery.js'
import './match-odd-market.scss'

const defaultOdd = { price: 0, size: 0 }
const EMPTY_EXPOSURE_MAP = new Map()
const DEFAULT_MARKET_SETTING = {
  min: 0,
  max: 0,
  isSuspended: false,
  isRacing: false,
  pbuLimit: 0,
}

const isAuthenticated = true
const isStreamAvailable = true

function formatNumber(value, fractionDigits = 0) {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

function formatStartTime(date) {
  if (date == null) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}

function isPriceGreaterThanOdd(price) {
  if (!price) return true
  return false
}

export default function MatchOddMarket({
  matchOdds,
  marketSetting = DEFAULT_MARKET_SETTING,
  exposureMap = EMPTY_EXPOSURE_MAP,
}) {
  const isMobile = useIsMobile()
  const [infoPopupOpen, setInfoPopupOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  if (!matchOdds) return null

  const backIndexes = isMobile ? [0] : [2, 1, 0]
  const layIndexes = isMobile ? [0] : [0, 1, 2]

  const isOddBgLine = (odd) =>
    !odd?.price ||
    marketSetting.isSuspended ||
    matchOdds.status === 'SUSPENDED' ||
    (matchOdds.totalMatched ?? 0) < (marketSetting.pbuLimit ?? 0) ||
    isPriceGreaterThanOdd(odd?.price)

  return (
    <div style={{ marginBottom: '30px' }}>
      <div className="market-type d-flex justify-content-between position-relative">
        <div className="d-flex align-items-center">
          <span className="match-odds-tab">
            {marketSetting.isRacing
              ? 'Match Odds'
              : matchOdds.marketName || 'Match Odds'}
          </span>
          {!isMobile && (
            <span className={matchOdds.inplay ? 'inplay' : 'not-inplay'}>
              <i className="time">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <mask
                    id="match-odds-time-mask"
                    style={{ maskType: 'alpha' }}
                    maskUnits="userSpaceOnUse"
                    x="1"
                    y="1"
                    width="14"
                    height="14"
                  >
                    <rect x="1.33789" y="1.33301" width="13.3333" height="13.3333" fill="#D9D9D9" />
                  </mask>
                  <g mask="url(#match-odds-time-mask)">
                    <path
                      d="M8.00456 13.5553C7.31011 13.5553 6.65965 13.4234 6.05317 13.1595C5.44669 12.8956 4.91891 12.5391 4.46984 12.0901C4.02076 11.641 3.66428 11.1132 3.40039 10.5067C3.1365 9.90025 3.00456 9.24978 3.00456 8.55534C3.00456 7.86089 3.1365 7.21043 3.40039 6.60395C3.66428 5.99747 4.02076 5.46969 4.46984 5.02062C4.91891 4.57154 5.44669 4.21506 6.05317 3.95117C6.65965 3.68728 7.31011 3.55534 8.00456 3.55534C8.699 3.55534 9.34947 3.68728 9.95595 3.95117C10.5624 4.21506 11.0902 4.57154 11.5393 5.02062C11.9884 5.46969 12.3448 5.99747 12.6087 6.60395C12.8726 7.21043 13.0046 7.86089 13.0046 8.55534C13.0046 9.24978 12.8726 9.90025 12.6087 10.5067C12.3448 11.1132 11.9884 11.641 11.5393 12.0901C11.0902 12.5391 10.5624 12.8956 9.95595 13.1595C9.34947 13.4234 8.699 13.5553 8.00456 13.5553ZM9.56011 10.8887L10.3379 10.1109L8.56011 8.33312V5.77756H7.449V8.77756L9.56011 10.8887ZM4.449 2.63867L5.22678 3.41645L2.86567 5.77756L2.08789 4.99978L4.449 2.63867ZM11.5601 2.63867L13.9212 4.99978L13.1434 5.77756L10.7823 3.41645L11.5601 2.63867ZM8.00456 12.4442C9.08789 12.4442 10.0069 12.0669 10.7615 11.3123C11.5161 10.5577 11.8934 9.63867 11.8934 8.55534C11.8934 7.47201 11.5161 6.55302 10.7615 5.79839C10.0069 5.04376 9.08789 4.66645 8.00456 4.66645C6.92122 4.66645 6.00224 5.04376 5.24761 5.79839C4.49298 6.55302 4.11567 7.47201 4.11567 8.55534C4.11567 9.63867 4.49298 10.5577 5.24761 11.3123C6.00224 12.0669 6.92122 12.4442 8.00456 12.4442Z"
                      fill="currentColor"
                    />
                  </g>
                </svg>
              </i>
              <span className="d-inline-block align-middle">
                {matchOdds.inplay
                  ? 'In-Play'
                  : formatStartTime(matchOdds.marketStartTime)}
              </span>
            </span>
          )}
        </div>
        <div className="d-md-flex d-none text-black min-max-odds">
          <p className="mb-0">
            Min
            <small className="me-1">{marketSetting.min}</small>
          </p>
          <p className="mb-0">
            Max
            <small>{marketSetting.max}</small>
          </p>
        </div>
        <div className="d-md-flex d-none align-items-center">
          {isAuthenticated && isStreamAvailable && matchOdds.inplay && (
            <button
              type="button"
              className={`live-btn me-2${isPlaying ? ' playing' : ''}`}
              onClick={() => setIsPlaying((v) => !v)}
            >
              <i>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 21 19"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M4 0h13a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4zm3 17h7v2H7v-2zM4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4zm11 6.024L8 12V4l7 4.024z"
                  />
                </svg>
              </i>
              Live
            </button>
          )}
          <div className="matched d-flex">
            <p className="m-0">Matched</p>
            <span className="ms-1 fw-bolder"> PBU </span>
            <span className="ms-1 me-2 fw-bolder">
              {formatNumber(matchOdds.totalMatched || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="match-odds">
        <table className="match-odds-table w-100">
          <thead>
            <tr>
              {isMobile ? (
                <>
                  <th className="text-start w-nowrap">
                    <div className="mb-data d-flex align-items-center">
                      <div className="bet-limit">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          onClick={() => setInfoPopupOpen((v) => !v)}
                          aria-hidden="true"
                        >
                          <path
                            fill="currentColor"
                            d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                          />
                        </svg>
                        {infoPopupOpen && (
                          <div className="fancy_info-popup">
                            <i
                              onClick={() => setInfoPopupOpen((v) => !v)}
                              aria-label="Close"
                              role="button"
                            >
                              ×
                            </i>
                            <div>
                              <p>Max</p>
                              <span>{marketSetting.max}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <i className="a-depth" />
                      <div className="content">
                        <p className="mb-0">Matched</p>
                        <span>PBU</span>
                        <span className="p-1">{matchOdds.totalMatched}</span>
                      </div>
                    </div>
                  </th>
                  <th className="text-center back">Back</th>
                  <th className="text-center lay">Lay</th>
                </>
              ) : (
                <>
                  <th className="text-start w-nowrap refer_only">
                    {matchOdds.numberOfRunners} Selection
                  </th>
                  <th colSpan={2} className="text-start">
                    101.7%
                  </th>
                  <th className="pb-0">
                    <p className="text-center back">Back All</p>
                  </th>
                  <th className="pb-0">
                    <p className="text-center lay">Lay All</p>
                  </th>
                  <th colSpan={2} className="text-end">
                    97.7%
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {(matchOdds.runners ?? []).map((runner) => {
              const runnerExposure = exposureMap.get(+runner.selectionId)
              const exposure = runnerExposure?.exposure ?? 0
              const preExposure = runnerExposure?.preExposure ?? 0
              const showArrow = runnerExposure?.showArrow ?? false
              const exposureClass = exposure > 0 ? 'profit' : 'liability'
              const arrowClass =
                preExposure > 0 ? 'profit-arrow' : 'liability-arrow'
              const preExposureClass = preExposure > 0 ? 'profit' : 'liability'

              return (
                <tr key={runner.selectionId}>
                  <td className="runner w-nowrap">
                    <div className="d-flex flex-column">
                      <p className="mb-1 runner-name">
                        <i className="chart d-md-inline-block" />
                        {runner.runnerName}
                      </p>
                      <div className="d-flex align-items-center">
                        {exposure !== undefined &&
                          exposure !== null &&
                          exposure !== 0 && (
                            <span className={exposureClass}>
                              {formatNumber(
                                exposure >= 0 ? exposure : -1 * exposure,
                                2
                              )}
                            </span>
                          )}
                        {showArrow &&
                          preExposure !== undefined &&
                          preExposure !== null && (
                            <>
                              <span className={arrowClass} aria-hidden="true">
                                →
                              </span>
                              <span className={preExposureClass}>
                                {formatNumber(
                                  preExposure >= 0
                                    ? preExposure
                                    : -1 * preExposure,
                                  2
                                )}
                              </span>
                            </>
                          )}
                      </div>
                    </div>
                  </td>

                  {backIndexes.map((i) => {
                    const odd = runner.ex?.availableToBack?.[i] || defaultOdd
                    const bgLine = isOddBgLine(odd)
                    const cls =
                      'cursor-pointer price ' +
                      (i === 0 ? 'back' : `back${i}`) +
                      (bgLine ? ' bg-line' : '')
                    return (
                      <td key={`back-${i}`} className={cls}>
                        <p className="m-0">{odd.price}</p>
                        <span>{odd.size}</span>
                      </td>
                    )
                  })}

                  {layIndexes.map((i) => {
                    const odd = runner.ex?.availableToLay?.[i] || defaultOdd
                    const bgLine = isOddBgLine(odd)
                    const cls =
                      'cursor-pointer suspend-hover price ' +
                      (i === 0 ? 'lay' : `lay${i}`) +
                      (bgLine ? ' bg-line' : '')
                    return (
                      <td key={`lay-${i}`} className={cls}>
                        <p className="m-0">{odd.price}</p>
                        <span>{odd.size}</span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
