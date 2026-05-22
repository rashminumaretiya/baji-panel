export default function Tabs({
  tabs = [],
  activeId,
  onChange,
  className = '',
}) {
  return (
    <ul
      className={`flex flex-nowrap justify-start pl-0 mb-0 border-b-4 border-[var(--text-color)] rounded-none max-md:bg-transparent max-md:overflow-x-auto max-md:overflow-y-hidden ${className}`.trim()}
      role="tablist"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeId
        return (
          <li
            key={tab.id}
            className={`list-none max-md:flex-none ${
              index > 0 ? 'ml-[3px]' : ''
            }`}
            role="presentation"
          >
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange?.(tab.id)}
              className={`text-[15px] leading-[15px] font-semibold pt-[5px] pb-[7px] px-[10px] border border-b-0 rounded-t-[3px] cursor-pointer hover:no-underline max-md:text-[13px] max-md:py-3 max-md:px-[11px] max-md:mb-[2px] max-md:whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--text-color)] text-white border-[var(--light-navy)]'
                  : 'bg-white text-[var(--text-color)] border-[var(--text-color)]'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
