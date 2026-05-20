import { useState } from 'react'
import Tabs from '../../shared/Tabs.jsx'
import MarketTabs from './MarketTabs.jsx'
import './myBets.scss'

const MAIN_TABS = [
  { id: 'current-bets', label: 'Current Bets' },
  { id: 'bet-history', label: 'Bets History' },
  { id: 'pnl', label: 'Profit & Loss' },
]

const BET_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'MATCHED', label: 'Matched' },
  { value: 'UNMATCHED', label: 'Unmatched' },
  { value: 'PENDING', label: 'Pending' },
]

function BetsFilter({ status, onStatusChange, orderBy, onOrderChange }) {
  const toggle = (key) => {
    onOrderChange?.({ ...orderBy, [key]: !orderBy[key] })
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
          onChange={(event) => onStatusChange?.(event.target.value)}
        >
          {BET_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
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
            onChange={() => toggle('betPlaced')}
          />
          <span>Bet placed</span>
        </label>
        <label className="form-check m-0 d-inline-flex align-items-center gap-1">
          <input
            type="checkbox"
            className="form-check-input m-0"
            checked={!!orderBy?.market}
            onChange={() => toggle('market')}
          />
          <span>Market</span>
        </label>
      </div>
    </div>
  )
}

function BetsBoard() {
  const [marketTab, setMarketTab] = useState('EXCHANGE')
  const [betStatus, setBetStatus] = useState('ALL')
  const [orderBy, setOrderBy] = useState({ betPlaced: true, market: false })

  return (
    <MarketTabs value={marketTab} onChange={setMarketTab}>
      <BetsFilter
        status={betStatus}
        onStatusChange={setBetStatus}
        orderBy={orderBy}
        onOrderChange={setOrderBy}
      />
    </MarketTabs>
  )
}

const TAB_VIEWS = {
  'current-bets': BetsBoard,
  'bet-history': BetsBoard,
  pnl: BetsBoard,
}

export default function MyBets() {
  const [activeTab, setActiveTab] = useState('current-bets')
  const ActiveView = TAB_VIEWS[activeTab] ?? BetsBoard

  return (
    <>
      <h3 className="page-title">My Bets</h3>
      <Tabs tabs={MAIN_TABS} activeId={activeTab} onChange={setActiveTab} />
      <ActiveView />
    </>
  )
}
