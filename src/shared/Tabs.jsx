export default function Tabs({ tabs = [], activeId, onChange, className = '' }) {
  return (
    <div>
      <ul
        className={`flex flex-nowrap justify-center pb-px rounded ${className}`.trim()}
        role="tablist"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeId
          const isFirst = index === 0
          const isLast = index === tabs.length - 1
          const radius = [
            isFirst ? 'rounded-l max-mobile:rounded-l-[1.6vw]' : '',
            isLast ? 'rounded-r max-mobile:rounded-r-[1.6vw]' : '',
          ].join(' ')
          return (
            <li key={tab.id} className="flex-1 -ml-px first:ml-0" role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange?.(tab.id)}
                className={`w-full text-[13px] font-bold leading-[27px] border border-[var(--text-color)] hover:underline max-mobile:text-[3.73vw] max-mobile:leading-[8.8vw] max-mobile:bg-transparent max-mobile:border-white ${radius} ${
                  isActive
                    ? 'bg-[var(--text-color)] text-white max-mobile:bg-white max-mobile:text-[var(--text-color)] hover:no-underline'
                    : 'bg-white text-[var(--text-color)] max-mobile:text-white'
                }`}
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
