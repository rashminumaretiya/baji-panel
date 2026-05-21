import { useEffect } from 'react'
import './market-tab.scss'

export default function MarketTab({ tabs, activeTab, onActiveTabChange }) {
  useEffect(() => {
    if (tabs?.length && !activeTab) {
      onActiveTabChange?.(tabs[0])
    }
  }, [tabs, activeTab, onActiveTabChange])

  return (
    <div className="fancy-priority-container">
      <div className="tabs-wrapper fancy">
        <ul className="ps-0 mb-0">
          {tabs.map((tab) => (
            <li
              key={tab}
              className={`text-center${activeTab === tab ? ' active' : ''}`}
              onClick={() => onActiveTabChange?.(tab)}
            >
              <a>{tab}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
