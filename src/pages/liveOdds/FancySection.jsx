import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import InlineBetSlip from '../../components/GameDetails/InlineBetSlip.jsx'
import BetExposureCell from '../../components/GameDetails/BetExposureCell.jsx'
import FancyProgress from '../../shared/components/FancyProgress.jsx'
import {
  BLUE_XS,
  BLUE_XS_ACTIVE,
  FANCY_INFO_CLOSE_ICON,
  FANCY_INFO_POPUP,
  FANCY_TYPE_TABS,
  FANCY_TYPES,
  PRICE_CELL_BASE,
  RED_XS,
  RED_XS_ACTIVE,
} from './constants.js'
import { cx, fmt, isMarketStatusBlocked, titleCase } from './helpers.js'
import { CloseIcon, PinSvg, WarningSvg } from './icons.jsx'
import MatchHeader from './MatchHeader.jsx'
import { PlacingBetStrip } from './PlacingBetStrip.jsx'
import { PriorityTabs } from './PriorityTabs.jsx'

export default function FancySection({
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

  const availableTabs = FANCY_TYPE_TABS.filter(
    (tab) =>
      tab.type === FANCY_TYPES.ALL ||
      (buckets[tab.type] && buckets[tab.type].length > 0)
  )

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
          <div className="flex items-center justify-center pr-3 [&_.icon-wrapper]:flex [&_.icon-wrapper]:items-center [&_.icon-wrapper]:justify-center md:[&_.icon-wrapper_i]:mr-[6px] md:[&_.icon-wrapper_i]:h-[28px] md:[&_.icon-wrapper_i]:w-[29px] md:[&_.icon-wrapper_i]:[background-image:url('/img/main-s1aea395e8c.png')] md:[&_.icon-wrapper_i]:[background-position:-385px_-833px] md:[&_.icon-wrapper_i]:bg-no-repeat md:[&_.icon-wrapper_svg]:hidden">
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
                active &&
                active.selectionId === item.SelectionId &&
                !isSuspended
              const statusLabel = titleCase(item.GameStatus || '')

              return (
                <Fragment key={`${item.SelectionId}-${i}`}>
                  {isMobile && (
                    <tr className="bg-(--xsl-blue-bg) max-md:even:[&_td]:border-t-0">
                      <td
                        colSpan={3}
                        className="h-[38px] border-b-0 p-[7px_0_7px_8px] max-md:h-[8.954vw] max-md:!p-[1.33333vw_1.86667vw] [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:text-(--sm-light-bg) max-md:[&_svg]:h-[4vw] max-md:[&_svg]:w-[4vw]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="block w-full max-w-[90%] overflow-hidden font-bold text-ellipsis whitespace-nowrap max-md:!text-[3.4666666667vw]">
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
                        {Array.isArray(exposureData) &&
                          exposureData.some(
                            (e) => String(e?.id) === String(item.SelectionId)
                          ) && (
                            <button
                              type="button"
                              className="cursor-pointer rounded-[4px] border border-[#cf9a47] bg-[#ffcc51] px-1.5 py-[3px] text-[13px] leading-[1.3] text-[color:var(--dark)] hover:opacity-90 max-md:rounded-[1.33vw] max-md:p-[1.6vw] max-md:text-[3.2vw]"
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
                        <div className="absolute inset-0 z-[9] flex cursor-default items-center justify-center bg-[rgba(36,58,72,0.4)] text-[13px] font-bold text-white/80 [text-shadow:0_1px_4px_rgba(0,0,0,0.5)] max-md:text-[3.46667vw]">
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
                                'h-[42px] min-w-[100px] !px-[5px] max-md:!h-[11.51vw]',
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
                                'h-[42px] min-w-[100px] !px-[5px] max-md:!h-[11.51vw]',
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
                            <span className="block !text-[12px] whitespace-nowrap text-(--dark)">
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
                      <td colSpan={isMobile ? 3 : 5} className="p-0">
                        <InlineBetSlip
                          betSlipDetails={active}
                          onChange={onActiveChange}
                          onCancel={() => onActiveChange(null)}
                          onPlaceBet={onPlaceBet}
                          isPlacing={isPlacingActive}
                        />
                        {isPlacingActive && <PlacingBetStrip />}
                      </td>
                    </tr>
                  )}
                  {fancyProgressMap?.[item.SelectionId] && (
                    <tr>
                      <td colSpan={isMobile ? 3 : 5} className="p-0">
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
