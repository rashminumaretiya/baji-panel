import { Fragment, useState } from 'react'
import { useIsMobile } from '../../hooks/useMediaQuery.js'
import InlineBetSlip from './InlineBetSlip.jsx'
import './bookmaker-market.scss'

const EMPTY_EXPOSURE_MAP = new Map()
const DEFAULT_MARKET_SETTING = { min: 0, max: 0, isSuspended: false }

function formatNumber(value, fractionDigits = 0) {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export default function BookmakerMarket({
  bookmakerData = [],
  marketSetting = DEFAULT_MARKET_SETTING,
  exposureMap = EMPTY_EXPOSURE_MAP,
}) {
  const isMobile = useIsMobile()
  const [bookmakerInfo, setBookmakerInfo] = useState(false)
  const [betSlipDetails, setBetSlipDetails] = useState(null)

  const min = marketSetting.min || bookmakerData[0]?.min || 0
  const max = marketSetting.max || bookmakerData[0]?.max || 0

  const backIndexes = isMobile ? [0] : [2, 1, 0]
  const layIndexes = isMobile ? [0] : [0, 1, 2]

  const selectOdd = (bookmaker, odd, type) => {
    if (!odd.price) return
    setBetSlipDetails({
      marketName: 'BOOKMAKER',
      marketId: 'BOOKMAKER',
      runnerId: bookmaker.sid,
      runnerName: bookmaker.nat,
      type,
      odds: odd.price,
      size: odd.size,
      stake: 0,
      min: marketSetting.min || bookmaker.min || 1,
      max: marketSetting.max || bookmaker.max || 0,
    })
  }

  return (
    <div className="bookmaker-market">
      <div className="match-header">
        <div className="d-flex align-items-center justify-content-center">
          <span className="icon-wrapper">
            <img src="/img/svg/pin.svg" alt="" />
          </span>
          <span className="head d-inline-block">
            Bookmaker Market
            <small> | Zero Commission</small>
          </span>
        </div>

        {isMobile ? (
          <span className="warning-wrapper d-inline-block">
            <img
              src="/img/svg/info.svg"
              alt="info"
              onClick={() => setBookmakerInfo((v) => !v)}
            />
            {bookmakerInfo && (
              <div className="fancy_info-popup">
                <div>
                  <p>Min / Max</p>
                  <span>
                    {min} / {max}
                  </span>
                </div>
                <i
                  onClick={() => setBookmakerInfo((v) => !v)}
                  role="button"
                  aria-label="Close"
                >
                  ×
                </i>
              </div>
            )}
          </span>
        ) : (
          <div className="d-flex align-items-center justify-content-center min-max-details">
            <span className="chip">Min</span>
            <span className="d-inline-block ms-1">{min}</span>
            <span className="chip ms-2 d-inline-block">Max</span>
            <span className="d-inline-block ms-1">{max}</span>
          </div>
        )}
      </div>

      <div className="match-odds table-responsive">
        <table className="match-odds-table w-100">
          <thead>
            <tr>
              <th />
              {!isMobile && <th colSpan={2} />}
              <th className="pb-0" style={{ textAlign: 'center' }}>
                Back
              </th>
              <th className="pb-0" style={{ textAlign: 'center' }}>
                Lay
              </th>
              {!isMobile && <th colSpan={2} />}
            </tr>
          </thead>
          <tbody>
            {bookmakerData.map((bookmaker) => {
              const isSuspended =
                marketSetting.isSuspended ||
                ['SUSPENDED', 'BALL RUNNING'].includes(bookmaker.s)
              const dataTitle = marketSetting.isSuspended
                ? 'SUSPENDED'
                : bookmaker.s

              const runnerExposure = exposureMap.get(bookmaker.sid)
              const exposure = runnerExposure?.exposure ?? 0
              const preExposure = runnerExposure?.preExposure ?? 0
              const showArrow = runnerExposure?.showArrow ?? false
              const exposureClass = exposure > 0 ? 'profit' : 'liability'
              const arrowClass =
                preExposure > 0 ? 'profit-arrow' : 'liability-arrow'
              const preExposureClass = preExposure > 0 ? 'profit' : 'liability'

              const isInlineBetSlip =
                !isSuspended && betSlipDetails?.runnerId === bookmaker.sid

              return (
                <Fragment key={bookmaker.sid}>
                  <tr
                    className={isSuspended ? 'suspended' : undefined}
                    data-title={dataTitle}
                  >
                    <td className="runner w-nowrap">
                      <div className="d-flex flex-column">
                        <p className="mb-1 runner-name">{bookmaker.nat}</p>
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
                      const odd = {
                        price: +(bookmaker[`b${i + 1}`] ?? 0),
                        size: +(bookmaker[`bs${i + 1}`] ?? 0),
                      }
                      const cls =
                        'cursor-pointer price ' +
                        (i === 0 ? 'back' : `back${i}`)
                      return (
                        <td
                          key={`back-${i}`}
                          className={cls}
                          onClick={() => selectOdd(bookmaker, odd, 'BACK')}
                        >
                          <p className="m-0">{odd.price}</p>
                        </td>
                      )
                    })}

                    {layIndexes.map((i) => {
                      const odd = {
                        price: +(bookmaker[`l${i + 1}`] ?? 0),
                        size: +(bookmaker[`ls${i + 1}`] ?? 0),
                      }
                      const cls =
                        'cursor-pointer price ' + (i === 0 ? 'lay' : `lay${i}`)
                      return (
                        <td
                          key={`lay-${i}`}
                          className={cls}
                          onClick={() => selectOdd(bookmaker, odd, 'LAY')}
                        >
                          <p className="m-0">{odd.price}</p>
                        </td>
                      )
                    })}
                  </tr>
                  {isInlineBetSlip && (
                    <tr key={`${bookmaker.sid}-betslip`}>
                      <td colSpan={7} className="p-0">
                        <InlineBetSlip
                          betSlipDetails={betSlipDetails}
                          onChange={setBetSlipDetails}
                          onCancel={() => setBetSlipDetails(null)}
                          onPlaceBet={() => setBetSlipDetails(null)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
