import { Fragment, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '../../utils/cx.js'
import BetExposureCell from '../../components/GameDetails/BetExposureCell.jsx'
import InlineBetSlip from '../../components/GameDetails/InlineBetSlip.jsx'
import { CloseIcon, InfoIcon } from './icons.jsx'
import {
  BACK_SPARK,
  BG_LINE,
  BLUE_MD,
  BLUE_MD_ACTIVE,
  BLUE_XS,
  BLUE_XS_ACTIVE,
  BLUE_XXS,
  BLUE_XXS_ACTIVE,
  FANCY_INFO_CLOSE_ICON,
  FANCY_INFO_POPUP,
  LAY_SPARK,
  PRICE_CELL_BASE,
  PRICE_LIMIT,
  RED_MD,
  RED_MD_ACTIVE,
  RED_XS,
  RED_XS_ACTIVE,
  RED_XXS,
  RED_XXS_ACTIVE,
  TABLE_TH,
  fmt,
  fmtDate,
  fmtPrice,
  isMarketStatusBlocked,
  num,
} from './shared.js'

// Inline UI used only by MatchOddsSection — keeps the live "Matched / Live"
// bar co-located with the only place it renders.
const MatchedLiveBar = memo(function MatchedLiveBar({
  currency,
  totalMatched,
  showLiveButton,
  isLiveStreamOn,
  onToggleLive,
}) {
  const { t } = useTranslation()
  return (
    <div className="flex">
      <div className="flex items-center text-[13px] [&_span]:font-bold">
        <p className="m-0">{t('common.matched', 'Matched')}</p>
        <span className="ml-1">{currency || 'PBU'}</span>
        <span className="mr-2 ml-1">{fmt(totalMatched)}</span>
      </div>
      {showLiveButton && (
        <button
          type="button"
          className={cx(
            "relative h-[23px] leading-[19px] rounded-[3px] text-white px-[7px] my-[3px] mx-[5px] text-[13px] before:content-[''] before:inline-block before:align-middle before:mr-[5px] before:h-[15px] before:w-[18px]",
            isLiveStreamOn
              ? 'bg-gradient-to-b from-(--mds-orange) to-(--lg-orange) before:[background-image:url(/img/close-live.webp)] before:[background-position:center]'
              : 'bg-gradient-to-b from-(--md-cloud) to-(--lg-cloud) before:[background-image:url(/img/live-icons.webp)] before:[background-position:-396px_-2453px]'
          )}
          onClick={onToggleLive}
        >
          {t('common.live', 'Live')}
        </button>
      )}
    </div>
  )
})

// Predicate used in both the back- and lay-cell render paths. Replaces a
// repeated 3-line boolean chain (`active?.selectionId === ... && betType === ...
// && Number(active?.odd) === Number(price)`) so each call site stays readable.
const isCellActive = (active, runner, betType, price) =>
  active?.selectionId === runner.selectionId &&
  active?.betType === betType &&
  Number(active?.odd) === Number(price)

export function MatchOddsSection({
  matchOdds,
  isMobile,
  isAuthenticated,
  isYellowTheme,
  currency,
  marketSetting,
  isStreamAvailable,
  isLiveStreamOn,
  onToggleLive,
  exposureData,
  active,
  onPick,
  onCancelMatchOdds,
  onSlipChange,
  onPlaceBet,
  isPlacingActive,
  betLimitOpen,
  onToggleBetLimit,
  liveStreamSlot,
}) {
  const { t } = useTranslation()
  if (!matchOdds) return null
  const totalMatched = num(matchOdds.totalMatched)
  const minMaxStr = `${fmt(marketSetting.min || 1)} / ${fmt(marketSetting.max || 100)}`

  const matchOddsTabClass = isYellowTheme
    ? 'inline-block relative font-bold mr-0 max-md:!bg-gradient-to-t max-md:!from-[#ffa10c] max-md:!to-(--md-primary-yellow) max-md:border max-md:!border-(--coffee) max-md:!text-(--dark) max-md:px-[3.4vw] max-md:rounded-[4.8vw] max-md:text-[3.46667vw] max-md:leading-[9.06667vw] md:bg-(--sm-white) md:text-(--xxl-blue) md:px-[2px] md:py-[8px_2px_7px_10px] md:py-2 md:pl-[10px] md:pr-[2px] md:text-[13px] md:mr-5 md:after:content-[""] md:after:absolute md:after:[background-image:url(/img/main-s1aea395e8c.webp)] md:after:z-[1] md:after:bottom-0 md:after:top-0 md:after:-right-5 md:after:h-[30px] md:after:[background-position:432px_1725px] md:after:w-5'
    : 'inline-block relative font-bold mr-0 max-md:text-white max-md:border max-md:border-[rgba(var(--md-dark-rgb),0.3)] max-md:bg-gradient-to-b max-md:from-(--xs-primary) max-md:to-(--xxs-primary) max-md:px-[3.4vw] max-md:rounded-[4.8vw] max-md:text-[3.46667vw] max-md:leading-[9.06667vw] md:bg-(--sm-white) md:text-(--xxl-blue) md:pl-[10px] md:pr-[2px] md:pb-[7px] md:pt-2 md:text-[13px] md:mr-5 md:after:content-[""] md:after:absolute md:after:[background-image:url(/img/main-s1aea395e8c.webp)] md:after:z-[1] md:after:bottom-0 md:after:top-0 md:after:-right-5 md:after:h-[30px] md:after:[background-position:432px_1725px] md:after:w-5'

  return (
    <div className="md:mb-[30px]">
      <div className="relative flex flex-wrap items-center justify-between">
        <div className="w-full">
          <div
            className={cx(
              'relative flex justify-between border-b border-(--sm-text-color) bg-white',
              'max-md:border-b-0 max-md:bg-(--light-bg) max-md:p-[1.86667vw]'
            )}
          >
            <div>
              <span className={matchOddsTabClass}>
                {t('odds.matchOdds', 'Match Odds')}
              </span>
              {!isMobile && (
                <span
                  className={cx(
                    'ml-2 inline-block align-text-bottom text-[13px]',
                    matchOdds.inplay ? 'text-(--dark-green)' : 'text-inherit'
                  )}
                >
                  <i
                    className={cx(
                      "mr-[5px] inline-block h-[15px] w-[15px] bg-[url('/img/main-s1aea395e8c.webp')] align-middle",
                      matchOdds.inplay
                        ? 'bg-position-[-399px_-2401px]'
                        : 'bg-position-[-399px_-2869px]'
                    )}
                  />
                  <span className="ml-1 inline-block align-middle">
                    {matchOdds.inplay
                      ? t('common.inPlay', 'In-Play')
                      : fmtDate(matchOdds.marketStartTime)}
                  </span>
                </span>
              )}
            </div>
            {!isMobile && (
              <>
                <div className="absolute top-0 left-1/2 mx-[5px] my-[7px] flex -translate-x-1/2 rounded-[3px] bg-(--xl-light-bg) px-[6px] text-[12px] leading-4 text-black">
                  <p className="mb-0">
                    {t('common.min', 'Min')}/ {t('common.max', 'Max')}
                  </p>
                  <p className="mb-0 ml-1">
                    <small className="text-[13px] text-(--light-navy)">
                      {minMaxStr}
                    </small>
                  </p>
                </div>
                <MatchedLiveBar
                  currency={currency}
                  totalMatched={totalMatched}
                  showLiveButton={isAuthenticated && isStreamAvailable}
                  isLiveStreamOn={isLiveStreamOn}
                  onToggleLive={onToggleLive}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {liveStreamSlot}

      <div className="overflow-auto">
        <table className="w-full border-separate [border-spacing:1px_0] max-md:bg-white">
          <thead>
            <tr>
              {isMobile ? (
                <>
                  <th className={cx(TABLE_TH, 'text-start whitespace-nowrap')}>
                    <div className="flex items-center">
                      <div className="relative bg-(--light-bg) max-md:m-[-1.86vw_3.7vw_-2vw_-1.9vw] max-md:p-[2.13333vw_1.86667vw_3.2vw_1.86667vw] max-md:before:absolute max-md:before:top-0 max-md:before:left-[10.4vw] max-md:before:border-b-[14.33333vw] max-md:before:border-l-[1.86667vw] max-md:before:border-b-transparent max-md:before:border-l-(--light-bg) max-md:before:content-[''] [&_svg]:max-md:h-[6.66667vw] [&_svg]:max-md:w-[6.66667vw]">
                        <InfoIcon onClick={onToggleBetLimit} />
                        {betLimitOpen && (
                          <div
                            className={cx(
                              FANCY_INFO_POPUP,
                              'left-0 w-max [&_svg]:h-[14px]! [&_svg]:w-[14px]!'
                            )}
                          >
                            <div>
                              <p>{t('common.max', 'Max')}</p>
                              <span>{fmt(marketSetting.max || 100)}</span>
                            </div>
                            <i
                              className={FANCY_INFO_CLOSE_ICON}
                              onClick={onToggleBetLimit}
                              role="button"
                            >
                              <CloseIcon />
                            </i>
                          </div>
                        )}
                      </div>
                      <i className="bg-[url('/img/svg/barChart.svg')] bg-contain bg-no-repeat max-md:h-[6.66667vw] max-md:w-[6.5vw]" />
                      <div className="max-md:pl-[1.86667vw] [&_p]:mt-1 [&_p]:leading-[7px] [&_p]:font-normal [&_p]:max-md:text-[2.93333vw] [&_span]:font-bold [&_span]:max-md:text-[2.93333vw]">
                        <p className="mb-0">{t('common.matched', 'Matched')}</p>
                        <span>{currency || 'PBU'}</span>{' '}
                        <span>{fmt(totalMatched)}</span>
                      </div>
                    </div>
                  </th>
                  <th className={cx(TABLE_TH, 'w-[18.66667vw]!')}>
                    {t('common.back', 'Back')}
                  </th>
                  <th className={cx(TABLE_TH, 'w-[18.66667vw]!')}>
                    {t('common.lay', 'Lay')}
                  </th>
                </>
              ) : (
                <>
                  <th
                    className={cx(
                      TABLE_TH,
                      'pt-[20px] pl-1 text-start whitespace-nowrap text-(--sm-text-color)'
                    )}
                  >
                    {matchOdds.numberOfRunners ??
                      matchOdds.runners?.length ??
                      0}{' '}
                    {t('common.selection', 'Selection')}
                  </th>
                  <th colSpan={3} className={cx(TABLE_TH, 'text-start')}>
                    101%
                  </th>
                  <th colSpan={3} className={cx(TABLE_TH, 'text-end')}>
                    99.6%
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {(matchOdds.runners ?? []).map((runner, rowIdx) => {
              const back = runner.ex?.availableToBack ?? []
              const lay = runner.ex?.availableToLay ?? []
              const runnerExt = {
                ...runner,
                _marketId: matchOdds.marketId,
                _marketName: matchOdds.marketName || 'Match Odds',
                _eventTitle:
                  matchOdds.eventName ||
                  matchOdds.eventTitle ||
                  matchOdds.event?.name ||
                  '',
              }
              const isSuspended =
                marketSetting.isSuspended ||
                isMarketStatusBlocked(matchOdds.status) ||
                isMarketStatusBlocked(runner.status)

              const isBelowMatchedFloor =
                !!marketSetting.pbuLimit &&
                totalMatched < marketSetting.pbuLimit

              // A price cell is "barred" (rendered with the dashed BG_LINE
              // overlay, not clickable) if any of: market is suspended, no
              // price, total matched hasn't crossed pbuLimit, or price is
              // above the global PRICE_LIMIT cap.
              const isPriceBarred = (price) =>
                isSuspended ||
                !price ||
                isBelowMatchedFloor ||
                price > PRICE_LIMIT

              const backCells = isMobile
                ? [back[0]]
                : [back[2], back[1], back[0]]
              const layCells = isMobile ? [lay[0]] : [lay[0], lay[1], lay[2]]
              const backClasses = isMobile
                ? [BLUE_XS]
                : [BLUE_XXS, BLUE_MD, BLUE_XS]
              const layClasses = isMobile ? [RED_XS] : [RED_XS, RED_MD, RED_XXS]
              const backActiveClasses = isMobile
                ? [BLUE_XS_ACTIVE]
                : [BLUE_XXS_ACTIVE, BLUE_MD_ACTIVE, BLUE_XS_ACTIVE]
              const layActiveClasses = isMobile
                ? [RED_XS_ACTIVE]
                : [RED_XS_ACTIVE, RED_MD_ACTIVE, RED_XXS_ACTIVE]

              const isFirstRow = rowIdx === 0

              return (
                <Fragment key={runner.selectionId}>
                  <tr className="hover:[&>td:first-child:not(.price)]:bg-(--mds-light-bg)">
                    <td
                      className="bg-white text-start px-[10px] py-[3px] text-(--header-primary) border-t border-(--tbl-border-color) h-[40px] max-md:bg-transparent max-md:px-[1.8666666667vw] max-md:py-[0.3333333333vw] max-md:h-[11.51vw] max-md:text-[4vw]"
                    >
                      <div className="flex flex-col">
                        <p className="mb-1 [display:-webkit-box] min-w-[150px] overflow-hidden font-bold text-ellipsis [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                          <i className="mr-[5px] inline-block h-[15px] w-[15px] bg-[url('/img/main-s1aea395e8c.webp')] bg-position-[-398px_-1968px] bg-no-repeat align-bottom" />
                          {runner.runnerName || runner.runner}
                        </p>
                        <div className="flex items-center">
                          <BetExposureCell
                            selectionId={runner.selectionId}
                            marketId={matchOdds.marketId}
                            exposureData={exposureData}
                            marketName="MATCH_ODDS"
                          />
                        </div>
                      </div>
                    </td>
                    {/* BACK columns — Angular: @for back of matchOdd.back; classes blue-xxs/blue-md/blue-xs */}
                    {backCells.map((cell, idx) => {
                      const price = cell?.price
                      const tone = backClasses[idx]
                      const isBestBack =
                        (isMobile && idx === 0) || (!isMobile && idx === 2)
                      const isActive = isCellActive(active, runner, 'BACK', price)
                      const showBackAllHeader =
                        isFirstRow && isBestBack && !isMobile
                      const barred = isPriceBarred(price)
                      return (
                        <td
                          key={`b-${idx}`}
                          className={cx(
                            PRICE_CELL_BASE,
                            tone,
                            cell?.isChanged && BACK_SPARK,
                            barred && BG_LINE,
                            isActive && backActiveClasses[idx],
                            showBackAllHeader &&
                              "relative before:pointer-events-none before:absolute before:bottom-full before:left-1/2 before:h-[22px] before:w-full before:-translate-x-1/2 before:border-b before:border-white before:bg-[url('/img/main-s1aea395e8c.webp')] before:bg-position-[-274px_-317px] before:bg-no-repeat before:leading-[23px] before:font-semibold before:text-(--xs-black) before:content-['Back_All']"
                          )}
                          onClick={() =>
                            !barred && onPick(runnerExt, cell, 'BACK')
                          }
                        >
                          <p className="m-0">{fmtPrice(price)}</p>
                          <span>{fmtPrice(cell?.size)}</span>
                        </td>
                      )
                    })}
                    {/* LAY columns — Angular: @for lay of matchOdd.lay; classes red-xs/red-md/red-xxs */}
                    {layCells.map((cell, idx) => {
                      const price = cell?.price
                      const tone = layClasses[idx]
                      const isBestLay = idx === 0
                      const isActive = isCellActive(active, runner, 'LAY', price)
                      const showLayAllHeader =
                        isFirstRow && isBestLay && !isMobile
                      const isLastLay = idx === layCells.length - 1
                      const barred = isPriceBarred(price)
                      return (
                        <td
                          key={`l-${idx}`}
                          className={cx(
                            PRICE_CELL_BASE,
                            tone,
                            isLastLay && 'border-l border-white',
                            cell?.isChanged && LAY_SPARK,
                            barred && BG_LINE,
                            isActive && layActiveClasses[idx],
                            showLayAllHeader &&
                              "relative before:pointer-events-none before:absolute before:bottom-full before:left-1/2 before:h-[22px] before:w-full before:-translate-x-1/2 before:border-b before:border-white before:bg-[url('/img/main-s1aea395e8c.webp')] before:bg-position-[100%_-399px] before:bg-no-repeat before:leading-[23px] before:font-semibold before:text-(--xs-black) before:content-['Lay_All']"
                          )}
                          onClick={() =>
                            !barred && onPick(runnerExt, cell, 'LAY')
                          }
                        >
                          <p className="m-0">{fmtPrice(price)}</p>
                          <span>{fmtPrice(cell?.size)}</span>
                        </td>
                      )
                    })}
                  </tr>
                  {/* md: inline bet slip below the active runner — Angular parity.
                      Desktop: bet slip lives in the right-side <BetSlip /> panel via Redux. */}
                  {isMobile && active?.selectionId === runner.selectionId && (
                    <tr>
                      <td colSpan={3} className="p-0">
                        <InlineBetSlip
                          betSlipDetails={{
                            ...active,

                            type: active.betType,
                            runnerId: active.selectionId,
                            runnerName: active.selectionName,
                            odds: active.odd,
                            min: active.min ?? marketSetting.min ?? 1,
                            max: active.max ?? marketSetting.max ?? 100,
                            stake: active.stake ?? 0,
                          }}
                          onChange={(updated) => {
                            onSlipChange?.({
                              ...active,
                              odd: Number(updated.odds ?? active.odd) || 0,
                              size: Number(updated.size ?? active.size) || 0,
                              stake: Number(updated.stake ?? active.stake) || 0,
                            })
                          }}
                          onCancel={onCancelMatchOdds}
                          onPlaceBet={onPlaceBet}
                          isPlacing={isPlacingActive}
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
