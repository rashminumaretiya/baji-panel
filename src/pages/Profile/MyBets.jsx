import { useSearchParams } from 'react-router-dom'
import Tabs from '../../shared/Tabs.jsx'
import CurrentBets from './CurrentBets.jsx'
import BetHistory from './BetHistory.jsx'
import ProfitLoss from './ProfitLoss.jsx'
import './myBets.scss'

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
    <>
      <h3 className="page-title">My Bets</h3>
      <Tabs
        tabs={MAIN_TABS}
        activeId={activeTab}
        onChange={setTab}
        className="main-bets-tabs"
      />
      {activeTab === 'current-bets' && <CurrentBets />}
      {activeTab === 'bet-history' && <BetHistory />}
      {activeTab === 'pnl' && <ProfitLoss />}
    </>
  )
}
