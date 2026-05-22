import { useCallback, useEffect, useState } from 'react'
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

// Tailwind class strings ported from myBets.scss `.bet-history-filter`.
const filterContainerClass =
  'bg-[var(--platinum-grey)] border-b border-[#d0d0d0] px-[10px] py-[8px] text-[12px] text-[#1e1e1e]'
const filterRowClass = 'flex items-center flex-wrap gap-[6px] mb-4'
const actionRowClass = 'flex items-center gap-[6px] mt-2'
const filterLabelClass = 'text-[#1e1e1e] whitespace-nowrap m-0'
const betStatusSelectClass =
  'h-6 pl-[6px] pr-[22px] py-0 text-[12px] leading-[22px] rounded-[3px] border border-[#aaa] bg-white min-w-[110px] w-auto appearance-none bg-no-repeat bg-[position:right_4px_center] bg-[length:14px_10px] bg-[url("data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2016%2016%27%3e%3cpath%20fill=%27none%27%20stroke=%27%23343a40%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%20stroke-width=%272%27%20d=%27M2%205l6%206%206-6%27/%3e%3c/svg%3e")]'
const dateInputClass =
  'h-6 px-[6px] py-0 text-[12px] leading-[22px] rounded-[3px] border border-[#aaa] bg-white w-[130px]'
const timeInputClass =
  'h-6 px-[6px] py-0 text-[12px] leading-[22px] rounded-[3px] border border-[#aaa] w-[60px] text-center bg-[#ececec] text-[#666]'
const periodSepClass = 'px-1'
const btnLightClass =
  'h-[26px] px-[10px] text-[12px] rounded-[3px] bg-[#f8f9fa] border border-[#f8f9fa] text-[#212529] hover:bg-[#e2e6ea] hover:border-[#dae0e5]'
const getHistoryBtnClass =
  'h-[26px] px-[10px] text-[12px] rounded-[3px] bg-[#0A876D] border border-[#0A876D] text-white hover:bg-[#0A876D] focus:bg-[#0A876D]'

export default function BetHistory() {
  const token = useSelector(selectToken)
  const [marketCategory, setMarketCategory] = useState('EXCHANGE')
  const [betStatus, setBetStatus] = useState('SETTLED')
  const initial = todayRange()
  const [fromDate, setFromDate] = useState(initial.from)
  const [toDate, setToDate] = useState(initial.to)
  const [bets, setBets] = useState([])
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

  const fetchHistory = useCallback(() => {
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
      })
  }, [token, marketCategory, betStatus, fromDate, toDate])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory, refreshKey])

  return (
    <MarketTabs value={marketCategory} onChange={setMarketCategory}>
      <div className={filterContainerClass}>
        <div className={filterRowClass}>
          <label className={filterLabelClass}>Bet Status</label>
          <select
            className={betStatusSelectClass}
            value={betStatus}
            onChange={(e) => setBetStatus(e.target.value)}
          >
            {BET_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Bootstrap `.ms-3` (= 1rem left margin). */}
          <label className={`${filterLabelClass} ml-4`}>Period</label>
          <input
            type="date"
            className={dateInputClass}
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <input
            type="text"
            className={timeInputClass}
            value="09 : 00"
            readOnly
          />
          <span className={periodSepClass}>to</span>
          <input
            type="date"
            className={dateInputClass}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <input
            type="text"
            className={timeInputClass}
            value="08 : 59"
            readOnly
          />
        </div>

        <div className={actionRowClass}>
          <button
            type="button"
            className={btnLightClass}
            onClick={setJustForToday}
          >
            Just For Today
          </button>
          <button
            type="button"
            className={btnLightClass}
            onClick={setFromYesterday}
          >
            From Yesterday
          </button>
          <button
            type="button"
            className={getHistoryBtnClass}
            onClick={fetchHistory}
          >
            Get History
          </button>
        </div>
      </div>

      <Table
        columns={COLUMNS}
        data={bets}
        rowKey="_id"
        emptyMessage="No bets found for the selected period."
      />
    </MarketTabs>
  )
}
