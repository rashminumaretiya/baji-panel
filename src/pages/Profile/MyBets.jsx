import { useSearchParams } from 'react-router-dom'
import Tabs from '../../shared/Tabs.jsx'
import CurrentBets from './CurrentBets.jsx'
import BetHistory from './BetHistory.jsx'
import ProfitLoss from './ProfitLoss.jsx'

const MAIN_TABS = [
  { id: 'current-bets', label: 'Current Bets' },
  { id: 'bet-history', label: 'Bets History' },
  { id: 'pnl', label: 'Profit & Loss' },
]

const DEFAULT_TAB = 'current-bets'
const VALID_TABS = new Set(MAIN_TABS.map((t) => t.id))

export default function MyBets() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab = VALID_TABS.has(tabParam) ? tabParam : DEFAULT_TAB

  const setTab = (id) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', id)
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="mb-4">
      <h3 className="text-[#1e1e1e] font-bold text-[13px] leading-5 pt-1.5 mb-1.5">
        My Bets
      </h3>
      <Tabs
        className="mb-3"
        tabs={MAIN_TABS}
        activeId={activeTab}
        onChange={setTab}
      />
      {activeTab === 'current-bets' && <CurrentBets />}
      {activeTab === 'bet-history' && <BetHistory />}
      {activeTab === 'pnl' && <ProfitLoss />}
    </div>
  )
}
