// UI primitives shared by 2+ live-odds sections. JSX-only file (constants
// and helpers live in ./shared.js) so React-Refresh's "only export
// components" rule stays satisfied.

import { memo } from 'react'
import { cx } from '../../utils/cx.js'

export function MatchHeader({ children }) {
  return (
    <div className="flex items-center justify-between bg-(--light-navy) max-md:bg-(--text-color)">
      {children}
    </div>
  )
}

export const PriorityTabs = memo(function PriorityTabs({
  tabs,
  selectedType,
  onSelectType,
  variant = 'fancy',
}) {
  const isSportBook = variant === 'sport-book'

  const containerCls =
    'overflow-x-auto whitespace-nowrap cursor-pointer [&::-webkit-scrollbar]:hidden'

  const wrapperCls = cx(
    'flex justify-center items-center shadow-[inset_0_1px_0_0_rgba(var(--black-rgb),0.2)] bg-gradient-to-b from-(--md-lightest-navy) from-[15%] to-(--lg-lightest-navy) max-md:!shadow-none max-md:bg-none max-md:bg-(--smd-text-color) max-md:justify-start max-md:py-[0.5vw] max-md:pl-[1.6vw]',
    isSportBook &&
      'md:!bg-gradient-to-b !from-(--xs-orange) !from-[15%] !to-(--md-orange) pb-[3px] max-md:!bg-(--orange)'
  )

  const ulCls =
    'flex pl-0 mb-0 w-auto bg-white/50 rounded-[5px] my-[1px_3px_0] justify-center items-center max-md:bg-transparent'

  const liBase =
    'min-w-[70px] h-[18px] leading-[18px] font-bold md:rounded-[4px] px-[5px] text-center max-md:h-[5.9333333333vw] max-md:min-w-0 max-md:px-[2.6666666667vw] max-md:leading-[6vw] max-md:h-[5.9333333333vw] max-md:border-r max-md:border-r-white/40 hover:[&_a]:underline'

  const aCls = cx(
    'no-underline',
    isSportBook && 'text-[rgba(var(--orange-rgba),0.85)] max-md:!text-white'
  )

  return (
    <div className={containerCls}>
      <div className={wrapperCls}>
        <ul className={ulCls}>
          {tabs.map((tab) => {
            const isActive = selectedType === tab.type
            const liActive = isActive
              ? cx(
                  'bg-white text-[var(--lg-lightest-navy)] hover:[&_a]:!no-underline max-md:rounded-[1.0666666667vw]',
                  isSportBook && 'max-md:!bg-(--orange) max-md:!rounded-none'
                )
              : 'max-md:text-white text-[var(--lg-lightest-navy)]'

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
