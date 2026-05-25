import { Fragment, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import {
  selectIsMobile,
  selectIsYellowTheme,
} from '../store/slices/commonSlice.js'
import {
  fetchOpenBets,
  selectActiveBetSlip,
  selectOpenBets,
} from '../store/slices/betSlipSlice.js'
import { selectIsAuthenticated } from '../store/slices/authSlice.js'
import Collapse from '../shared/components/primitives/Collapse.jsx'
import SvgIcon from './SvgIcon.jsx'

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0)
}

function titleCaseBetType(t) {
  if (!t) return ''
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${s} `
}
const TH_BASE =
  'relative px-1.5 py-2 font-medium leading-[14px] text-[11px] whitespace-nowrap border-b border-white text-[var(--dark)] max-md:text-[2.93333vw] max-md:leading-[1.3] max-md:py-[1.8vw] max-md:px-[1.86667vw] max-md:text-[var(--dark)] after:content-[""] after:absolute after:w-px after:h-1/2 after:top-1/2 after:right-0 after:-translate-y-1/2 after:rounded-[1px]'
const TD_BASE =
  'font-medium px-1.5 py-2 text-[11px] align-middle overflow-hidden text-center bg-transparent border-b border-white max-md:py-[1.33333vw] max-md:px-[1.86667vw] max-md:[&_p]:text-[3.46667vw] max-md:[&_p]:leading-[1.3]'
const ODD_TYPE_CHIP =
  'm-0 px-1 py-[3px] rounded text-[var(--dark)] w-8 text-center odd-type max-md:rounded-[1.06667vw] max-md:text-[3.46667vw] max-md:leading-[7vw] max-md:w-[12vw] max-md:p-0'
const ROW_LIGHT_BACK =
  'bg-[var(--md-blue-bg)] [&_.odd-type]:bg-[var(--xs-blue)] max-md:[&_td]:border-b max-md:[&_td]:border-[var(--xs-blue)]'
const ROW_LIGHT_LAY =
  'bg-[var(--md-red-bg)] [&_.odd-type]:bg-[var(--xs-red)] max-md:[&_td]:border-b max-md:[&_td]:border-[var(--xs-red)]'

function NoOpenBets({ isYellowTheme }) {
  const { t } = useTranslation()
  if (isYellowTheme) {
    return (
      <div className="text-center mt-3 flex flex-col items-center [&>p]:m-0 [&>p]:text-[17px]">
        <p>{t('openBets.noBetsPlaced', 'No bets placed')}</p>
        <p>{t('openBets.youHaveNoOpenBets', 'You have no open bets')}</p>
      </div>
    )
  }

  return (
    <p className="text-center my-4 text-xs max-[991px]:text-[12px]">
      {t('openBets.noOpenBetsAvailable', 'No open bets available.')}
    </p>
  )
}

function BackBetsTable({ openBetsValue, betInfo, timeOrder }) {
  const { t } = useTranslation()
  const isFancy = openBetsValue?.event?.type === 'Fancy'
  const isSportsBook = openBetsValue?.event?.type === 'Sports Book'
  const backBets = openBetsValue?.bets?.back ?? []

  if (!backBets.length) return null

  return (
    <table className="w-full mb-0">
      <thead>
        <tr>
          {isFancy ? (
            <>
              <th
                colSpan={2}
                className={`${TH_BASE} text-left w-[45%] max-md:w-[61%] max-md:font-semibold`}
              >
                {t('odds.yes', 'Yes')}
              </th>
              <th className={`${TH_BASE} text-center w-[20%]`}>
                {t('common.runsOdds', 'Runs/Odds')}
              </th>
            </>
          ) : (
            <>
              <th
                colSpan={2}
                className={`${TH_BASE} text-left w-[45%] max-md:w-[61%] max-md:font-semibold`}
              >
                {t('odds.backBetFor', 'Back (Bet For)')}
              </th>
              <th className={`${TH_BASE} text-center w-[20%]`}>
                {t('common.odds', 'Odds')}
              </th>
            </>
          )}
          <th className={`${TH_BASE} text-center w-[20%]`}>
            {t('common.stake', 'Stake')}
          </th>
          <th
            className={`${TH_BASE} text-right w-[20%] whitespace-nowrap overflow-hidden text-ellipsis max-w-[52px]`}
          >
            {timeOrder
              ? t('common.profitLiability', 'Profit/Liability')
              : t('common.profit', 'Profit')}
          </th>
        </tr>
      </thead>
      <tbody>
        {backBets.map((openBet, index) => (
          <Fragment key={`back-group-${index}`}>
            {betInfo && (
              <tr className="bg-[#beddf466]">
                <td colSpan={5} className={`${TD_BASE} text-left w-[8%] pr-0`}>
                  <span>{t('common.ref', 'Ref')}: </span>
                  <span>{formatDateTime(openBet.betPlacedAt)}</span>
                </td>
              </tr>
            )}
            <tr className={ROW_LIGHT_BACK}>
              <td
                className={`${TD_BASE} w-[8%] pr-0 max-md:[&:first-of-type]:pr-[1.86667vw]`}
              >
                <div>
                  <div className={ODD_TYPE_CHIP}>
                    <span>
                      {isSportsBook
                        ? openBet.selectedRunnerName
                        : titleCaseBetType(openBet.betType)}
                    </span>
                  </div>
                </div>
              </td>
              <td className={TD_BASE}>
                <div className="flex flex-col items-start text-left">
                  <span className="m-0 w-[100px] [-webkit-line-clamp:2] [display:-webkit-box] [-webkit-box-orient:vertical] overflow-hidden text-ellipsis font-semibold text-[12px] text-[var(--lg-blue)] max-md:text-[3.46667vw] max-md:leading-[1.3] max-md:whitespace-nowrap max-md:block max-md:text-[var(--dark)] max-md:w-[19.038vw]">
                    {openBet?.selection?.name}
                  </span>
                </div>
              </td>
              <td className={TD_BASE}>
                <p className="m-0">
                  {isFancy
                    ? `${openBet.odd}/${openBet.size}`
                    : formatNumber(openBet.odd)}
                </p>
              </td>
              <td className={TD_BASE}>
                <p className="m-0">{formatNumber(openBet.stake)}</p>
              </td>
              <td className={TD_BASE}>
                <p className="m-0 text-right">
                  {formatNumber(openBet.profitLoss)}
                </p>
              </td>
            </tr>
          </Fragment>
        ))}
      </tbody>
    </table>
  )
}

function LayBetsTable({ openBetsValue, betInfo, timeOrder }) {
  const { t } = useTranslation()
  const isFancy = openBetsValue?.event?.type === 'Fancy'
  const isSportsBook = openBetsValue?.event?.type === 'Sports Book'
  const layBets = openBetsValue?.bets?.lay ?? []

  if (!layBets.length) return null

  return (
    <table className="w-full mb-0">
      <thead>
        <tr>
          {isFancy ? (
            <>
              <th
                colSpan={2}
                className={`${TH_BASE} text-left w-[45%] max-md:w-[61%] max-md:font-semibold`}
              >
                {t('odds.no', 'No')}
              </th>
              <th className={`${TH_BASE} text-center w-[20%]`}>
                {t('common.runsOdds', 'Runs/Odds')}
              </th>
            </>
          ) : (
            <>
              <th
                colSpan={2}
                className={`${TH_BASE} text-left w-[45%] max-md:w-[61%] max-md:font-semibold`}
              >
                {t('odds.layBetAgainst', 'Lay (Bet Against)')}
              </th>
              <th className={`${TH_BASE} text-center w-[20%]`}>
                {t('common.odds', 'Odds')}
              </th>
            </>
          )}
          <th className={`${TH_BASE} text-center w-[20%]`}>
            {t('common.stake', 'Stake')}
          </th>
          <th
            className={`${TH_BASE} text-right w-[20%] whitespace-nowrap overflow-hidden text-ellipsis max-w-[52px]`}
          >
            {timeOrder
              ? t('common.profitLiability', 'Profit/Liability')
              : t('common.liability', 'Liability')}
          </th>
        </tr>
      </thead>
      <tbody>
        {layBets.map((openBet, index) => (
          <Fragment key={`lay-group-${index}`}>
            {betInfo && (
              <tr className="bg-[#faeff2]">
                <td colSpan={5} className={`${TD_BASE} text-left w-[8%] pr-0`}>
                  <span>{t('common.ref', 'Ref')}: </span>
                  <span>{formatDateTime(openBet.betPlacedAt)}</span>
                </td>
              </tr>
            )}
            <tr className={ROW_LIGHT_LAY}>
              <td
                className={`${TD_BASE} w-[8%] pr-0 max-md:[&:first-of-type]:pr-[1.86667vw]`}
              >
                <div>
                  <div className={ODD_TYPE_CHIP}>
                    <span>
                      {isSportsBook
                        ? openBet.selectedRunnerName
                        : titleCaseBetType(openBet.betType)}
                    </span>
                  </div>
                </div>
              </td>
              <td className={TD_BASE}>
                <div className="flex flex-col items-start text-left">
                  <span className="m-0 w-[100px] [-webkit-line-clamp:2] [display:-webkit-box] [-webkit-box-orient:vertical] overflow-hidden text-ellipsis font-semibold text-[12px] text-[var(--lg-blue)] max-md:text-[3.46667vw] max-md:leading-[1.3] max-md:whitespace-nowrap max-md:block max-md:text-[var(--dark)] max-md:w-[19.038vw]">
                    {openBet?.selection?.name}
                  </span>
                </div>
              </td>
              <td className={TD_BASE}>
                <p className="m-0">
                  {isFancy
                    ? `${openBet.odd}/${openBet.size}`
                    : formatNumber(openBet.odd)}
                </p>
              </td>
              <td className={TD_BASE}>
                <p className="m-0">{formatNumber(openBet.stake)}</p>
              </td>
              <td className={TD_BASE}>
                <p className="m-0 text-right">
                  {formatNumber(openBet.liability)}
                </p>
              </td>
            </tr>
          </Fragment>
        ))}
      </tbody>
    </table>
  )
}

function OpenBetsListBackLay({
  openBetsValue,
  betInfo,
  timeOrder,
  isOpen,
  isMobile,
  onBetInfoChange,
  onTimeOrderChange,
}) {
  const { t } = useTranslation()
  if (!openBetsValue) return null

  const wrapperClass = isOpen
    ? 'max-h-[200px] overflow-y-auto max-md:max-h-none max-md:overflow-visible'
    : 'max-h-[calc(100vh-360px)] overflow-y-auto max-md:max-h-[calc(100vh-81px)]'

  return (
    <>
      <h6 className="p-2 m-0 text-[12px] font-bold bg-[var(--xl-th-bg)] max-md:px-[1.86667vw] max-md:bg-[image:linear-gradient(-180deg,var(--xl-blue)_0%,var(--xxl-blue)_82%)] max-md:text-[3.73333vw] max-md:leading-[2.2] max-md:text-white max-md:font-semibold">
        {t('common.matched', 'Matched')}
      </h6>
      <div className={`overflow-x-auto ${wrapperClass}`}>
        <BackBetsTable
          openBetsValue={openBetsValue}
          betInfo={betInfo}
          timeOrder={timeOrder}
        />
        <LayBetsTable
          openBetsValue={openBetsValue}
          betInfo={betInfo}
          timeOrder={timeOrder}
        />
      </div>
      {isMobile && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <div className="ml-2 flex">
            <div className="flex items-center">
              <input
                className="h-5 w-5 border border-[#2789ce] shadow-[inset_0_3px_#00000040] rounded-full appearance-none cursor-pointer checked:bg-[#2789ce] checked:shadow-none"
                type="checkbox"
                id="radioDefault1"
                checked={betInfo}
                onChange={(e) => onBetInfoChange(e.target.checked)}
              />
              <label
                className="ml-[5px] cursor-pointer"
                htmlFor="radioDefault1"
              >
                {t('common.betInfo', 'Bet info')}
              </label>
            </div>
            <div className="flex items-center ml-2">
              <input
                className="h-5 w-5 border border-[#2789ce] shadow-[inset_0_3px_#00000040] rounded-full appearance-none cursor-pointer checked:bg-[#2789ce] checked:shadow-none"
                type="checkbox"
                id="radioDefault2"
                checked={timeOrder}
                onChange={(e) => onTimeOrderChange(e.target.checked)}
              />
              <label
                className="ml-[5px] cursor-pointer"
                htmlFor="radioDefault2"
              >
                {t('common.timeOrder', 'Time Order')}
              </label>
            </div>
          </div>
        </form>
      )}
    </>
  )
}

function OpenBetsDesktop({
  openBetsList,
  isOpen,
  isMobile,
  isYellowTheme,
  onRefresh,
}) {
  const { t } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [betInfo, setBetInfo] = useState(false)
  const [timeOrder, setTimeOrder] = useState(false)

  const openBetsValue = openBetsList[selectedIndex] ?? null
  const hasList = openBetsList.length > 0

  return (
    <div>
      <div>
        <div>
          <div className="mb-0">
            <div className="flex items-center bg-gradient-to-b from-[var(--xts-blue)] to-[var(--xts-blue)] [&_i]:h-[25px] [&_i]:w-[25px] [&_i]:leading-[20px] [&_i]:text-white [&_i]:text-center [&_i]:border-r [&_i]:border-[var(--tbl-border-color)] [&_i_svg]:h-4 [&_i_svg]:w-4">
              <SvgIcon
                name="refreshIcon"
                className="cursor-pointer text-white p-1 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-white"
                role="button"
                tabIndex={0}
                onClick={onRefresh}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onRefresh?.()
                  }
                }}
                aria-label={t('openBets.refreshOpenBets', 'Refresh open bets')}
              />
              <h2 className="relative shadow-[0_2px_0_rgba(var(--white-rgb),0.1)] m-0 w-full">
                <button
                  type="button"
                  className={cx(
                    'w-full text-left px-2.5 text-white text-xs leading-[25px] shadow-[0_2px_0_rgba(var(--white-rgb),0.1)] bg-no-repeat bg-right bg-[length:auto_100%]',
                    isCollapsed
                      ? 'bg-[url(/img/grediant-slip-plus.png)]'
                      : 'bg-[url(/img/grediant-slip-minus.png)]'
                  )}
                  onClick={() => setIsCollapsed((prev) => !prev)}
                >
                  {t('openBets.title', 'Open Bets')}
                </button>
              </h2>
            </div>
            <Collapse in={!isCollapsed}>
              <div className="p-0">
                {hasList ? (
                  <div>
                    <div className="py-2 px-1">
                      <select
                        className="py-1 pl-1 pr-6 w-full border rounded truncate"
                        value={selectedIndex}
                        onChange={(e) =>
                          setSelectedIndex(Number(e.target.value))
                        }
                      >
                        {openBetsList.map((openBet, index) => (
                          <option key={index} value={index}>
                            {openBet.displayTitle}
                          </option>
                        ))}
                      </select>
                    </div>
                    <OpenBetsListBackLay
                      openBetsValue={openBetsValue}
                      betInfo={betInfo}
                      timeOrder={timeOrder}
                      isOpen={isOpen}
                      isMobile={isMobile}
                      onBetInfoChange={setBetInfo}
                      onTimeOrderChange={setTimeOrder}
                    />
                  </div>
                ) : (
                  <NoOpenBets isYellowTheme={isYellowTheme} />
                )}
              </div>
            </Collapse>
          </div>
        </div>
      </div>
    </div>
  )
}

function OpenBetsMobile({ openBetsList, isOpen, isMobile }) {
  const [detailsOpenBets, setDetailsOpenBets] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [betInfo, setBetInfo] = useState(false)
  const [timeOrder, setTimeOrder] = useState(false)
  const isYellowTheme = useSelector(selectIsYellowTheme)

  const openBetsValue = openBetsList[selectedIndex] ?? null
  const hasList = openBetsList.length > 0

  if (detailsOpenBets && openBetsValue) {
    return (
      <div>
        <div className="flex bg-[var(--dark)]">
          <span className="py-[13px] pl-[9px] pr-[13px] pb-[15px] border-r border-[var(--md-black)] text-white max-md:p-0 max-md:flex max-md:justify-center max-md:items-center max-md:min-w-[10.66667vw] max-md:border-r max-md:border-[var(--sm-black)] [&_svg]:max-md:h-[5vw] [&_svg]:max-md:w-[5vw]">
            <SvgIcon
              name="backfilledArrow"
              role="button"
              tabIndex={0}
              onClick={() => setDetailsOpenBets(false)}
            />
          </span>
          <p className="m-0 py-[14px] px-[7px] whitespace-nowrap overflow-hidden text-ellipsis text-white max-md:py-0 max-md:pl-[1.86667vw] max-md:pr-[1.06667vw] max-md:leading-[10.66667vw]">
            {openBetsValue.displayTitle}
          </p>
        </div>
        <OpenBetsListBackLay
          openBetsValue={openBetsValue}
          betInfo={betInfo}
          timeOrder={timeOrder}
          isOpen={isOpen}
          isMobile={isMobile}
          onBetInfoChange={setBetInfo}
          onTimeOrderChange={setTimeOrder}
        />
      </div>
    )
  }

  if (hasList) {
    return (
      <div className="overflow-y-auto max-h-[calc(100vh-50px)]">
        {openBetsList.map((item, index) => (
          <li
            key={index}
            className="flex relative border-b border-[var(--lg-gray)]"
            onClick={() => {
              setSelectedIndex(index)
              setDetailsOpenBets(true)
            }}
            role="presentation"
          >
            <p className="m-0 pt-[17px] pb-[20px] pl-[33px] whitespace-nowrap overflow-hidden text-ellipsis max-w-[calc(100%-50px)] text-[var(--blue)] relative before:content-[''] before:absolute before:w-[15px] before:h-[15px] before:bg-[var(--xl-th-bg)] before:rounded-full before:border-[var(--black)] before:left-[9px] before:top-1/2 before:-translate-y-1/2 max-md:py-[2.13333vw] max-md:pl-[6.66667vw] max-md:pr-[9.06667vw] max-md:max-w-full max-md:leading-[1.6] max-md:text-[4vw] max-md:font-semibold max-md:before:w-[2.66667vw] max-md:before:h-[2.66667vw] max-md:before:border max-md:before:border-[rgba(var(--md-dark-rgb),0.4)]">
              {item.displayTitle}
            </p>
            <span className="flex justify-center items-center w-[30px] h-[30px] border border-[var(--light-bg)] rounded-[2px] absolute right-[12px] top-1/2 -translate-y-1/2 [&_i]:leading-[0] max-md:h-[6.4vw] max-md:w-[6.4vw] max-md:rounded-[1.06667vw] [&_svg]:max-md:h-[6.4vw] [&_svg]:max-md:w-[6.4vw]">
              <SvgIcon name="chevronRightArrow" />
            </span>
          </li>
        ))}
      </div>
    )
  }

  return <NoOpenBets isYellowTheme={isYellowTheme} />
}

export default function OpenBets() {
  const dispatch = useDispatch()
  const isMobile = useSelector(selectIsMobile)
  const isOpen = useSelector(selectActiveBetSlip)
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const openBetsList = useSelector(selectOpenBets) ?? []
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const { eventId } = useParams()

  const handleRefresh = useCallback(() => {
    if (!isAuthenticated) return
    const params = eventId ? { eventId: String(eventId) } : {}
    dispatch(fetchOpenBets(params))
  }, [dispatch, isAuthenticated, eventId])

  if (isMobile) {
    return (
      <OpenBetsMobile
        openBetsList={openBetsList}
        isOpen={!!isOpen}
        isMobile={isMobile}
      />
    )
  }

  return (
    <OpenBetsDesktop
      openBetsList={openBetsList}
      isOpen={!!isOpen}
      isMobile={isMobile}
      isYellowTheme={isYellowTheme}
      onRefresh={handleRefresh}
    />
  )
}
