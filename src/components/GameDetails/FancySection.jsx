import { useMemo, useState } from 'react'
import FancyTabHeader from './FancyTabHeader.jsx'
import FancyMarket from './FancyMarket.jsx'
import SportbookMarket from './SportbookMarket.jsx'

export default function FancySection({
  fancy = [],
  sportBook = [],
  fancySetting,
  sportbookSetting,
  visibleMarkets,
}) {
  const v = visibleMarkets ?? {
    fancy: Array.isArray(fancy) && fancy.length > 0,
    sportBook: Array.isArray(sportBook)
      ? sportBook.length > 0
      : !!sportBook && Object.keys(sportBook).length > 0,
  }

  const tabs = useMemo(() => {
    const out = []
    if (v.fancy) out.push({ title: 'Fancy Bet', type: 'fancyBet' })
    if (v.sportBook) out.push({ title: 'Premium Cricket', type: 'sportBook' })
    return out
  }, [v.fancy, v.sportBook])

  const [requestedTab, setRequestedTab] = useState('fancyBet')
  const selectedTab = tabs.some((t) => t.type === requestedTab)
    ? requestedTab
    : tabs[0]?.type ?? 'fancyBet'

  if (!v.fancy && !v.sportBook) return null

  return (
    <div className="fancy-bet-wrapper">
      <FancyTabHeader tabs={tabs} selectedTab={selectedTab} onSelectedTabChange={setRequestedTab} />

      {selectedTab === 'fancyBet' && (
        <FancyMarket fancy={fancy} marketSetting={fancySetting} />
      )}
      {selectedTab === 'sportBook' && (
        <SportbookMarket sportbooks={sportBook} marketSetting={sportbookSetting} />
      )}
    </div>
  )
}
