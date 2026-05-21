import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken, selectUser } from '../../store/slices/authSlice.js'
import Table from '../../shared/Table.jsx'
import Tabs from '../../shared/Tabs.jsx'

const PL_MARKET_TABS = [
  { id: 'EXCHANGE', label: 'Exchange' },
  { id: 'FANCY', label: 'FancyBet' },
  { id: 'CASINO', label: 'Casino' },
  { id: 'SPORTS_BOOK', label: 'Sportsbook' },
  { id: 'BOOKMAKER', label: 'BookMaker' },
  { id: 'BPOKER', label: 'BPoker' },
  { id: 'SABA', label: 'SABA' },
  { id: 'MINI_GAME', label: 'MiniGame' },
  { id: 'ROYAL', label: 'Royal' },
]

const COLUMNS = [
  {
    key: 'date',
    label: 'Date',
    render: (_v, row) =>
      row?.date ? new Date(row.date).toLocaleString() : '--',
  },
  {
    key: 'marketName',
    label: 'Market',
    render: (_v, row) => row?.marketName ?? '--',
  },
  {
    key: 'description',
    label: 'Description',
    render: (_v, row) => row?.description ?? '--',
  },
  {
    key: 'profitLoss',
    label: 'Profit/Loss',
    render: (_v, row) => row?.profitLoss ?? '--',
  },
]

const pad = (n) => String(n).padStart(2, '0')
const toIsoDate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// 09:00 IST → 03:30 UTC, 08:59:59 IST → 03:29:59 UTC.
const istStartIso = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 3, 30, 0)).toISOString()
}
const istEndIso = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 3, 29, 59)).toISOString()
}

const todayRange = () => {
  const t = new Date()
  const next = new Date(t)
  next.setDate(t.getDate() + 1)
  return { from: toIsoDate(t), to: toIsoDate(next) }
}
const yesterdayRange = () => {
  const t = new Date()
  const prev = new Date(t)
  prev.setDate(t.getDate() - 1)
  return { from: toIsoDate(prev), to: toIsoDate(t) }
}

function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <mask
        id="user-icon-mask"
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="30"
        height="30"
      >
        <rect width="30" height="30" fill="currentColor" />
      </mask>
      <g mask="url(#user-icon-mask)">
        <path
          d="M15 15C13.625 15 12.4479 14.5104 11.4688 13.5312C10.4896 12.5521 10 11.375 10 10C10 8.625 10.4896 7.44792 11.4688 6.46875C12.4479 5.48958 13.625 5 15 5C16.375 5 17.5521 5.48958 18.5312 6.46875C19.5104 7.44792 20 8.625 20 10C20 11.375 19.5104 12.5521 18.5312 13.5312C17.5521 14.5104 16.375 15 15 15ZM5 25V21.5C5 20.7917 5.18229 20.1406 5.54688 19.5469C5.91146 18.9531 6.39583 18.5 7 18.1875C8.29167 17.5417 9.60417 17.0573 10.9375 16.7344C12.2708 16.4115 13.625 16.25 15 16.25C16.375 16.25 17.7292 16.4115 19.0625 16.7344C20.3958 17.0573 21.7083 17.5417 23 18.1875C23.6042 18.5 24.0885 18.9531 24.4531 19.5469C24.8177 20.1406 25 20.7917 25 21.5V25H5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="#7e97a7"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <polyline
        points="12 7 12 12 16 14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function nowLabel() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ProfitLoss() {
  const token = useSelector(selectToken)
  const user = useSelector(selectUser)
  const userName = user?.profileDetails?.userName ?? '--'
  const generatedAt = useMemo(() => nowLabel(), [])

  const [marketCategory, setMarketCategory] = useState('EXCHANGE')
  const initial = todayRange()
  const [fromDate, setFromDate] = useState(initial.from)
  const [toDate, setToDate] = useState(initial.to)
  const [rows, setRows] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  const setJustForToday = () => {
    const r = todayRange()
    setFromDate(r.from)
    setToDate(r.to)
    setRefreshKey((k) => k + 1)
  }
  const setFromYesterday = () => {
    const r = yesterdayRange()
    setFromDate(r.from)
    setToDate(r.to)
    setRefreshKey((k) => k + 1)
  }

  const fetchPnl = useCallback(() => {
    if (!token) return
    const periodStartDate = istStartIso(fromDate)
    const periodEndDate = istEndIso(toDate)
    const query = new URLSearchParams({
      page: '1',
      perPage: '10',
      periodStartDate,
      periodEndDate,
      marketCategory,
    }).toString()
    http
      .get(`bet/profit-loss?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const payload = res.data?.data
        setRows(payload?.data ?? (Array.isArray(payload) ? payload : []))
      })
  }, [token, marketCategory, fromDate, toDate])

  useEffect(() => {
    fetchPnl()
  }, [fetchPnl, refreshKey])

  return (
    <div className="pl-card">
      <div className="pl-header">
        <h4 className="pl-title">Profit &amp; Loss - Main wallet</h4>
        <div className="pl-meta">
          <span className="pl-meta-item">
            <UserIcon />
            <span>{userName}</span>
          </span>
          <span className="pl-meta-item">
            <ClockIcon />
            <span>{generatedAt}</span>
          </span>
        </div>
      </div>

      <Tabs
        tabs={PL_MARKET_TABS}
        activeId={marketCategory}
        onChange={setMarketCategory}
      />

      <div className="bet-history-filter">
        <div className="filter-row">
          <label className="filter-label">Period</label>
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
            onClick={fetchPnl}
          >
            Get P &amp; L
          </button>
        </div>
      </div>

      <Table
        columns={COLUMNS}
        data={rows}
        rowKey="_id"
        emptyMessage="No profit/loss records for the selected period."
      />
    </div>
  )
}
