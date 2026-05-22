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

// Tailwind class strings ported from myBets.scss `.bets-filter`.
const betsFilterClass =
  'flex items-center flex-wrap bg-[var(--platinum-grey)] py-[6px] px-[10px] border-b border-[#d0d0d0] text-[12px] text-[#1e1e1e] min-h-[32px] gap-2 mb-[15px] max-mobile:p-2'
const filterLabelClass = 'text-[#1e1e1e] whitespace-nowrap'
const betStatusSelectClass =
  'h-6 pl-[6px] pr-[22px] py-0 text-[12px] leading-[22px] rounded-[3px] border border-[#aaa] bg-white min-w-[110px] w-auto appearance-none bg-no-repeat bg-[position:right_4px_center] bg-[length:14px_10px] bg-[url("data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2016%2016%27%3e%3cpath%20fill=%27none%27%20stroke=%27%23343a40%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%20stroke-width=%272%27%20d=%27M2%205l6%206%206-6%27/%3e%3c/svg%3e")]'
// `.form-check input.form-check-input` — 14px square with cyan checked state.
const checkboxInputClass =
  'w-[14px] h-[14px] mt-0 cursor-pointer shrink-0 appearance-none bg-white border border-[#ced4da] rounded-sm m-0 checked:bg-[var(--cyanBlue)] checked:border-[var(--cyanBlue)] checked:bg-no-repeat checked:bg-center checked:bg-[length:10px_10px] checked:bg-[url("data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2020%2020%27%3e%3cpath%20fill=%27none%27%20stroke=%27%23fff%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%20stroke-width=%273%27%20d=%27m6%2010%203%203%206-6%27/%3e%3c/svg%3e")]'

function BetsFilter({ status, onStatusChange, orderBy, onOrderChange }) {
  const selectOrder = (key) => {
    if (orderBy?.[key]) return
    onOrderChange?.({ betPlaced: key === 'betPlaced', market: key === 'market' })
  }
  return (
    <div className={betsFilterClass}>
      <div className="flex items-center gap-2">
        <label htmlFor="betStatus" className={`${filterLabelClass} mb-0`}>
          Bet Status
        </label>
        <select
          id="betStatus"
          className={betStatusSelectClass}
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
      <div className="flex items-center gap-3 ml-4">
        <span className={filterLabelClass}>Order By</span>
        <label className="m-0 inline-flex items-center gap-1 cursor-pointer p-0">
          <input
            type="checkbox"
            className={checkboxInputClass}
            checked={!!orderBy?.betPlaced}
            onChange={() => selectOrder('betPlaced')}
          />
          <span className="select-none">Bet placed</span>
        </label>
        <label className="m-0 inline-flex items-center gap-1 cursor-pointer p-0">
          <input
            type="checkbox"
            className={checkboxInputClass}
            checked={!!orderBy?.market}
            onChange={() => selectOrder('market')}
          />
          <span className="select-none">Market</span>
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
