import { memo } from 'react'
import { cx } from './helpers.js'

// Shared tab strip used by Fancy (default variant) and Sportsbook ("sport-book").
export const PriorityTabs = memo(function PriorityTabs({
  tabs,
  selectedType,
  onSelectType,
  variant = 'fancy',
}) {
  const isSportBook = variant === 'sport-book'

  const containerCls = cx(
    'overflow-x-auto whitespace-nowrap cursor-pointer [&::-webkit-scrollbar]:hidden'
  )

  const wrapperCls = cx(
    'flex justify-center items-center shadow-[inset_0_1px_0_0_rgba(var(--black-rgb),0.2)] bg-gradient-to-b from-[var(--md-lightest-navy)] from-[15%] to-[var(--lg-lightest-navy)] max-md:!shadow-none max-md:bg-none max-md:bg-[var(--smd-text-color)] max-md:justify-start max-md:py-[0.5vw] max-md:pl-[1.6vw]',
    isSportBook &&
      '!bg-gradient-to-b !from-[var(--xs-orange)] !from-[15%] !to-[var(--md-orange)] pb-[3px] max-md:!bg-[var(--orange)]'
  )

  const ulCls =
    'flex pl-0 mb-0 w-auto bg-white/50 rounded-[5px] my-[1px_3px_0] justify-center items-center max-md:bg-transparent'

  return (
    <div className={containerCls}>
      <div className={wrapperCls}>
        <ul className={ulCls}>
          {tabs.map((tab) => {
            const isActive = selectedType === tab.type
            const liBase =
              'min-w-[70px] h-[18px] leading-[18px] font-bold md:rounded-[4px] px-[5px] text-center max-md:h-[5.9333333333vw] max-md:min-w-0 max-md:px-[2.6666666667vw] max-md:leading-[6vw] max-md:h-[5.9333333333vw] max-md:border-r max-md:border-r-white/40 hover:[&_a]:underline'
            const liActive = isActive
              ? cx(
                  'bg-white hover:[&_a]:!no-underline max-md:rounded-[1.0666666667vw]',
                  isSportBook &&
                    'max-md:!bg-[var(--orange)] max-md:!rounded-none'
                )
              : ''
            const aCls = cx(
              'no-underline text-[var(--lg-lightest-navy)] max-md:text-white',
              isSportBook &&
                'text-[rgba(var(--orange-rgba),0.85)] max-md:text-white',
              isActive && 'max-md:!text-[var(--lg-lightest-navy)]'
            )

            return (
              <li
                key={tab.type}
                className={cx(liBase, liActive)}
                onClick={() => onSelectType(tab.type)}
              >
                <a className={aCls}>{tab.label}</a>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
})
