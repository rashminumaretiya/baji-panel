export default function Tabs({ tabs = [], activeId, onChange, className = '' }) {
  return (
    <div className="my-bets-container">
      <ul
        className={`nav-tabs main-bets-tab flex-nowrap inplay-tabs ${className}`.trim()}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId
          return (
            <li key={tab.id} className="nav-item" role="presentation">
              <button
                type="button"
                role="tab"
                className={`nav-link${isActive ? ' active' : ''}`}
                aria-selected={isActive}
                onClick={() => onChange?.(tab.id)}
              >
                <span>{tab.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
