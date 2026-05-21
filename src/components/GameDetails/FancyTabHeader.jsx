import { useMemo } from 'react'
import './fancy-tab-header.scss'

const ClockIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 2a10 10 0 100 20 10 10 0 000-20zm.5 5h-1.5v6l5.25 3.15.75-1.23-4.5-2.67V7z"
    />
  </svg>
)

const QuestionMarkIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M11 18h2v-2h-2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"
    />
  </svg>
)

export default function FancyTabHeader({ tabs, selectedTab, onSelectedTabChange, onOpenRules }) {
  const orderedTabs = useMemo(
    () => [...tabs].sort((a) => (a.type === selectedTab ? -1 : 1)),
    [tabs, selectedTab],
  )

  return (
    <div className={`fancy-bet-header${selectedTab === 'sportBook' ? ' orange' : ''}`}>
      {orderedTabs.map((tab) => {
        const isActive = tab.type === selectedTab
        return (
          <div
            key={tab.type}
            className={`fancy-bet-chip cursor-pointer position-relative${
              isActive ? ' active' : ''
            }${selectedTab === 'sportBook' && tab.type === 'sportBook' ? ' premium' : ''}`}
            onClick={() => onSelectedTabChange?.(tab.type)}
          >
            {tab.type === 'sportBook' && tab.type !== selectedTab && (
              <p className="live-chip">
                <span className="number">New</span>
              </p>
            )}

            <div className="d-flex align-items-center innerbg">
              <i className="icon-clock">{ClockIcon}</i>
              <span className="tab-title">{tab.title}</span>
            </div>

            {isActive && (
              <i
                className="que-icon cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenRules?.()
                }}
              />
            )}
          </div>
        )
      })}

      {selectedTab === 'sportBook' && (
        <p className="text-black mb-0 min-chips">
          <i>{QuestionMarkIcon}</i>
          Min
        </p>
      )}
    </div>
  )
}
