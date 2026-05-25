import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from './helpers.js'
import { MAIN_FANCY } from './constants.js'
import { PinSvg, TimeSvg, WarningSvg } from './icons.jsx'

export const FancyTabHeader = memo(function FancyTabHeader({
  tabs,
  selectedFancy,
  onSelect,
  isMobile,
  onInfoClick,
}) {
  const { t } = useTranslation()
  const isSportsBookSelected = selectedFancy === MAIN_FANCY.SPORTS_BOOK

  return (
    <div
      className={cx(
        'flex items-center border-b-2 border-(--sky-blue-light) max-md:border-b-[1.06667vw] max-md:border-b-(--smd-text-color)',
        isSportsBookSelected && '!border-b-(--orange)'
      )}
    >
      {tabs.map((tab, i) => {
        const isActive = tab.type === selectedFancy
        const isFirst = i === 0
        const isPremium =
          isSportsBookSelected && tab.type === MAIN_FANCY.SPORTS_BOOK

        const chipBase =
          'inline-flex items-center cursor-pointer relative ml-4 max-md:ml-[4.786vw] first:ml-0'
        const chipActive = isActive ? 'ml-0' : ''

        const hidePin = tab.type === MAIN_FANCY.SPORTS_BOOK

        let innerBg =
          'flex items-center px-[10px] py-[7px] h-[30px] bg-(--light-navy) text-white relative font-bold max-md:px-[1.66667vw] max-md:py-[1.3vw] max-md:h-[7.55vw]'

        if (!isActive) {
          innerBg +=
            " before:content-[''] before:absolute before:top-0 before:bottom-0 before:left-[-6px] before:w-[10px] before:rounded-tl-[4px] before:[transform:skew(-14deg,0deg)] before:bg-(--light-navy) before:z-[1] max-md:before:left-[-1.582vw] max-md:before:w-[3.304vw] max-md:before:rounded-tl-[0.522vw] max-md:before:h-[7.6vw]" +
            " after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-[-6px] after:w-[10px] after:rounded-tr-[4px] after:[transform:skew(14deg,0deg)] after:bg-(--light-navy) after:z-[1] max-md:after:right-[-1.782vw] max-md:after:w-[3.304vw] max-md:after:rounded-tr-[0.522vw] max-md:after:h-[7.6vw]"
        } else {
          innerBg = innerBg.replace(
            'bg-(--light-navy)',
            isPremium
              ? '!bg-(--orange)'
              : 'bg-gradient-to-b from-(--md-lightest-navy) to-(--smd-text-color)'
          )
        }

        return (
          <div
            key={tab.type}
            className={cx(chipBase, chipActive)}
            onClick={() => onSelect(tab.type)}
            role="button"
          >
            {tab.type === MAIN_FANCY.SPORTS_BOOK && !isActive && (
              <p className="absolute top-[-5px] right-[-15px] z-[99] mb-0 h-[14px] overflow-visible [filter:drop-shadow(1px_1px_2px_rgba(0,0,0,0.6))] before:absolute before:bottom-[-8px] before:left-[15px] before:h-0 before:w-0 before:border-t-[8px] before:border-r-[7px] before:border-b-0 before:border-l-0 before:border-solid before:border-t-(--xsm-red) before:border-r-transparent before:content-[''] max-md:top-[-3.5667vw] max-md:right-[-5vw] max-md:before:bottom-[-2.3vw] max-md:before:left-[3.5vw] max-md:before:border-t-[1.8vw] max-md:before:border-r-[1.8vw]">
                <span className="rounded-[15px] bg-(--xsm-red) px-2 py-[3px] text-[10px] text-white max-md:rounded-[0.8vw] max-md:px-[1.7vw] max-md:py-[0.2vw]">
                  New
                </span>
              </p>
            )}
            <div className={cx(innerBg)}>
              {isMobile && tab.type !== MAIN_FANCY.SPORTS_BOOK && !hidePin && (
                <i className="relative z-[2] mr-[4vw] before:absolute before:top-[0.2vw] before:right-0 before:bottom-[0.3vw] before:left-[-4vw] before:-z-[1] before:w-[10.5vw] before:[transform:skewX(15deg)] before:bg-(--xsm-blue) before:content-[''] [&_svg]:h-[8vw] [&_svg]:w-[5vw]">
                  <PinSvg />
                </i>
              )}
              {isFirst && (
                <i className="rounded-[3px] bg-gradient-to-t from-(--xs-green-primary) via-(--xs-green-primary) to-(--xs-shadow-primary) max-md:h-[4vw] max-md:w-[4vw] max-md:text-center [&_svg]:max-md:h-[3.8vw] [&_svg]:max-md:w-[3.8vw] [&_svg]:max-md:leading-[3.8vw]">
                  <TimeSvg />
                </i>
              )}
              <span
                className={cx(
                  'inline-block align-middle text-[12px] text-(--xts-gray) max-md:text-[3.73333vw]',
                  isActive && 'ml-2 !text-white'
                )}
              >
                {tab.title}
              </span>
            </div>
            {isActive && (
              <i
                role="button"
                aria-label="Fancy bet rules"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  onInfoClick?.()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    onInfoClick?.()
                  }
                }}
                className={cx(
                  "relative z-[2] inline-flex h-[16px] w-[16px] cursor-pointer px-1 text-center text-white before:absolute before:top-[-7px] before:bottom-[-7px] before:left-[-5px] before:-z-[1] before:w-[28px] before:[transform:skew(14deg,0deg)] before:rounded-tr-[4px] before:content-[''] after:absolute after:top-0 after:left-0 after:z-[1] after:h-[16px] after:w-[16px] after:[background-image:url('/img/svg/info.svg')] after:bg-contain after:bg-center after:bg-no-repeat after:content-[''] max-md:h-[4.45vw] max-md:w-[4vw] max-md:before:top-[-1.6vw] max-md:before:bottom-0 max-md:before:left-[-1vw] max-md:before:h-[7.6vw] max-md:before:w-[7vw] max-md:after:h-[4vw] max-md:after:w-[5vw] max-md:after:[background-image:url('/img/svg/questionMarkRounded.svg')]",
                  isPremium
                    ? 'before:bg-[linear-gradient(180deg,var(--3sm-orange)_0%,var(--orange)_100%)]'
                    : 'before:bg-[linear-gradient(0deg,var(--xl-lightest-navy)_0%,var(--xts-lightest-navy)_100%)]'
                )}
              />
            )}
          </div>
        )
      })}
      {isSportsBookSelected && (
        <p className="mr-[5px] mb-0 ml-auto inline-flex items-center rounded-[3px] bg-(--xl-light-bg) px-2 py-px text-[11px] leading-4 !text-(--light-navy) text-black max-md:-mt-[0.9vw] max-md:mr-[1.86667vw] max-md:h-[6.4vw] max-md:rounded-[1.06667vw] max-md:px-[1.6vw] max-md:text-[3.46667vw] max-md:leading-[6.4vw] [&_i]:mr-1 [&_i]:inline-flex max-md:[&_i]:mr-[1vw] max-md:[&_i]:text-(--light-navy) [&_svg]:h-[11px] [&_svg]:w-[11px] max-md:[&_svg]:h-[3.4666666667vw] max-md:[&_svg]:w-[3.4666666667vw] [&_svg_path]:fill-black">
          <i>
            <WarningSvg />
          </i>
          <span>{t('common.min', 'Min')}</span>
        </p>
      )}
    </div>
  )
})
