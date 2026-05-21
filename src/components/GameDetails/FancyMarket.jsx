import { Fragment, useMemo, useState } from 'react'
import { useIsMobile } from '../../hooks/useMediaQuery.js'
import MarketTab from './MarketTab.jsx'
import InlineBetSlip from './InlineBetSlip.jsx'
import './fancy-market.scss'

const ALL_TAB = 'All'

const InfoIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
    />
  </svg>
)

const CloseIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
    />
  </svg>
)

function titleCase(s) {
  return (s || '').charAt(0).toUpperCase() + (s || '').slice(1).toLowerCase()
}

function formatNumber(value, fractionDigits = 2) {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

function FancyRow({
  item,
  colSpan,
  isMobile,
  marketSetting,
  exposureMap,
  fancyInfo,
  setFancyInfo,
  betSlipDetails,
  selectOdd,
  bookFancy,
  onBetSlipChange,
  onBetSlipCancel,
  onBetSlipPlaceBet,
}) {
  const isSuspended =
    marketSetting?.isSuspended ||
    ['suspended', 'ball running'].includes((item.GameStatus || '').toLowerCase())
  const isInlineBetSlip = !isSuspended && item.SelectionId === betSlipDetails?.runnerId
  const exposure = exposureMap.get(item.SelectionId)?.exposure ?? 0
  const exposureClass = exposure > 0 ? 'profit' : 'liability'
  const actualExposure =
    exposure < 0 ? `(${formatNumber(-1 * exposure)})` : formatNumber(exposure)
  const dataTitle = titleCase(marketSetting?.isSuspended ? 'Suspended' : item.GameStatus)

  return (
    <>
      {isMobile && (
        <tr className="mobile-runner-row">
          <td colSpan={3}>
            <div className="mobile-runner-header">
              <span className="runner-name">{item.RunnerName}</span>
              <div className="mobile-runner-meta">
                <span className="warning-wrapper d-inline-block">
                  <i
                    onClick={() =>
                      setFancyInfo(fancyInfo === item.SelectionId ? null : item.SelectionId)
                    }
                  >
                    {InfoIcon}
                  </i>
                  {fancyInfo === item.SelectionId && (
                    <div className="fancy_info-popup">
                      <div>
                        <p>Min / Max</p>
                        <span>
                          {item.min} / {item.max}
                        </span>
                      </div>
                      <i
                        onClick={() =>
                          setFancyInfo(fancyInfo === item.SelectionId ? null : item.SelectionId)
                        }
                      >
                        {CloseIcon}
                      </i>
                    </div>
                  )}
                </span>
              </div>
            </div>
          </td>
        </tr>
      )}

      <tr className={isSuspended ? 'suspended' : undefined}>
        {!isMobile ? (
          <td>
            <div className="runner-cell">
              <span className="runner-name">{item.RunnerName}</span>
              {exposure !== 0 && (
                <div className="runner-actions">
                  <p className={`m-0 exposure ${exposureClass}`}>{actualExposure}</p>
                  <button
                    type="button"
                    className="btn btn-yellow fancy-book"
                    onClick={() => bookFancy(item.SelectionId)}
                  >
                    Book
                  </button>
                </div>
              )}
            </div>
          </td>
        ) : (
          <td className="mobile-exposure-cell">
            <div className="d-flex align-items-center gap-3">
              {exposure !== 0 && (
                <>
                  <p className={`m-0 exposure-val ${exposureClass}`}>{actualExposure}</p>
                  <button
                    type="button"
                    className="btn btn-yellow book-btn"
                    onClick={() => bookFancy(item.SelectionId)}
                  >
                    Book
                  </button>
                </>
              )}
            </div>
          </td>
        )}

        <td colSpan={colSpan} className="p-0 price-cell" data-title={dataTitle}>
          <table className="status-table">
            <tbody>
              <tr>
                <td
                  className="lay price cursor-pointer"
                  onClick={() =>
                    selectOdd({ price: item.LayPrice1, size: item.LaySize1 }, item, 'LAY')
                  }
                >
                  <p className="m-0">{item.LayPrice1}</p>
                  <small>{item.LaySize1}</small>
                </td>
                <td
                  className="back price cursor-pointer"
                  onClick={() =>
                    selectOdd({ price: item.BackPrice1, size: item.BackSize1 }, item, 'BACK')
                  }
                >
                  <p className="m-0">{item.BackPrice1}</p>
                  <small>{item.BackSize1}</small>
                </td>
              </tr>
            </tbody>
          </table>
        </td>

        {!isMobile && (
          <>
            <td>
              <p className="mb-0 min-max">
                Min/Max
                <span className="min-max-value">
                  {item.min} / {item.max}
                </span>
              </p>
            </td>
            <td />
          </>
        )}
      </tr>

      {isInlineBetSlip && (
        <tr>
          <td colSpan={isMobile ? 3 : colSpan === 2 ? 5 : 4} className="p-0">
            <InlineBetSlip
              betSlipDetails={betSlipDetails}
              onChange={(slip) => onBetSlipChange?.(slip)}
              onCancel={() => onBetSlipCancel?.()}
              onPlaceBet={() => onBetSlipPlaceBet?.()}
            />
          </td>
        </tr>
      )}
    </>
  )
}

function FancyTable({ items, noLabel, yesLabel, colSpan, isMobile, ...rowProps }) {
  return (
    <table className="fancy-bet-table w-100">
      <thead>
        <tr>
          <th className="runner-th" />
          <th>{noLabel}</th>
          <th>{yesLabel}</th>
          {!isMobile && (
            <>
              <th />
              <th />
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <Fragment key={item.SelectionId}>
            <FancyRow item={item} colSpan={colSpan ?? 2} isMobile={isMobile} {...rowProps} />
          </Fragment>
        ))}
      </tbody>
    </table>
  )
}

export default function FancyMarket({ fancy = [], marketSetting }) {
  const isMobile = useIsMobile()
  const [betSlipDetails, setBetSlipDetails] = useState(null)
  const [activeTab, setActiveTab] = useState(ALL_TAB)
  const [fancyInfo, setFancyInfo] = useState(null)

  const processed = useMemo(() => {
    const map = new Map()
    const allItems = []
    const oddEvenItems = []
    const regularTypes = new Set(['session', 'fancy1'])

    for (const item of fancy) {
      const gtype = (item.gtype || '').toLowerCase()
      const formatted = titleCase(gtype)
      const enriched = { ...item, formattedGtype: formatted }

      if (gtype === 'oddeven') {
        oddEvenItems.push(enriched)
        continue
      }
      if (!regularTypes.has(gtype)) continue
      if (!map.has(formatted)) map.set(formatted, [])
      map.get(formatted).push(enriched)
      allItems.push(enriched)
    }
    return { map, all: allItems, oddEven: oddEvenItems }
  }, [fancy])

  const tabs = useMemo(() => [ALL_TAB, 'Session', 'Fancy1'], [])

  const filteredFancy = useMemo(() => {
    if (activeTab === ALL_TAB) return processed.all
    return processed.map.get(activeTab) ?? []
  }, [activeTab, processed])

  const exposureMap = useMemo(() => new Map(), [])

  const selectOdd = (odd, item, type) => {
    const isBlocked =
      marketSetting?.isSuspended ||
      ['suspended', 'ball running'].includes((item.GameStatus || '').toLowerCase())
    if (isBlocked || !odd?.price) return
    setBetSlipDetails({
      size: +odd.size || 0,
      odds: +odd.price || 0,
      stake: 0,
      type: type === 'BACK' ? 'YES' : 'NO',
      marketId: item.default_marketId,
      marketName: 'FANCY',
      runnerId: item.SelectionId,
      runnerName: item.RunnerName,
      eventId: String(marketSetting?.eventId || ''),
      eventName: marketSetting?.eventName || '',
      gtype: item.gtype || '',
      min: item.min,
      max: item.max,
    })
  }
  const bookFancy = () => {}

  const rowProps = {
    marketSetting,
    exposureMap,
    fancyInfo,
    setFancyInfo,
    betSlipDetails,
    selectOdd,
    bookFancy,
    onBetSlipChange: setBetSlipDetails,
    onBetSlipCancel: () => setBetSlipDetails(null),
    onBetSlipPlaceBet: () => setBetSlipDetails(null),
  }

  return (
    <div className="fancy-market">
      <MarketTab tabs={tabs} activeTab={activeTab} onActiveTabChange={setActiveTab} />

      <div className="fancy-bet overflow-auto">
        <FancyTable
          items={filteredFancy}
          noLabel="No"
          yesLabel="Yes"
          colSpan={2}
          isMobile={isMobile}
          {...rowProps}
        />
      </div>

      {processed.oddEven.length > 0 && (
        <div className="odd-even-section mt-2">
          <MarketTab tabs={['OddEven']} activeTab="OddEven" onActiveTabChange={() => {}} />
          <FancyTable
            items={processed.oddEven}
            noLabel="Odd"
            yesLabel="Even"
            colSpan={2}
            isMobile={isMobile}
            {...rowProps}
          />
        </div>
      )}
    </div>
  )
}
