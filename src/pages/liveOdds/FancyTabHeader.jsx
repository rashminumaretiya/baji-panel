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
        'flex items-center border-b-2 border-[var(--sky-blue-light)] max-md:border-b-[1.06667vw] max-md:border-b-[var(--smd-text-color)]',
        isSportsBookSelected && '!border-b-[var(--orange)]'
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
          'flex items-center px-[10px] py-[7px] h-[30px] bg-[var(--light-navy)] text-white relative font-bold max-md:px-[1.66667vw] max-md:py-[1.3vw] max-md:h-[7.55vw]'

        if (!isActive) {
          innerBg +=
            " before:content-[''] before:absolute before:top-0 before:bottom-0 before:left-[-6px] before:w-[10px] before:rounded-tl-[4px] before:[transform:skew(-14deg,0deg)] before:bg-[var(--light-navy)] before:z-[1] max-md:before:left-[-1.582vw] max-md:before:w-[3.304vw] max-md:before:rounded-tl-[0.522vw] max-md:before:h-[7.6vw]" +
            " after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-[-6px] after:w-[10px] after:rounded-tr-[4px] after:[transform:skew(14deg,0deg)] after:bg-[var(--light-navy)] after:z-[1] max-md:after:right-[-1.782vw] max-md:after:w-[3.304vw] max-md:after:rounded-tr-[0.522vw] max-md:after:h-[7.6vw]"
        } else {
          innerBg = innerBg.replace(
            'bg-[var(--light-navy)]',
            isPremium
              ? '!bg-[var(--orange)]'
              : 'bg-gradient-to-b from-[var(--md-lightest-navy)] to-[var(--smd-text-color)]'
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
              <p className="absolute overflow-visible top-[-5px] right-[-15px] h-[14px] z-[99] [filter:drop-shadow(1px_1px_2px_rgba(0,0,0,0.6))] mb-0 max-md:top-[-3.5667vw] max-md:right-[-5vw] before:content-[''] before:absolute before:bottom-[-8px] before:left-[15px] before:w-0 before:h-0 before:border-solid before:border-t-[8px] before:border-r-[7px] before:border-b-0 before:border-l-0 before:border-t-[var(--xsm-red)] before:border-r-transparent max-md:before:border-t-[1.8vw] max-md:before:border-r-[1.8vw] max-md:before:left-[3.5vw] max-md:before:bottom-[-2.3vw]">
                <span className="rounded-[15px] px-2 py-[3px] text-white text-[10px] bg-[var(--xsm-red)] max-md:px-[1.7vw] max-md:py-[0.2vw] max-md:rounded-[0.8vw]">
                  New
                </span>
              </p>
            )}
            <div className={cx(innerBg)}>
              {isMobile && tab.type !== MAIN_FANCY.SPORTS_BOOK && !hidePin && (
                <i className="relative z-[2] mr-[4vw] before:content-[''] before:absolute before:left-[-4vw] before:right-0 before:top-[0.2vw] before:bottom-[0.3vw] before:bg-[var(--xsm-blue)] before:w-[10.5vw] before:[transform:skewX(15deg)] before:-z-[1] [&_svg]:w-[5vw] [&_svg]:h-[8vw]">
                  <PinSvg />
                </i>
              )}
              {isFirst && (
                <i className="bg-gradient-to-t from-[var(--xs-green-primary)] via-[var(--xs-green-primary)] to-[var(--xs-shadow-primary)] rounded-[3px] max-md:w-[4vw] max-md:h-[4vw] max-md:text-center [&_svg]:max-md:w-[3.8vw] [&_svg]:max-md:h-[3.8vw] [&_svg]:max-md:leading-[3.8vw]">
                  <TimeSvg />
                </i>
              )}
              <span
                className={cx(
                  'inline-block align-middle text-[12px] text-[var(--xts-gray)] max-md:text-[3.73333vw]',
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
                  "inline-flex text-center relative text-white z-[2] px-1 w-[16px] h-[16px] cursor-pointer max-md:w-[4vw] max-md:h-[4.45vw] after:content-[''] after:bg-no-repeat after:absolute after:z-[1] after:bg-center after:left-0 after:top-0 after:bg-contain after:w-[16px] after:h-[16px] after:[background-image:url('/img/svg/info.svg')] max-md:after:w-[5vw] max-md:after:h-[4vw] max-md:after:[background-image:url('/img/svg/questionMarkRounded.svg')] before:content-[''] before:absolute before:rounded-tr-[4px] before:[transform:skew(14deg,0deg)] before:-z-[1] before:left-[-5px] before:w-[28px] before:top-[-7px] before:bottom-[-7px] max-md:before:top-[-1.6vw] max-md:before:bottom-0 max-md:before:w-[7vw] max-md:before:h-[7.6vw] max-md:before:left-[-1vw]",
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
        <p className="text-black mb-0 inline-flex items-center bg-[var(--xl-light-bg)] !text-[var(--light-navy)] ml-auto px-2 py-px rounded-[3px] mr-[5px] text-[11px] leading-4 max-md:h-[6.4vw] max-md:px-[1.6vw] max-md:mr-[1.86667vw] max-md:-mt-[0.9vw] max-md:text-[3.46667vw] max-md:leading-[6.4vw] max-md:rounded-[1.06667vw] [&_i]:inline-flex [&_i]:mr-1 [&_svg]:w-[11px] [&_svg]:h-[11px] [&_svg_path]:fill-black max-md:[&_i]:mr-[1vw] max-md:[&_i]:text-[var(--light-navy)] max-md:[&_svg]:w-[3.4666666667vw] max-md:[&_svg]:h-[3.4666666667vw]">
          <i>
            <WarningSvg />
          </i>
          <span>{t('common.min', 'Min')}</span>
        </p>
      )}
    </div>
  )
})
