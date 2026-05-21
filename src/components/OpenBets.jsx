import { Fragment, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import {
  selectIsMobile,
  selectIsYellowTheme,
} from '../store/slices/commonSlice.js'
import {
  fetchOpenBets,
  selectActiveBetSlip,
  selectOpenBetRefreshTick,
  selectOpenBets,
  setOpenBets,
} from '../store/slices/betSlipSlice.js'
import { selectIsAuthenticated } from '../store/slices/authSlice.js'
import SvgIcon from './SvgIcon.jsx'
import './betSlip.scss'
import './openBets.scss'

const OPEN_BETS_POLL_MS = 15000

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0)
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${s} `
}

function NoOpenBets({ isYellowTheme }) {
  if (isYellowTheme) {
    return (
      <div className="text-center mt-3 no-open-bets yellow-theme d-flex flex-column align-items-center">
        <p>No bets placed</p>
        <p>You have no open bets</p>
      </div>
    )
  }

  return (
    <p className="text-center mt-3 no-open-bets">No open bets available.</p>
  )
}

function BackBetsTable({ openBetsValue, betInfo, timeOrder }) {
  const isFancy = openBetsValue?.event?.type === 'Fancy'
  const isSportsBook = openBetsValue?.event?.type === 'Sports Book'
  const backBets = openBetsValue?.bets?.back ?? []

  if (!backBets.length) return null

  return (
    <table className="table mb-0">
      <thead>
        <tr>
          {isFancy ? (
            <>
              <th colSpan={2}>Yes</th>
              <th className="text-center">Runs/Odds</th>
            </>
          ) : (
            <>
              <th colSpan={2}>Back (Bet For)</th>
              <th className="text-center">Odds</th>
            </>
          )}
          <th className="text-center">Stake</th>
          <th className="text-end truncate">
            {timeOrder ? 'Profit/Liability' : 'Profit'}
          </th>
        </tr>
      </thead>
      <tbody>
        {backBets.map((openBet, index) => (
          <Fragment key={`back-group-${index}`}>
            {betInfo && (
              <tr className="bet-blue-xxs">
                <td colSpan={5} className="text-start">
                  <span>Ref: </span>
                  <span>{formatDateTime(openBet.betPlacedAt)}</span>
                </td>
              </tr>
            )}
            <tr className="bet-blue-xs">
              <td>
                <div>
                  <div className="odd-type m-0 blue-td">
                    <span>
                      {isSportsBook
                        ? openBet.selectedRunnerName
                        : openBet.betType}
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <div className="d-flex flex-column align-items-start text-start">
                  <span className="m-0 open-bet-selection-name">
                    {openBet?.selection?.name}
                  </span>
                  <p className="m-0">{openBet?.event?.type}</p>
                </div>
              </td>
              <td>
                <p className="m-0">
                  {isFancy
                    ? `${openBet.odd}/${openBet.size}`
                    : formatNumber(openBet.odd)}
                </p>
              </td>
              <td>
                <p className="m-0">{formatNumber(openBet.stake)}</p>
              </td>
              <td>
                <p className="m-0 text-end">
                  {formatNumber(openBet.profitLoss)}
                </p>
              </td>
            </tr>
          </Fragment>
        ))}
      </tbody>
    </table>
  )
}

function LayBetsTable({ openBetsValue, betInfo, timeOrder }) {
  const isFancy = openBetsValue?.event?.type === 'Fancy'
  const isSportsBook = openBetsValue?.event?.type === 'Sports Book'
  const layBets = openBetsValue?.bets?.lay ?? []

  if (!layBets.length) return null

  return (
    <table className="table mb-0">
      <thead>
        <tr>
          {isFancy ? (
            <>
              <th colSpan={2}>No</th>
              <th className="text-center">Runs/Odds</th>
            </>
          ) : (
            <>
              <th colSpan={2}>Lay (Bet Against)</th>
              <th className="text-center">Odds</th>
            </>
          )}
          <th className="text-center">Stake</th>
          <th className="text-end truncate">
            {timeOrder ? 'Profit/Liability' : 'Liability'}
          </th>
        </tr>
      </thead>
      <tbody>
        {layBets.map((openBet, index) => (
          <Fragment key={`lay-group-${index}`}>
            {betInfo && (
              <tr className="bet-red-xxs">
                <td colSpan={5} className="text-start">
                  <span>Ref: </span>
                  <span>{formatDateTime(openBet.betPlacedAt)}</span>
                </td>
              </tr>
            )}
            <tr className="bet-red-xs">
              <td>
                <div>
                  <div className="odd-type m-0 light-red">
                    <span>
                      {isSportsBook
                        ? openBet.selectedRunnerName
                        : openBet.betType}
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <div className="d-flex flex-column align-items-start text-start">
                  <span className="m-0 open-bet-selection-name">
                    {openBet?.selection?.name}
                  </span>
                  <p className="m-0">{openBet?.event?.type}</p>
                </div>
              </td>
              <td>
                <p className="m-0">
                  {isFancy
                    ? `${openBet.odd}/${openBet.size}`
                    : formatNumber(openBet.odd)}
                </p>
              </td>
              <td>
                <p className="m-0">{formatNumber(openBet.stake)}</p>
              </td>
              <td>
                <p className="m-0 text-end">
                  {formatNumber(openBet.liability)}
                </p>
              </td>
            </tr>
          </Fragment>
        ))}
      </tbody>
    </table>
  )
}

function OpenBetsListBackLay({
  openBetsValue,
  betInfo,
  timeOrder,
  isOpen,
  isMobile,
  onBetInfoChange,
  onTimeOrderChange,
}) {
  if (!openBetsValue) return null

  return (
    <>
      <h6 className="p-2 m-0">Matched</h6>
      <div
        className={cx(
          'table-responsive',
          isOpen ? 'open-bets-table' : 'with-slip with-multimarket-slip'
        )}
      >
        <BackBetsTable
          openBetsValue={openBetsValue}
          betInfo={betInfo}
          timeOrder={timeOrder}
        />
        <LayBetsTable
          openBetsValue={openBetsValue}
          betInfo={betInfo}
          timeOrder={timeOrder}
        />
      </div>
      {isMobile && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <div className="ms-2 d-flex">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="radioDefault1"
                checked={betInfo}
                onChange={(e) => onBetInfoChange(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="radioDefault1">
                Bet info
              </label>
            </div>
            <div className="form-check ms-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="radioDefault2"
                checked={timeOrder}
                onChange={(e) => onTimeOrderChange(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="radioDefault2">
                Time Order
              </label>
            </div>
          </div>
        </form>
      )}
    </>
  )
}

function OpenBetsDesktop({
  openBetsList,
  isOpen,
  isMobile,
  isYellowTheme,
  onRefresh,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [betInfo, setBetInfo] = useState(false)
  const [timeOrder, setTimeOrder] = useState(false)

  const openBetsValue = openBetsList[selectedIndex] ?? null
  const hasList = openBetsList.length > 0

  return (
    <div className="bet-slip-accordion-container">
      <div className="open-bets-accordion">
        <div className="accordion ">
          <div className="mb-0 accordion-item">
            <div className="d-flex align-items-center open-bets">
              <SvgIcon
                name="refreshIcon"
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={onRefresh}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onRefresh?.()
                  }
                }}
                aria-label="Refresh open bets"
              />
              <h2
                className={cx(
                  'accordion-header w-100',
                  isCollapsed && 'collapsed'
                )}
              >
                <button
                  type="button"
                  className="accordion-button"
                  onClick={() => setIsCollapsed((prev) => !prev)}
                >
                  Open Bets
                </button>
              </h2>
            </div>
            <div
              className={cx(
                'accordion-collapse collapse',
                !isCollapsed && 'show'
              )}
            >
              <div className="accordion-body p-0">
                {hasList ? (
                  <div className="open-bets-wrapper">
                    <div className="py-2 px-1">
                      <select
                        value={selectedIndex}
                        onChange={(e) =>
                          setSelectedIndex(Number(e.target.value))
                        }
                      >
                        {openBetsList.map((openBet, index) => (
                          <option key={index} value={index}>
                            {openBet.displayTitle}
                          </option>
                        ))}
                      </select>
                    </div>
                    <OpenBetsListBackLay
                      openBetsValue={openBetsValue}
                      betInfo={betInfo}
                      timeOrder={timeOrder}
                      isOpen={isOpen}
                      isMobile={isMobile}
                      onBetInfoChange={setBetInfo}
                      onTimeOrderChange={setTimeOrder}
                    />
                  </div>
                ) : (
                  <NoOpenBets isYellowTheme={isYellowTheme} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OpenBetsMobile({ openBetsList, isOpen, isMobile }) {
  const [detailsOpenBets, setDetailsOpenBets] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [betInfo, setBetInfo] = useState(false)
  const [timeOrder, setTimeOrder] = useState(false)
  const isYellowTheme = useSelector(selectIsYellowTheme)

  const openBetsValue = openBetsList[selectedIndex] ?? null
  const hasList = openBetsList.length > 0

  if (detailsOpenBets && openBetsValue) {
    return (
      <div className="open-bets-wrapper">
        <div className="d-flex details-open-bets">
          <span className="back-arrow">
            <SvgIcon
              name="backfilledArrow"
              role="button"
              tabIndex={0}
              onClick={() => setDetailsOpenBets(false)}
            />
          </span>
          <p className="m-0">{openBetsValue.displayTitle}</p>
        </div>
        <OpenBetsListBackLay
          openBetsValue={openBetsValue}
          betInfo={betInfo}
          timeOrder={timeOrder}
          isOpen={isOpen}
          isMobile={isMobile}
          onBetInfoChange={setBetInfo}
          onTimeOrderChange={setTimeOrder}
        />
      </div>
    )
  }

  if (hasList) {
    return (
      <div className="mobile-open-bet-list">
        {openBetsList.map((item, index) => (
          <li
            key={index}
            className="d-flex open-bets-list"
            onClick={() => {
              setSelectedIndex(index)
              setDetailsOpenBets(true)
            }}
            role="presentation"
          >
            <p className="m-0">{item.displayTitle}</p>
            <span className="right-arrow d-flex justify-content-center align-items-center">
              <SvgIcon name="chevronRightArrow" />
            </span>
          </li>
        ))}
      </div>
    )
  }

  return <NoOpenBets isYellowTheme={isYellowTheme} />
}

export default function OpenBets() {
  const dispatch = useDispatch()
  const isMobile = useSelector(selectIsMobile)
  const isOpen = useSelector(selectActiveBetSlip)
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const openBetsList = useSelector(selectOpenBets) ?? []
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const refreshTick = useSelector(selectOpenBetRefreshTick)

  // Scope by `eventId` only when on the /odds/:eventId/:sport route. Home / list
  // pages omit the param so the API returns the user's full open-bet list.
  const { eventId } = useParams()

  const handleRefresh = useCallback(() => {
    if (!isAuthenticated) return
    const params = eventId ? { eventId: String(eventId) } : {}
    dispatch(fetchOpenBets(params))
  }, [dispatch, isAuthenticated, eventId])

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(setOpenBets([]))
      return undefined
    }
    const params = eventId ? { eventId: String(eventId) } : {}
    dispatch(fetchOpenBets(params))
    const id = setInterval(() => {
      dispatch(fetchOpenBets(params))
    }, OPEN_BETS_POLL_MS)
    return () => clearInterval(id)
  }, [dispatch, isAuthenticated, eventId, refreshTick])

  if (isMobile) {
    return (
      <OpenBetsMobile
        openBetsList={openBetsList}
        isOpen={!!isOpen}
        isMobile={isMobile}
      />
    )
  }

  return (
    <OpenBetsDesktop
      openBetsList={openBetsList}
      isOpen={!!isOpen}
      isMobile={isMobile}
      isYellowTheme={isYellowTheme}
      onRefresh={handleRefresh}
    />
  )
}
