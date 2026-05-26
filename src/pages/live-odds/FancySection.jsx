import { Fragment, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '../../utils/cx.js'
import BetExposureCell from '../../components/GameDetails/BetExposureCell.jsx'
import InlineBetSlip from '../../components/GameDetails/InlineBetSlip.jsx'
import FancyProgress from '../../shared/components/FancyProgress.jsx'
import { CloseIcon, PinSvg, TimeSvg, WarningSvg } from './icons.jsx'
import {
  BLUE_XS,
  BLUE_XS_ACTIVE,
  FANCY_INFO_CLOSE_ICON,
  FANCY_INFO_POPUP,
  FANCY_TYPES,
  MAIN_FANCY,
  PRICE_CELL_BASE,
  RED_XS,
  RED_XS_ACTIVE,
  fmt,
  isMarketStatusBlocked,
  titleCase,
} from './shared.js'
import { MatchHeader, PriorityTabs } from './shared.jsx'

const FANCY_TYPE_TABS = [
  { type: FANCY_TYPES.ALL, label: 'All' },
  { type: FANCY_TYPES.SESSION, label: 'Session' },
  { type: FANCY_TYPES.FANCY1, label: 'Fancy1' },
  { type: FANCY_TYPES.ODD_EVEN, label: 'Odd/Even' },
]

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
        isSportsBookSelected && 'border-b-(--orange)!'
      )}
    >
      {tabs.map((tab, i) => {
        const isActive = tab.type === selectedFancy
        const isFirst = i === 0
        const isPremium =
          isSportsBookSelected && tab.type === MAIN_FANCY.SPORTS_BOOK

        const chipCls = cx(
          'inline-flex items-center cursor-pointer relative ml-4 max-md:ml-[4.786vw] first:ml-0',
          isActive && 'ml-0'
        )

       const innerBg = !isActive
          ? 'bg-(--light-navy)'
          : isPremium
            ? '!bg-(--orange)'
            : 'bg-gradient-to-b from-(--md-lightest-navy) to-(--smd-text-color)'

        const innerCls = cx(
          'flex items-center px-[10px] py-[7px] h-[30px] text-white relative font-bold max-md:px-[1.66667vw] max-md:py-[1.3vw] max-md:h-[7.55vw]',
          innerBg,
          !isActive &&
            " before:content-[''] before:absolute before:top-0 before:bottom-0 before:left-[-6px] before:w-[10px] before:rounded-tl-[4px] before:[transform:skew(-14deg,0deg)] before:bg-(--light-navy) before:z-[1] max-md:before:left-[-1.582vw] max-md:before:w-[3.304vw] max-md:before:rounded-tl-[0.522vw] max-md:before:h-[7.7vw] after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-[-6px] after:w-[10px] after:rounded-tr-[4px] after:[transform:skew(14deg,0deg)] after:bg-(--light-navy) after:z-[1] max-md:after:right-[-1.782vw] max-md:after:w-[3.304vw] max-md:after:rounded-tr-[0.522vw] max-md:after:h-[7.7vw]"
        )

        return (
          <div
            key={tab.type}
            className={chipCls}
            onClick={() => onSelect(tab.type)}
            role="button"
          >
            {tab.type === MAIN_FANCY.SPORTS_BOOK && !isActive && (
              <p className="absolute top-[-5px] right-[-15px] z-99 mb-0 h-[14px] overflow-visible filter-[drop-shadow(1px_1px_2px_rgba(0,0,0,0.6))] before:absolute before:bottom-[-8px] before:left-[15px] before:h-0 before:w-0 before:border-t-8 before:border-r-[7px] before:border-b-0 before:border-l-0 before:border-solid before:border-t-(--xsm-red) before:border-r-transparent before:content-[''] max-md:top-[-3.5667vw] max-md:right-[-5vw] max-md:before:bottom-[-2.3vw] max-md:before:left-[3.5vw] max-md:before:border-t-[1.8vw] max-md:before:border-r-[1.8vw]">
                <span className="rounded-[15px] bg-(--xsm-red) px-2 py-[3px] text-[10px] text-white max-md:rounded-[0.8vw] max-md:px-[1.7vw] max-md:py-[0.2vw]">
                  New
                </span>
              </p>
            )}
            <div className={innerCls}>
              {isMobile && isActive && tab.type === MAIN_FANCY.FANCY_BET && (
                <i className="relative z-2 mr-[4vw] before:absolute before:top-[0.2vw] before:right-0 before:bottom-[0.3vw] before:left-[-4vw] before:z-[-1] before:w-[10.5vw] before:transform-[skewX(15deg)] before:bg-(--xsm-blue) before:content-[''] [&_svg]:h-[8vw] [&_svg]:w-[5vw]">
                  <PinSvg />
                </i>
              )}
              {isFirst && (
                <i className="rounded-[3px] bg-linear-to-t from-(--xs-green-primary) via-(--xs-green-primary) to-(--xs-shadow-primary) max-md:h-[4vw] max-md:w-[4vw] max-md:text-center [&_svg]:max-md:h-[3.8vw] [&_svg]:max-md:w-[3.8vw] [&_svg]:max-md:leading-[3.8vw]">
                  <TimeSvg />
                </i>
              )}
              <span
                className={cx(
                  'inline-block align-middle text-[12px] text-(--xts-gray) max-md:text-[3.73333vw]',
                  isActive && 'ml-2 text-white!'
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
                  "relative z-2 inline-flex h-[16px] w-[16px] cursor-pointer px-1 text-center text-white before:absolute before:top-[-7px] before:bottom-[-7px] before:left-[-5px] before:z-[-1] before:w-[28px] before:transform-[skew(14deg,0deg)] before:rounded-tr-[4px] before:content-[''] after:absolute after:top-0 after:left-0 after:z-1 after:h-[16px] after:w-[16px] after:bg-[url('/img/svg/info.svg')] after:bg-contain after:bg-center after:bg-no-repeat after:content-[''] max-md:h-[4.45vw] max-md:w-[4vw] max-md:before:top-[-1.6vw] max-md:before:bottom-0 max-md:before:left-[-1vw] max-md:before:h-[7.7vw] max-md:before:w-[7vw] max-md:after:h-[4vw] max-md:after:w-[5vw] max-md:after:bg-[url('/img/svg/questionMarkRounded.svg')]",
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
        <p className="mr-[5px] mb-0 ml-auto inline-flex items-center rounded-[3px] bg-(--xl-light-bg) px-2 py-px text-[11px] leading-4 text-black max-md:mt-[-0.9vw] max-md:mr-[1.86667vw] max-md:h-[6.4vw] max-md:rounded-[1.06667vw] max-md:px-[1.6vw] max-md:text-[3.46667vw] max-md:leading-[6.4vw] [&_i]:mr-1 [&_i]:inline-flex max-md:[&_i]:mr-[1vw] max-md:[&_i]:text-(--light-navy) [&_svg]:h-[11px] [&_svg]:w-[11px] max-md:[&_svg]:h-[3.4666666667vw] max-md:[&_svg]:w-[3.4666666667vw] [&_svg_path]:fill-black">
          <i>
            <WarningSvg />
          </i>
          <span>{t('common.min', 'Min')}</span>
        </p>
      )}
    </div>
  )
})

export function FancySection({
  items,
  buckets,
  selectedType,
  onSelectType,
  isMobile,
  fancyInfoIndex,
  setFancyInfoIndex,
  active,
  onActiveChange,
  onPick,
  onPlaceBet,
  isPlacingActive,
  exposureData,
  onBookClick,
  fancyProgressMap,
  onFancyProgressClose,
}) {
  const { t } = useTranslation()
  if (!items.length) {
    return (
      <div className="bg-white p-3 text-center text-[12px] text-(--sm-text-color)">
        {t('common.noFancyMarkets', 'No fancy markets')}
      </div>
    )
  }

  // "All" is always available; other tabs only appear when their bucket
  // actually has rows. Aliased the param so it doesn't shadow `t` above.
  const availableTabs = FANCY_TYPE_TABS.filter(
    (tab) =>
      tab.type === FANCY_TYPES.ALL ||
      (buckets[tab.type] && buckets[tab.type].length > 0)
  )

  const hasBookButton = (selectionId) =>
    Array.isArray(exposureData) &&
    exposureData.some((e) => String(e?.id) === String(selectionId))

  return (
    <>
      <PriorityTabs
        tabs={availableTabs}
        selectedType={selectedType}
        onSelectType={onSelectType}
        variant="fancy"
      />

      {!isMobile && (
        <MatchHeader>
          <div className="flex items-center justify-center pr-3 [&_.icon-wrapper]:flex [&_.icon-wrapper]:items-center [&_.icon-wrapper]:justify-center md:[&_.icon-wrapper_i]:mr-[6px] md:[&_.icon-wrapper_i]:h-[28px] md:[&_.icon-wrapper_i]:w-[29px] md:[&_.icon-wrapper_i]:bg-[url('/img/main-s1aea395e8c.png')] md:[&_.icon-wrapper_i]:bg-position-[-385px_-833px] md:[&_.icon-wrapper_i]:bg-no-repeat md:[&_.icon-wrapper_svg]:hidden">
            <span className="icon-wrapper">
              <i>
                <PinSvg />
              </i>
            </span>
            <span className="ml-2 inline-block text-[14px] font-bold text-white">
              Fancy Bet
            </span>
          </div>
        </MatchHeader>
      )}

      <div className="overflow-auto">
        <table className="w-full border-collapse max-md:bg-white">
          <thead>
            <tr>
              <th className="bg-white px-[10px] py-1 text-[12px] font-bold max-md:h-[4.954vw] max-md:p-[1.33333vw_1.86667vw] max-md:text-[3.46667vw]" />
              <th className="bg-white px-[10px] py-1 text-[12px] font-bold max-md:h-[4.954vw] max-md:w-[18.66667vw] max-md:p-[1.33333vw_1.86667vw] max-md:text-[3.46667vw]">
                No
              </th>
              <th className="bg-white px-[10px] py-1 text-[12px] font-bold max-md:h-[4.954vw] max-md:w-[18.66667vw] max-md:p-[1.33333vw_1.86667vw] max-md:text-[3.46667vw]">
                Yes
              </th>
              {!isMobile && (
                <>
                  <th className="bg-white px-[10px] py-1 text-[12px] font-bold" />
                  <th className="bg-white px-[10px] py-1 text-[12px] font-bold max-[1199px]:hidden" />
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const isSuspended = isMarketStatusBlocked(item.GameStatus)
              const isInline =
                active?.selectionId === item.SelectionId && !isSuspended
              const statusLabel = titleCase(item.GameStatus || '')
              const inlineColSpan = isMobile ? 3 : 5

              return (
                <Fragment key={`${item.SelectionId}-${i}`}>
                  {isMobile && (
                    <tr className="bg-(--xsl-blue-bg) max-md:even:[&_td]:border-t-0">
                      <td
                        colSpan={3}
                        className="h-[38px] border-b-0 p-[7px_0_7px_8px] max-md:h-[8.954vw] max-md:p-[1.33333vw_1.86667vw]! [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:text-(--sm-light-bg) max-md:[&_svg]:h-[4vw] max-md:[&_svg]:w-[4vw]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="block w-full max-w-[90%] overflow-hidden font-bold text-ellipsis whitespace-nowrap max-md:text-[3.4666666667vw]!">
                            {item.RunnerName}
                          </span>
                          <span className="relative mr-[1.86667vw] text-white [&_svg]:max-md:h-[4vw] [&_svg]:max-md:w-[4vw]">
                            <i
                              onClick={() =>
                                setFancyInfoIndex(fancyInfoIndex === i ? -1 : i)
                              }
                              role="button"
                              aria-label={t('common.info', 'Info')}
                            >
                              <WarningSvg />
                            </i>
                            {fancyInfoIndex === i && (
                              <div className={FANCY_INFO_POPUP}>
                                <div className="flex flex-1 flex-col">
                                  <p>
                                    {t('common.min', 'Min')} /{' '}
                                    {t('common.max', 'Max')}
                                  </p>
                                  <span>
                                    {fmt(item.min || 1)} /{' '}
                                    {fmt(item.max || 1000)}
                                  </span>
                                </div>
                                <i
                                  className={FANCY_INFO_CLOSE_ICON}
                                  onClick={() => setFancyInfoIndex(-1)}
                                  role="button"
                                  aria-label={t('common.close', 'Close')}
                                >
                                  <CloseIcon />
                                </i>
                              </div>
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr className="hover:bg-(--hover-bg) [&_>td]:bg-white hover:[&_td:last-child]:border-l-(--hover-bg) hover:[&>td]:bg-(--hover-bg)">
                    <td className="relative h-[42px] min-w-[100px] border-t border-t-(--tbl-border-color) px-[10px] py-[5px] max-md:h-[11.51vw] max-md:min-w-[70px]">
                      {!isMobile && (
                        <div>
                          <span className="block w-full max-w-[90%] min-w-[50px] overflow-hidden font-bold text-ellipsis whitespace-nowrap">
                            {item.RunnerName}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <BetExposureCell
                          selectionId={item.SelectionId}
                          marketId={item.default_marketId}
                          exposureData={exposureData}
                          marketName="FANCY"
                        />
                        {hasBookButton(item.SelectionId) && (
                          <button
                            type="button"
                            className="cursor-pointer rounded-[4px] border border-[#cf9a47] bg-[#ffcc51] px-1.5 py-[3px] text-[13px] leading-[1.3] text-(--dark) hover:opacity-90 max-md:rounded-[1.33vw] max-md:p-[1.6vw] max-md:text-[3.2vw]"
                            onClick={() =>
                              onBookClick?.({
                                selectionId: item.SelectionId,
                                runnerName: item.RunnerName,
                              })
                            }
                          >
                            Book
                          </button>
                        )}
                      </div>
                    </td>
                    <td
                      colSpan={2}
                      className="relative h-[42px] w-[10.9%] min-w-[100px] border-t border-t-(--tbl-border-color) p-0 max-md:h-[11.51vw]"
                    >
                      {isSuspended && (
                        <div className="absolute inset-0 z-9 flex cursor-default items-center justify-center bg-[rgba(36,58,72,0.4)] text-[13px] font-bold text-white/80 [text-shadow:0_1px_4px_rgba(0,0,0,0.5)] max-md:text-[3.46667vw]">
                          {statusLabel}
                        </div>
                      )}
                      <table className="w-full border-collapse">
                        <tbody>
                          <tr>
                            <td
                              className={cx(
                                PRICE_CELL_BASE,
                                RED_XS,
                                'h-[42px] min-w-[100px] px-[5px]! max-md:h-[11.51vw]!',
                                isInline &&
                                  active?.betType === 'NO' &&
                                  RED_XS_ACTIVE
                              )}
                              onClick={() => onPick(item, 'NO')}
                            >
                              <p className="m-0">{item.LayPrice1 || ''}</p>
                              <small className="text-[12px] leading-none max-md:text-[2.93333vw]">
                                {!isSuspended && item.LaySize1
                                  ? item.LaySize1
                                  : ''}
                              </small>
                            </td>
                            <td
                              className={cx(
                                PRICE_CELL_BASE,
                                BLUE_XS,
                                'h-[42px] min-w-[100px] px-[5px]! max-md:h-[11.51vw]!',
                                isInline &&
                                  active?.betType === 'YES' &&
                                  BLUE_XS_ACTIVE
                              )}
                              onClick={() => onPick(item, 'YES')}
                            >
                              <p className="m-0">{item.BackPrice1 || ''}</p>
                              <small className="text-[12px] leading-none max-md:text-[2.93333vw]">
                                {!isSuspended && item.BackSize1
                                  ? item.BackSize1
                                  : ''}
                              </small>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    {!isMobile && (
                      <>
                        <td className="relative h-[42px] w-[10.9%] border-t border-white border-t-(--tbl-border-color) px-[10px] py-[5px] max-md:h-[11.51vw]">
                          <p className="mb-0 min-h-[32px] text-left text-[11px] text-(--sm-text-color)">
                            Min/Max
                            <span className="block text-[12px]! whitespace-nowrap text-(--dark)">
                              {fmt(item.min || 1)} / {fmt(item.max || 1000)}
                            </span>
                          </p>
                        </td>
                        <td className="w-[10.9%] border-t border-t-(--tbl-border-color)" />
                      </>
                    )}
                  </tr>
                  {isInline && (
                    <tr>
                      <td colSpan={inlineColSpan} className="p-0">
                        <InlineBetSlip
                          betSlipDetails={active}
                          onChange={onActiveChange}
                          onCancel={() => onActiveChange(null)}
                          onPlaceBet={onPlaceBet}
                          isPlacing={isPlacingActive}
                        />
                      </td>
                    </tr>
                  )}
                  {fancyProgressMap?.[item.SelectionId] && (
                    <tr>
                      <td colSpan={inlineColSpan} className="p-0">
                        <FancyProgress
                          config={fancyProgressMap[item.SelectionId]}
                          onClose={() =>
                            onFancyProgressClose?.(item.SelectionId)
                          }
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
