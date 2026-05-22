import { useTranslation } from 'react-i18next'
import Tabs from '../../shared/Tabs.jsx'

const MARKET_NAV_TABS = [
  { id: 'EXCHANGE', i18nKey: 'common.exchange', fallback: 'Exchange' },
  { id: 'FANCY', i18nKey: 'markets.fancy', fallback: 'Fancy' },
  { id: 'SPORTS_BOOK', i18nKey: 'markets.sportBook', fallback: 'Sport Book' },
  { id: 'BOOKMAKER', i18nKey: 'markets.bookmaker', fallback: 'Bookmaker' },
]

export default function MarketTabs({ value, onChange, children }) {
  const { t } = useTranslation()
  const tabs = MARKET_NAV_TABS.map((tab) => ({
    id: tab.id,
    label: t(tab.i18nKey, tab.fallback),
  }))
  return (
    <>
      <Tabs tabs={tabs} activeId={value} onChange={onChange} />
      {children}
    </>
  )
}
