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
      <div className="text-center p-3 text-[var(--sm-text-color)] text-[12px] bg-white">
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
            <div key={id} className="md:mb-1 mb-0">
              <h2 className="bg-[linear-gradient(180deg,var(--xts-blue)_0%,var(--xts-blue)_100%)] shadow-[0_2px_0_rgba(var(--white-rgb),0.1)] text-white">
                <button
                  type="button"
                  className={`pl-0 flex items-center w-full text-left max-md:bg-[var(--text-color)] max-md:px-0 max-md:pl-[1.8666666667vw] max-md:leading-[8.6vw] max-md:border-b max-md:border-b-[var(--sm-text-color)] max-md:text-white bg-right bg-no-repeat ${isCollapsed ? 'md:bg-[url("/img/grediant-slip-plus.png")]' : 'md:bg-[url("/img/grediant-slip-minus.png")]'}`}
                  onClick={() => toggle(id)}
                >
                  <i className="md:mr-1 inline-flex items-center justify-center bg-gradient-to-b from-[var(--xl-blue)] to-[var(--xs-black)] h-[25px] w-[25px] text-center leading-[22px] text-[var(--sm-white)] hover:bg-gradient-to-b hover:from-[var(--xs-black)] hover:to-[var(--xl-blue)] hover:text-[var(--xs-shadow-primary)] [&_svg]:h-[16px] [&_svg]:w-[18px] max-md:rounded-full max-md:h-[6.6666666667vw] max-md:w-[6.6666666667vw] max-md:leading-normal max-md:bg-[var(--xs-dark)] max-md:mr-[1.4vw] max-md:[&_svg]:w-[4.6666666667vw] max-md:[&_svg]:h-[4.6666666667vw]">
                    <PinSvg />
                  </i>
                  <span className="text-[14px] font-bold max-md:text-[3.4666666667vw] max-md:leading-[1.5] max-md:flex-1">
                    {market.market}
                  </span>
                </button>
              </h2>
              {!isCollapsed && (
                <div className="w-full flex flex-col flex-wrap relative">
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
                            'w-full flex items-center min-h-[40px] border-b border-[var(--sm-text-color)] relative hover:bg-[var(--hover-bg)] max-md:min-h-0 bg-white',
                            isSuspended && 'z-[9]'
                          )}
                          onClick={() => !isSuspended && onPick(market, runner)}
                          role="button"
                        >
                          <p className="m-0 flex-[0_0_60%] w-[60%] py-1 pl-[10px] pr-[5px] max-md:flex-1 max-md:w-auto max-md:font-bold max-md:py-[1.3333333333vw] max-md:px-[1.8666666667vw] max-md:leading-[7vw]">
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
                          <div className="flex items-center flex-[0_0_40%] max-md:flex-[0_0_37.3333333333vw]">
                            <span
                              className={cx(
                                'relative cursor-pointer min-h-[39px] block border border-transparent text-center leading-[34px] max-md:min-h-[11vw] max-md:leading-[10vw] [&_b]:max-md:text-[2.9333333333vw] [&_b]:max-md:font-normal w-full bg-[var(--xs-green)]',
                                isActive &&
                                  'text-white !bg-[var(--lg-green-bg)] shadow-[inset_0_1px_3px_rgba(var(--black-rgb),0.5)]'
                              )}
                            >
                              {isSuspended && (
                                <div className="absolute inset-[-1px] bg-[rgba(var(--black-rgb),0.435)] [backdrop-filter:blur(2px)] text-white flex items-center justify-center cursor-default">
                                  Suspended
                                </div>
                              )}
                              <b>{runner.back?.[0]?.price || ''}</b>
                            </span>
                            <span className="md:inline-block max-md:hidden w-full" />
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
