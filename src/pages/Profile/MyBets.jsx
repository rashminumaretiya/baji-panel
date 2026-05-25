import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import Tabs from '../../shared/Tabs.jsx'
import CurrentBets from './CurrentBets.jsx'
import BetHistory from './BetHistory.jsx'
import ProfitLoss from './ProfitLoss.jsx'

const MAIN_TABS = [
  {
    id: 'current-bets',
    i18nKey: 'common.currentBets',
    fallback: 'Current Bets',
  },
  {
    id: 'bet-history',
    i18nKey: 'common.betsHistory',
    fallback: 'Bets History',
  },
  { id: 'pnl', i18nKey: 'common.profitLoss', fallback: 'Profit & Loss' },
]

const DEFAULT_TAB = 'current-bets'
const VALID_TABS = new Set(MAIN_TABS.map((t) => t.id))

export default function MyBets() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab = VALID_TABS.has(tabParam) ? tabParam : DEFAULT_TAB

  const setTab = (id) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', id)
    setSearchParams(next, { replace: true })
  }

  const tabs = MAIN_TABS.map((tab) => ({
    id: tab.id,
    label: t(tab.i18nKey, tab.fallback),
  }))

  return (
    <div className="mb-4">
      <h3 className="mb-1.5 pt-1.5 text-[13px] leading-5 font-bold text-[#1e1e1e]">
        {t('common.myBets', 'My Bets')}
      </h3>
      <Tabs
        className="mb-4"
        tabs={tabs}
        activeId={activeTab}
        onChange={setTab}
      />
      {activeTab === 'current-bets' && <CurrentBets />}
      {activeTab === 'bet-history' && <BetHistory />}
      {activeTab === 'pnl' && <ProfitLoss />}
    </div>
  )
}
