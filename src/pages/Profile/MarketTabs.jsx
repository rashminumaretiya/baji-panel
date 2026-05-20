import Tabs from '../../shared/Tabs.jsx'

const MARKET_NAV_TABS = [
  { id: 'EXCHANGE', label: 'Exchange' },
  { id: 'FANCY', label: 'FancyBet' },
  { id: 'SPORTS_BOOK', label: 'Sportsbook' },
  { id: 'BOOKMAKER', label: 'BookMaker' },
]

export default function MarketTabs({ value, onChange, children }) {
  return (
    <>
      <Tabs tabs={MARKET_NAV_TABS} activeId={value} onChange={onChange} />
      {children}
    </>
  )
}
