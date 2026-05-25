export default function Tabs({
  tabs = [],
  activeId,
  onChange,
  className = '',
}) {
  return (
    <ul
      className={`mb-0 flex flex-nowrap justify-start rounded-none border-b-4 border-(--text-color) pl-0 max-md:overflow-x-auto max-md:overflow-y-hidden max-md:bg-transparent ${className}`.trim()}
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
              className={`cursor-pointer rounded-t-[3px] border border-b-0 px-[10px] pt-[5px] pb-[7px] text-[15px] leading-[15px] font-semibold hover:no-underline max-md:mb-[2px] max-md:px-[11px] max-md:py-3 max-md:text-[13px] max-md:whitespace-nowrap ${
                isActive
                  ? 'border-(--light-navy) bg-(--text-color) text-white'
                  : 'border-(--text-color) bg-white text-(--text-color)'
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
