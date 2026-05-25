import { Fragment, useState } from 'react'
import InlineBetSlip from '../../components/GameDetails/InlineBetSlip.jsx'
import BetExposureCell from '../../components/GameDetails/BetExposureCell.jsx'
import FancyProgress from '../../shared/components/FancyProgress.jsx'
import { SPORTSBOOK_TABS } from './constants.js'
import { cx, titleCase } from './helpers.js'
import { PinSvg } from './icons.jsx'
import { PriorityTabs } from './PriorityTabs.jsx'

export default function SportbookSection({
  markets,
  selectedCategory,
  onSelectCategory,
  active,
  onActiveChange,
  onPick,
  onPlaceBet,
  isPlacingActive,
  exposureByMarket,
  fancyProgressMap,
  onFancyProgressClose,
}) {
  const [collapsed, setCollapsed] = useState({})
  const toggle = (id) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))

  if (!markets.length) {
    return (
      <div className="bg-white p-3 text-center text-[12px] text-(--sm-text-color)">
        No sportsbook markets
      </div>
    )
  }

  return (
    <>
      <PriorityTabs
        tabs={SPORTSBOOK_TABS}
        selectedType={selectedCategory}
        onSelectType={onSelectCategory}
        variant="sport-book"
      />

      <div>
        {markets.map((market, i) => {
          if (!market.runners?.length) return null
          const id = market.marketId || `mkt-${i}`
          const isCollapsed =
            collapsed[id] === undefined ? i > 5 : collapsed[id]
          return (
            <div key={id} className="mb-0 md:mb-1">
              <h2 className="bg-[linear-gradient(180deg,var(--xts-blue)_0%,var(--xts-blue)_100%)] text-white shadow-[0_2px_0_rgba(var(--white-rgb),0.1)]">
                <button
                  type="button"
                  className={`flex w-full items-center bg-right bg-no-repeat pl-0 text-left max-md:border-b max-md:border-b-(--sm-text-color) max-md:bg-(--text-color) max-md:px-0 max-md:pl-[1.8666666667vw] max-md:leading-[8.6vw] max-md:text-white ${isCollapsed ? 'md:bg-[url("/img/grediant-slip-plus.png")]' : 'md:bg-[url("/img/grediant-slip-minus.png")]'}`}
                  onClick={() => toggle(id)}
                >
                  <i className="inline-flex h-[25px] w-[25px] items-center justify-center bg-gradient-to-b from-(--xl-blue) to-(--xs-black) text-center leading-[22px] text-(--sm-white) hover:bg-gradient-to-b hover:from-(--xs-black) hover:to-(--xl-blue) hover:text-(--xs-shadow-primary) max-md:mr-[1.4vw] max-md:h-[6.6666666667vw] max-md:w-[6.6666666667vw] max-md:rounded-full max-md:bg-(--xs-dark) max-md:leading-normal md:mr-1 [&_svg]:h-[16px] [&_svg]:w-[18px] max-md:[&_svg]:h-[4.6666666667vw] max-md:[&_svg]:w-[4.6666666667vw]">
                    <PinSvg />
                  </i>
                  <span className="text-[14px] font-bold max-md:flex-1 max-md:text-[3.4666666667vw] max-md:leading-[1.5]">
                    {market.market}
                  </span>
                </button>
              </h2>
              {!isCollapsed && (
                <div className="relative flex w-full flex-col flex-wrap">
                  {market.runners.map((runner) => {
                    const isSuspended =
                      market.status === '1' && runner.status !== '1'
                    const isActive =
                      active?.selectionId === runner.selectionId &&
                      runner.status === '1'
                    return (
                      <Fragment key={runner.selectionId}>
                        <div
                          className={cx(
                            'relative flex min-h-[40px] w-full items-center border-b border-(--sm-text-color) bg-white hover:bg-(--hover-bg) max-md:min-h-0',
                            isSuspended && 'z-[9]'
                          )}
                          onClick={() => !isSuspended && onPick(market, runner)}
                          role="button"
                        >
                          <p className="m-0 w-[60%] flex-[0_0_60%] py-1 pr-[5px] pl-[10px] max-md:w-auto max-md:flex-1 max-md:px-[1.8666666667vw] max-md:py-[1.3333333333vw] max-md:leading-[7vw] max-md:font-bold">
                            <span className="font-bold">
                              {titleCase(runner.runnerName)}
                            </span>
                            <span className="ml-2 inline-flex items-center">
                              <BetExposureCell
                                selectionId={runner.selectionId}
                                marketId={market.marketId}
                                exposureData={
                                  exposureByMarket?.get(
                                    String(market.marketId)
                                  ) ?? null
                                }
                                marketName="SPORTS_BOOK"
                              />
                            </span>
                          </p>
                          <div className="flex flex-[0_0_40%] items-center max-md:flex-[0_0_37.3333333333vw]">
                            <span
                              className={cx(
                                'relative block min-h-[39px] w-full cursor-pointer border border-transparent bg-(--xs-green) text-center leading-[34px] max-md:min-h-[11vw] max-md:leading-[10vw] [&_b]:max-md:text-[2.9333333333vw] [&_b]:max-md:font-normal',
                                isActive &&
                                  '!bg-(--lg-green-bg) text-white shadow-[inset_0_1px_3px_rgba(var(--black-rgb),0.5)]'
                              )}
                            >
                              {isSuspended && (
                                <div className="absolute inset-[-1px] flex cursor-default items-center justify-center bg-[rgba(var(--black-rgb),0.435)] text-white [backdrop-filter:blur(2px)]">
                                  Suspended
                                </div>
                              )}
                              <b>{runner.back?.[0]?.price || ''}</b>
                            </span>
                            <span className="w-full max-md:hidden md:inline-block" />
                          </div>
                        </div>
                        {isActive && (
                          <div className="w-full">
                            <InlineBetSlip
                              betSlipDetails={active}
                              onChange={onActiveChange}
                              onCancel={() => onActiveChange(null)}
                              onPlaceBet={(slip) =>
                                onPlaceBet?.(slip, () => onActiveChange(null))
                              }
                              isPlacing={isPlacingActive}
                            />
                          </div>
                        )}
                        {fancyProgressMap?.[runner.selectionId] && (
                          <div className="w-full">
                            <FancyProgress
                              config={fancyProgressMap[runner.selectionId]}
                              onClose={() =>
                                onFancyProgressClose?.(runner.selectionId)
                              }
                            />
                          </div>
                        )}
                      </Fragment>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
