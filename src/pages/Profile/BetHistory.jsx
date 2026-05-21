import { useState } from 'react'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Table from '../../shared/Table.jsx'
import MarketTabs from './MarketTabs.jsx'

const BET_STATUS_OPTIONS = [
  { value: 'SETTLED', label: 'Settled' },
  { value: 'VOIDED', label: 'Voided' },
]

const COLUMNS = [
  {
    key: 'betId',
    label: 'Bet ID',
    render: (_v, row) => row?.betId ?? row?._id ?? '--',
  },
  { key: 'plId', label: 'PL ID', render: (_v, row) => row?.plId ?? '--' },
  {
    key: 'market',
    label: 'Market',
    render: (_v, row) => row?.marketName ?? '--',
  },
  {
    key: 'selection',
    label: 'Selection',
    render: (_v, row) => row?.selectionName ?? '--',
  },
  { key: 'type', label: 'Type', render: (_v, row) => row?.betType ?? '--' },
  {
    key: 'betPlaced',
    label: 'Bet Placed',
    render: (_v, row) =>
      row?.createdAt ? new Date(row.createdAt).toLocaleString() : '--',
  },
  { key: 'stake', label: 'Stake', render: (_v, row) => row?.stake ?? '--' },
  {
    key: 'avgOddMatched',
    label: 'Avg. Odd Matched',
    render: (_v, row) => row?.avgOddMatched ?? row?.odds ?? '--',
  },
  {
    key: 'profitLoss',
    label: 'Profit/Loss',
    render: (_v, row) => row?.profitLoss ?? '--',
  },
]

const pad = (n) => String(n).padStart(2, '0')

function toIsoDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Build a UTC ISO string for "<localDate> 09:00 IST" / "<localDate> 08:59:59 IST"
// 09:00 IST == 03:30 UTC; 08:59:59 IST == 03:29:59 UTC.
function istStartIso(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 3, 30, 0)).toISOString()
}

function istEndIso(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 3, 29, 59)).toISOString()
}

function todayRange() {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  return { from: toIsoDate(today), to: toIsoDate(tomorrow) }
}

function yesterdayRange() {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  return { from: toIsoDate(yesterday), to: toIsoDate(today) }
}

export default function BetHistory() {
  const token = useSelector(selectToken)
  const [marketCategory, setMarketCategory] = useState('EXCHANGE')
  const [betStatus, setBetStatus] = useState('SETTLED')
  const initial = todayRange()
  const [fromDate, setFromDate] = useState(initial.from)
  const [toDate, setToDate] = useState(initial.to)
  const [bets, setBets] = useState([])
  const [hasFetched, setHasFetched] = useState(false)

  const setJustForToday = () => {
    const r = todayRange()
    setFromDate(r.from)
    setToDate(r.to)
  }

  const setFromYesterday = () => {
    const r = yesterdayRange()
    setFromDate(r.from)
    setToDate(r.to)
  }

  const fetchHistory = () => {
    if (!token) return
    const periodStartDate = istStartIso(fromDate)
    const periodEndDate = istEndIso(toDate)
    const query = new URLSearchParams({
      page: '1',
      perPage: '10',
      betStatus,
      periodStartDate,
      periodEndDate,
      marketCategory,
    }).toString()
    http
      .get(`bet/history?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const payload = res.data?.data
        setBets(payload?.data ?? (Array.isArray(payload) ? payload : []))
        setHasFetched(true)
      })
  }

  return (
    <MarketTabs value={marketCategory} onChange={setMarketCategory}>
      <div className="bet-history-filter">
        <div className="filter-row">
          <label className="filter-label">Bet Status</label>
          <select
            className="form-select form-select-sm bet-status-select"
            value={betStatus}
            onChange={(e) => setBetStatus(e.target.value)}
          >
            {BET_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label className="filter-label ms-3">Period</label>
          <input
            type="date"
            className="form-control form-control-sm date-input"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <input
            type="text"
            className="form-control form-control-sm time-input"
            value="09 : 00"
            readOnly
          />
          <span className="period-sep">to</span>
          <input
            type="date"
            className="form-control form-control-sm date-input"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <input
            type="text"
            className="form-control form-control-sm time-input"
            value="08 : 59"
            readOnly
          />
        </div>

        <div className="action-row">
          <button
            type="button"
            className="btn btn-light btn-sm"
            onClick={setJustForToday}
          >
            Just For Today
          </button>
          <button
            type="button"
            className="btn btn-light btn-sm"
            onClick={setFromYesterday}
          >
            From Yesterday
          </button>
          <button
            type="button"
            className="btn btn-sm get-history"
            onClick={fetchHistory}
          >
            Get History
          </button>
        </div>
      </div>

      {!hasFetched ? (
        <div className="bet-history-info">
          <p>Betting History enables you to review the bets you have placed.</p>
          <p style={{ paddingBottom: '0.25rem' }}>
            Specify the time period during which your bets were placed, the type
            of markets on which the bets were placed, and the sport.
          </p>
          <p style={{ paddingBottom: '0.25rem' }}>
            Betting History is available online for the past 62 days.
          </p>
          <p>User can search up to 14 days records per query only .</p>
        </div>
      ) : (
        <Table
          columns={COLUMNS}
          data={bets}
          rowKey="_id"
          emptyMessage="No bets found for the selected period."
        />
      )}
    </MarketTabs>
  )
}
