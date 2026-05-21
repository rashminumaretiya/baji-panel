import { Fragment, useMemo, useState } from 'react'
import MarketTab from './MarketTab.jsx'
import InlineBetSlip from './InlineBetSlip.jsx'
import './sportbook-market.scss'

const SPORTBOOK_TABS = ['All', 'Innings', 'Over', 'Match', 'Players']

const OVER_RE = /\bover\s\d+\b/i
const INNINGS_RE = /\b\d+(st|nd|rd|th)\b/i
const PLAYERS_RE = /[-,]/
const MATCH_RE = /\b(tie|winner|total|top)\b/i

function categorizeSportbook(marketName) {
  if (INNINGS_RE.test(marketName)) return 'Innings'
  if (OVER_RE.test(marketName)) return 'Over'
  if (PLAYERS_RE.test(marketName)) return 'Players'
  if (MATCH_RE.test(marketName)) return 'Match'
  return 'Match'
}

const StarIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
    />
  </svg>
)

const RightArrow = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M10 17l5-5-5-5v10z"
    />
  </svg>
)

function formatNumber(value, fractionDigits = 2) {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export default function SportbookMarket({ sportbooks = [], marketSetting }) {
  const [activeTab, setActiveTab] = useState('All')
  const [collapsedMap, setCollapsedMap] = useState({})
  const [betSlipDetails, setBetSlipDetails] = useState(null)

  const exposureMaps = useMemo(() => new Map(), [])
  const loadingMarketId = null

  const filteredSportbooks = useMemo(() => {
    if (activeTab === 'All') return sportbooks
    return sportbooks.filter((m) => categorizeSportbook(m.market) === activeTab)
  }, [sportbooks, activeTab])

  const toggle = (id) =>
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }))

  const selectOdd = (price, runner, market) => {
    if (!price || marketSetting?.isSuspended || market.status !== '1' || runner?.status !== '1')
      return
    setBetSlipDetails({
      size: 0,
      odds: +price || 0,
      stake: 0,
      type: 'BACK',
      marketId: market.marketId,
      marketName: 'SPORTS_BOOK',
      runnerId: runner.selectionId,
      runnerName: runner.runnerName,
      eventId: String(marketSetting?.eventId || ''),
      eventName: marketSetting?.eventName || '',
    })
  }

  if (!sportbooks.length) {
    return <div className="sportbook-no-data">No sportbook data available.</div>
  }

  return (
    <>
      <MarketTab tabs={SPORTBOOK_TABS} activeTab={activeTab} onActiveTabChange={setActiveTab} />
      <div className="sport-book-main">
        {filteredSportbooks.map((market, i) => {
          if (!market.runners?.length) return null
          const itemId = `item-${i}`
          const isCollapsed = collapsedMap[itemId] === true
          const marketSuspended = marketSetting?.isSuspended || market.status !== '1'
          const marketExpMap = exposureMaps.get(market.marketId)

          return (
            <div key={market.marketId} className="accordion-item mb-2">
              <h2 className="accordion-header">
                <button
                  type="button"
                  className={`accordion-button${isCollapsed ? ' collapsed' : ''}`}
                  onClick={() => toggle(itemId)}
                >
                  <i className="me-1">{StarIcon}</i>
                  <span>{market.market}</span>
                </button>
              </h2>

              {!isCollapsed && (
                <div>
                  <div className="table-responsive">
                    <table
                      className={`table premium-table mb-0${
                        marketSuspended ? ' suspended-row' : ''
                      }`}
                      data-title={marketSuspended ? 'Suspended' : null}
                    >
                      <colgroup>
                        <col />
                        <col style={{ width: '150px' }} />
                        <col style={{ width: '150px' }} />
                      </colgroup>
                      <tbody>
                        {market.runners.map((runner, idx) => {
                          if (!runner) return null
                          const price = runner?.back?.[0]?.price ?? 0
                          const exp = marketExpMap?.get?.(runner.selectionId)
                          const exposure = exp?.exposure ?? 0
                          const preExposure = exp?.preExposure ?? 0
                          const showArrow = exp?.showArrow ?? false
                          const exposureClass = exposure >= 0 ? 'profit' : 'liability'
                          const cellSuspended =
                            market.status === '1' && runner?.status !== '1'
                          const isInlineBetSlip =
                            !cellSuspended &&
                            betSlipDetails?.marketId === market.marketId &&
                            betSlipDetails?.runnerId === runner.selectionId

                          return (
                            <Fragment key={runner?.selectionId ?? idx}>
                              <tr>
                                <td>
                                  <div className="td-wrapper">
                                    {runner?.runnerName && (
                                      <p className="m-0 font-weight-bold">{runner.runnerName}</p>
                                    )}
                                    <div className="d-flex align-items-center">
                                      {exposure !== 0 && (
                                        <span className={exposureClass}>
                                          {formatNumber(
                                            exposure >= 0 ? exposure : -1 * exposure,
                                          )}
                                        </span>
                                      )}
                                      {showArrow && (
                                        <>
                                          <i
                                            className={
                                              preExposure >= 0 ? 'profit-arrow' : 'liability-arrow'
                                            }
                                          >
                                            {RightArrow}
                                          </i>
                                          <span
                                            className={preExposure >= 0 ? 'profit' : 'liability'}
                                          >
                                            {formatNumber(
                                              preExposure >= 0 ? preExposure : -1 * preExposure,
                                            )}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td />
                                <td
                                  className={`value-box text-center align-middle${
                                    cellSuspended ? ' suspended' : ''
                                  }`}
                                  data-title={cellSuspended ? 'Suspended' : null}
                                  onClick={() => selectOdd(price, runner, market)}
                                >
                                  {price ? <span className="cursor-pointer">{price}</span> : null}
                                </td>
                              </tr>

                              {isInlineBetSlip && (
                                <tr>
                                  <td colSpan={3} className="p-0 border-0">
                                    <div className="inline-bet-slip-container">
                                      <InlineBetSlip
                                        betSlipDetails={betSlipDetails}
                                        onChange={setBetSlipDetails}
                                        onCancel={() => setBetSlipDetails(null)}
                                        onPlaceBet={() => setBetSlipDetails(null)}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          )
                        })}

                        {loadingMarketId === market.marketId && (
                          <tr>
                            <td colSpan={3} className="p-0 border-0">
                              <div className="inline-bet-slip-container">Loading...</div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
