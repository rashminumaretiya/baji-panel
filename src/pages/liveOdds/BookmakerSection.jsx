import { Fragment, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import InlineBetSlip from '../../components/GameDetails/InlineBetSlip.jsx'
import FancyProgress from '../../shared/components/FancyProgress.jsx'
import {
  BLUE_MD,
  BLUE_XS,
  BLUE_XS_ACTIVE,
  BLUE_XXS,
  FANCY_INFO_CLOSE_ICON,
  FANCY_INFO_POPUP,
  GAME_STATUS_OVERLAY,
  PRICE_CELL_BASE,
  RED_MD,
  RED_XS,
  RED_XS_ACTIVE,
  RED_XXS,
} from './constants.js'
import { cx, fmt, isBookmakerStatusBlocked, num, titleCase } from './helpers.js'
import { CloseIcon, PinSvg, WarningSvg } from './icons.jsx'
import MatchHeader from './MatchHeader.jsx'
import { PlacingBetStrip } from './PlacingBetStrip.jsx'

export default function BookmakerSection({
  runners,
  setting,
  isMobile,
  infoOpen,
  onToggleInfo,
  active,
  onActiveChange,
  onPick,
  onPlaceBet,
  isPlacingActive,
  fancyProgressMap,
  onFancyProgressClose,
}) {
  const { t } = useTranslation()

  const normalized = useMemo(
    () =>
      runners.map((bm) => ({
        selectionId: bm.sid ?? bm.selectionId,
        runnerName: bm.nat ?? bm.runnerName,
        status: bm.s ?? bm.status ?? 'ACTIVE',
        back: [
          { price: num(bm.b3), size: num(bm.bs3) },
          { price: num(bm.b2), size: num(bm.bs2) },
          { price: num(bm.b1), size: num(bm.bs1) },
        ],
        lay: [
          { price: num(bm.l1), size: num(bm.ls1) },
          { price: num(bm.l2), size: num(bm.ls2) },
          { price: num(bm.l3), size: num(bm.ls3) },
        ],
        min: bm.min,
        max: bm.max,
        mid: bm.mid,
      })),
    [runners]
  )

  const backCellCls = (i, isActiveAny) =>
    cx(
      PRICE_CELL_BASE,
      'h-[42px] !w-[16.66667%] !border-l-0 text-center bg-transparent z-[9] !border-t-0 max-md:!min-w-[18.66667vw] max-md:!h-[11.51vw]',
      i === 2 && BLUE_XS,
      i === 1 && BLUE_MD,
      i === 0 && BLUE_XXS,
      isActiveAny && active?.betType === 'BACK' && i === 2 && BLUE_XS_ACTIVE
    )

  const layCellCls = (i, isActiveAny) =>
    cx(
      PRICE_CELL_BASE,
      'h-[42px] !w-[16.66667%] !border-l-0 text-center bg-transparent z-[9] !border-t-0 max-md:!min-w-[18.66667vw] max-md:!h-[11.51vw]',
      i === 0 && RED_XS,
      i === 1 && RED_MD,
      i === 2 && RED_XXS,
      isActiveAny && active?.betType === 'LAY' && i === 0 && RED_XS_ACTIVE
    )

  return (
    <div>
      <MatchHeader>
        <div className="flex items-center justify-center [&_.icon-wrapper]:flex [&_.icon-wrapper]:items-center [&_.icon-wrapper]:justify-center [&_.icon-wrapper]:max-md:pl-[1.86667vw] md:[&_.icon-wrapper_i]:mr-[6px] md:[&_.icon-wrapper_i]:h-[28px] md:[&_.icon-wrapper_i]:w-[29px] md:[&_.icon-wrapper_i]:[background-image:url('/img/main-s1aea395e8c.png')] md:[&_.icon-wrapper_i]:[background-position:-385px_-833px] md:[&_.icon-wrapper_i]:bg-no-repeat max-md:[&_.icon-wrapper_svg]:block max-md:[&_.icon-wrapper_svg]:h-[6.66667vw] max-md:[&_.icon-wrapper_svg]:w-[6.66667vw] md:[&_.icon-wrapper_svg]:hidden">
          <span className="icon-wrapper">
            <i>
              <PinSvg />
            </i>
          </span>
          <span className="inline-block text-[14px] font-bold text-white max-md:ml-[1.86667vw] max-md:text-[3.46667vw] max-md:leading-[8.53333vw]">
            {t('odds.bookmakerMarket', 'Bookmaker Market')}
            <small className="font-normal opacity-70">
              | {t('odds.zeroCommission', 'Zero Commission')}
            </small>
          </span>
        </div>

        {!isMobile ? (
          <div className="mr-[10px] flex items-center justify-center [&_span]:text-[11px]">
            <span className="rounded-sm bg-(--xl-light-bg) px-[16px] py-[1px] text-[11px]">
              {t('common.min', 'Min')}
            </span>
            <span className="ml-1 inline-block text-white">
              {fmt(setting.min || 1)}
            </span>
            <span className="ml-2 inline-block rounded-sm bg-(--xl-light-bg) px-[16px] py-[1px] text-[11px]">
              {t('common.max', 'Max')}
            </span>
            <span className="ml-1 inline-block text-white">
              {fmt(setting.max || 10000)}
            </span>
          </div>
        ) : (
          <span className="relative mr-[1.86667vw] inline-block rounded-tr-[12px] bg-gradient-to-br from-(--xts-lightest-navy) to-(--mds-lightest-navy) text-white md:px-2 [&_svg]:max-md:h-[4vw] [&_svg]:max-md:w-[4vw]">
            <i
              onClick={onToggleInfo}
              role="button"
              aria-label={t('common.info', 'Info')}
            >
              <WarningSvg />
            </i>
            {infoOpen && (
              <div className={FANCY_INFO_POPUP}>
                <div className="flex flex-1 flex-col">
                  <p>
                    {t('common.min', 'Min')} / {t('common.max', 'Max')}
                  </p>
                  <span>
                    {fmt(setting.min || 1)} / {fmt(setting.max || 1000)}
                  </span>
                </div>
                <i
                  className={FANCY_INFO_CLOSE_ICON}
                  onClick={onToggleInfo}
                  role="button"
                  aria-label={t('common.close', 'Close')}
                >
                  <CloseIcon />
                </i>
              </div>
            )}
          </span>
        )}
      </MatchHeader>

      <div className="mb-4">
        <table className="w-full border-collapse bg-(--light-xs-yellow) max-md:bg-(--light-xts-yellow) [&_td]:border-t [&_td]:border-(--tbl-border-color)">
          <thead className="bg-(--light-xs-yellow) max-md:bg-(--light-xts-yellow)">
            <tr>
              <th className="h-[22px] p-[5px] max-md:h-[8vw]" />
              <th
                colSpan={isMobile ? 1 : 2}
                className="h-[22px] w-[64px] p-[5px] max-md:h-[8vw]"
              />
              {!isMobile && (
                <>
                  <th className="h-[22px] p-[5px] max-md:h-[8vw]" />
                  <th className="h-[22px] w-[64px] p-[5px] max-md:h-[8vw]" />
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {normalized.map((bookmaker, rowIdx) => {
              const isStatusBlocked = isBookmakerStatusBlocked(bookmaker.status)
              const isSuspended = setting.isSuspended || isStatusBlocked
              const isInlineBookmaker =
                active?.selectionId === bookmaker.selectionId && !isSuspended
              const statusLabel = titleCase(
                setting.isSuspended ? 'Suspended' : bookmaker.status || ''
              )
              const isFirstRow = rowIdx === 0

              return (
                <Fragment key={bookmaker.selectionId}>
                  <tr className="bg-(--light-xs-yellow) max-md:bg-(--light-xts-yellow) hover:[&_td]:bg-white/40">
                    <td className="min-w-[170px] bg-(--light-xs-yellow) px-[10px] pt-[4px] !align-top max-md:bg-(--light-xts-yellow) max-md:px-[1.8666666667vw] max-md:py-0 max-md:!align-middle max-md:text-[4vw]">
                      <div className="flex flex-col">
                        <span className="font-bold">
                          {bookmaker.runnerName}
                        </span>
                        <div className="flex items-center" />
                      </div>
                    </td>
                    <td
                      colSpan={isMobile ? 1 : 5}
                      className="w-full p-0 max-md:w-[140px]"
                    >
                      <table
                        align="right"
                        className="relative border-collapse before:absolute before:top-0 before:right-0 before:bottom-0 before:left-0 before:z-0 before:z-1 before:w-1/2 before:bg-[linear-gradient(90deg,rgba(130,183,221,0.15)_0%,rgba(130,183,221,0.8)_65%)] before:content-[''] after:absolute after:top-0 after:right-0 after:bottom-0 after:z-0 after:z-1 after:w-1/2 after:w-[50%+1px] after:bg-[linear-gradient(270deg,rgba(231,170,184,0.15)_5%,rgba(231,170,184,0.8)_60%)] after:content-[''] md:w-full md:max-w-[76%]"
                      >
                        <tbody className="relative">
                          {isSuspended && (
                            <div className="absolute inset-0 z-50 flex h-full w-full items-center justify-center bg-[rgba(36,58,72,0.4)] font-bold text-white/80 text-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
                              Suspended
                            </div>
                          )}
                          <tr className="bg-(--light-xs-yellow)">
                            {bookmaker.back.map((backCell, i) => {
                              if (isMobile && i !== 2) return null
                              const isBestBack = i === 2
                              const showBackHeader = isFirstRow && isBestBack
                              return (
                                <td
                                  key={`back-${i}`}
                                  className={cx(
                                    backCellCls(i, isInlineBookmaker),
                                    showBackHeader &&
                                      "relative before:absolute before:right-0 before:bottom-full before:left-0 before:px-[6px] before:py-[5px] before:text-center before:text-[12px] before:font-bold before:text-(--xs-black) before:content-['Back'] max-md:bg-gradient-to-r max-md:from-[rgba(151,199,234,0.7)] max-md:to-(--xs-lightest-navy) max-md:before:text-[3.46667vw]",
                                    "after:absolute after:inset-[2px] after:-z-[1] after:rounded-[4px] after:border after:border-white after:bg-(--xs-blue) after:content-[''] first-of-type:after:hidden max-md:after:inset-[1vw] [&:nth-of-type(2)]:after:hidden",
                                    isInlineBookmaker &&
                                      active?.betType === 'BACK' &&
                                      isBestBack &&
                                      '!bg-(--xs-blue) !shadow-none'
                                  )}
                                  onClick={() =>
                                    backCell?.price &&
                                    !isSuspended &&
                                    onPick(bookmaker, bookmaker.back[2], 'BACK')
                                  }
                                >
                                  <p className="m-0">{backCell.price || ''}</p>
                                </td>
                              )
                            })}
                            {bookmaker.lay.map((layCell, i) => {
                              if (isMobile && i !== 0) return null
                              const isBestLay = i === 0
                              const showLayHeader = isFirstRow && isBestLay
                              return (
                                <td
                                  key={`lay-${i}`}
                                  className={cx(
                                    layCellCls(i, isInlineBookmaker),
                                    showLayHeader &&
                                      "relative !bg-transparent before:absolute before:right-0 before:bottom-full before:left-0 before:px-[6px] before:py-[5px] before:text-center before:text-[12px] before:font-bold before:text-(--xs-black) before:content-['Lay'] max-md:bg-gradient-to-l max-md:from-(--xts-red) max-md:to-[rgba(247,205,214,0.75)] max-md:before:text-[3.46667vw]",
                                    "after:absolute after:inset-[2px] after:-z-[1] after:rounded-[4px] after:border after:border-white after:bg-(--xs-red) after:content-[''] last-of-type:after:hidden max-md:after:inset-[5px] [&:nth-last-of-type(2)]:after:hidden",
                                    isInlineBookmaker &&
                                      active?.betType === 'LAY' &&
                                      isBestLay &&
                                      '!bg-(--xs-red) !shadow-none'
                                  )}
                                  onClick={() =>
                                    layCell?.price &&
                                    !isSuspended &&
                                    onPick(bookmaker, bookmaker.lay[0], 'LAY')
                                  }
                                >
                                  <p className="m-0">{layCell.price || ''}</p>
                                </td>
                              )
                            })}
                          </tr>
                          {isSuspended && (
                            <tr>
                              <td colSpan={6}>
                                <div className={GAME_STATUS_OVERLAY}>
                                  {isFirstRow && (statusLabel || 'Suspended')}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  {isInlineBookmaker && (
                    <tr>
                      <td colSpan={7} className="p-0">
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
                  {fancyProgressMap?.[bookmaker.selectionId] && (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <FancyProgress
                          config={fancyProgressMap[bookmaker.selectionId]}
                          onClose={() =>
                            onFancyProgressClose?.(bookmaker.selectionId)
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
    </div>
  )
}
