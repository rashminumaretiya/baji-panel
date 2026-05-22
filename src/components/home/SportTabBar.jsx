import { memo } from 'react'
import { useTranslation } from 'react-i18next'

const TAB_LIST_CLASS =
  'flex rounded-none gap-[5px] justify-start border-b-0 m-0 px-[10px] pt-0 pb-px bg-[var(--xl-dark-green)] list-none'

const TAB_ITEM_CLASS = 'flex-none ml-0'

const TAB_LINK_BASE =
  'block border rounded-t-[4px] rounded-b-none w-[130px] text-[12px] leading-[21px] font-normal p-0 -mb-px'

const TAB_LINK_INACTIVE =
  'bg-[var(--xts-light-bg)] border-[var(--xxl-blue)] text-white shadow-[inset_0_7px_2px_-7px_var(--xts-gray)]'

const TAB_LINK_ACTIVE =
  'bg-[var(--xl-th-bg)] border-[var(--xl-th-bg)] text-black shadow-[inset_0_7px_2px_-7px_var(--white)]'

const SportTab = memo(function SportTab({ tab, navId, isActive, onSelect }) {
  const { t } = useTranslation()
  return (
    <li className={TAB_ITEM_CLASS} role="presentation">
      <button
        type="button"
        className={`${TAB_LINK_BASE} ${isActive ? TAB_LINK_ACTIVE : TAB_LINK_INACTIVE}`}
        id={navId}
        role="tab"
        aria-selected={isActive}
        aria-disabled="false"
        {...(isActive
          ? { 'aria-controls': `${navId}-panel` }
          : { tabIndex: -1 })}
        onClick={() => onSelect(tab.id)}
      >
        <span>{tab.label ? t(tab.label) : tab.name}</span>
      </button>
    </li>
  )
})

export default function SportTabBar({ tabs, activeSportId, onSelect }) {
  return (
    <div className="mt-0">
      <ul className={TAB_LIST_CLASS} role="tablist">
        {tabs.map((tab, idx) => (
          <SportTab
            key={tab.id}
            tab={tab}
            navId={`ngb-nav-${idx}`}
            isActive={String(tab.id) === activeSportId}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  )
}
