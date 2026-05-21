import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Table from '../../shared/Table.jsx'
import MarketTabs from './MarketTabs.jsx'

const BET_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'MATCHED', label: 'Matched' },
  { value: 'UNMATCHED', label: 'Unmatched' },
  { value: 'PENDING', label: 'Pending' },
]

function BetsFilter({ status, onStatusChange, orderBy, onOrderChange }) {
  const selectOrder = (key) => {
    if (orderBy?.[key]) return
    onOrderChange?.({ betPlaced: key === 'betPlaced', market: key === 'market' })
  }
  return (
    <div className="bets-filter">
      <div className="d-flex align-items-center gap-2">
        <label htmlFor="betStatus" className="filter-label mb-0">
          Bet Status
        </label>
        <select
          id="betStatus"
          className="form-select form-select-sm bet-status-select"
          value={status}
          onChange={(e) => onStatusChange?.(e.target.value)}
        >
          {BET_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="d-flex align-items-center gap-3 ms-4">
        <span className="filter-label">Order By</span>
        <label className="form-check m-0 d-inline-flex align-items-center gap-1">
          <input
            type="checkbox"
            className="form-check-input m-0"
            checked={!!orderBy?.betPlaced}
            onChange={() => selectOrder('betPlaced')}
          />
          <span>Bet placed</span>
        </label>
        <label className="form-check m-0 d-inline-flex align-items-center gap-1">
          <input
            type="checkbox"
            className="form-check-input m-0"
            checked={!!orderBy?.market}
            onChange={() => selectOrder('market')}
          />
          <span>Market</span>
        </label>
      </div>
    </div>
  )
}

const COLUMNS = [
  { key: 'betId', label: 'Bet ID', render: (_v, row) => row?.betId ?? row?._id ?? '--' },
  { key: 'plId', label: 'PL ID', render: (_v, row) => row?.plId ?? '--' },
  { key: 'market', label: 'Market', render: (_v, row) => row?.marketName ?? row?.market ?? '--' },
  { key: 'selection', label: 'Selection', render: (_v, row) => row?.selectionName ?? row?.selection ?? '--' },
  { key: 'type', label: 'Type', render: (_v, row) => row?.betType ?? row?.type ?? '--' },
  {
    key: 'betPlaced',
    label: 'Bet Placed',
    render: (_v, row) => (row?.createdAt ? new Date(row.createdAt).toLocaleString() : '--'),
  },
  { key: 'stake', label: 'Stake', render: (_v, row) => row?.stake ?? '--' },
  {
    key: 'avgOddMatched',
    label: 'Avg. Odd Matched',
    render: (_v, row) => row?.avgOddMatched ?? row?.odds ?? '--',
  },
  { key: 'actions', label: 'Actions', render: () => '--' },
]

export default function CurrentBets() {
  const token = useSelector(selectToken)
  const [marketCategory, setMarketCategory] = useState('EXCHANGE')
  const [betStatus, setBetStatus] = useState('MATCHED')
  const [orderBy, setOrderBy] = useState({ betPlaced: true, market: false })
  const [bets, setBets] = useState([])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    http
      .get(
        `bet/history?page=1&perPage=10&betStatus=${betStatus}&marketCategory=${marketCategory}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then((res) => {
        if (cancelled) return
        const payload = res.data?.data
        setBets(payload?.data ?? (Array.isArray(payload) ? payload : []))
      })
    return () => {
      cancelled = true
    }
  }, [token, marketCategory, betStatus])

  return (
    <MarketTabs value={marketCategory} onChange={setMarketCategory}>
      <BetsFilter
        status={betStatus}
        onStatusChange={setBetStatus}
        orderBy={orderBy}
        onOrderChange={setOrderBy}
      />
      <Table
        columns={COLUMNS}
        data={bets}
        rowKey="_id"
        emptyMessage="You have no active bets."
      />
    </MarketTabs>
  )
}
