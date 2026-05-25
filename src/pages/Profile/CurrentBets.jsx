import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Table from '../../shared/Table.jsx'
import MarketTabs from './MarketTabs.jsx'

const BET_STATUS_OPTIONS = [
  { value: 'ALL', i18nKey: 'filters.all', fallback: 'All' },
  { value: 'MATCHED', i18nKey: 'myBets.matched', fallback: 'Matched' },
  { value: 'UNMATCHED', i18nKey: 'myBets.unMatched', fallback: 'Unmatched' },
  { value: 'PENDING', i18nKey: 'myBets.pending', fallback: 'Pending' },
]

// Tailwind class strings ported from myBets.scss `.bets-filter`.
const betsFilterClass =
  'flex items-center flex-wrap bg-(--platinum-grey) py-[6px] px-[10px] border-b border-[#d0d0d0] text-[12px] text-[#1e1e1e] min-h-[32px] gap-2 mb-[15px] max-md:p-2'
const filterLabelClass = 'text-[#1e1e1e] whitespace-nowrap'
const betStatusSelectClass =
  'h-6 pl-[6px] pr-[22px] py-0 text-[12px] leading-[22px] rounded-[3px] border border-[#aaa] bg-white min-w-[110px] w-auto appearance-none bg-no-repeat bg-[position:right_4px_center] bg-[length:14px_10px] bg-[url("data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2016%2016%27%3e%3cpath%20fill=%27none%27%20stroke=%27%23343a40%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%20stroke-width=%272%27%20d=%27M2%205l6%206%206-6%27/%3e%3c/svg%3e")]'
// `.form-check input.form-check-input` — 14px square with cyan checked state.
const checkboxInputClass =
  'w-[14px] h-[14px] mt-0 cursor-pointer shrink-0 appearance-none bg-white border border-[#ced4da] rounded-sm m-0 checked:bg-(--cyanBlue) checked:border-(--cyanBlue) checked:bg-no-repeat checked:bg-center checked:bg-[length:10px_10px] checked:bg-[url("data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2020%2020%27%3e%3cpath%20fill=%27none%27%20stroke=%27%23fff%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%20stroke-width=%273%27%20d=%27m6%2010%203%203%206-6%27/%3e%3c/svg%3e")]'

function BetsFilter({ status, onStatusChange, orderBy, onOrderChange }) {
  const { t } = useTranslation()
  const selectOrder = (key) => {
    if (orderBy?.[key]) return
    onOrderChange?.({
      betPlaced: key === 'betPlaced',
      market: key === 'market',
    })
  }
  return (
    <div className={betsFilterClass}>
      <div className="flex items-center gap-2">
        <label htmlFor="betStatus" className={`${filterLabelClass} mb-0`}>
          {t('common.betStatus', 'Bet Status')}
        </label>
        <select
          id="betStatus"
          className={betStatusSelectClass}
          value={status}
          onChange={(e) => onStatusChange?.(e.target.value)}
        >
          {BET_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.i18nKey, opt.fallback)}
            </option>
          ))}
        </select>
      </div>
      <div className="ml-4 flex items-center gap-3">
        <span className={filterLabelClass}>
          {t('filters.orderBy', 'Order By')}
        </span>
        <label className="m-0 inline-flex cursor-pointer items-center gap-1 p-0">
          <input
            type="checkbox"
            className={checkboxInputClass}
            checked={!!orderBy?.betPlaced}
            onChange={() => selectOrder('betPlaced')}
          />
          <span className="select-none">
            {t('myBets.betPlaced', 'Bet placed')}
          </span>
        </label>
        <label className="m-0 inline-flex cursor-pointer items-center gap-1 p-0">
          <input
            type="checkbox"
            className={checkboxInputClass}
            checked={!!orderBy?.market}
            onChange={() => selectOrder('market')}
          />
          <span className="select-none">{t('myBets.market', 'Market')}</span>
        </label>
      </div>
    </div>
  )
}

export default function CurrentBets() {
  const { t } = useTranslation()
  const token = useSelector(selectToken)

  const COLUMNS = useMemo(
    () => [
      {
        key: 'betId',
        label: t('myBets.betID', 'Bet ID'),
        render: (_v, row) => row?.betId ?? row?._id ?? '--',
      },
      {
        key: 'plId',
        label: t('myBets.plID', 'PL ID'),
        render: (_v, row) => row?.plId ?? '--',
      },
      {
        key: 'market',
        label: t('myBets.market', 'Market'),
        render: (_v, row) =>
          row?.marketName ??
          (typeof row?.market === 'object'
            ? (row.market?.name ?? '--')
            : (row?.market ?? '--')),
      },
      {
        key: 'selection',
        label: t('markets.selection', 'Selection'),
        render: (_v, row) =>
          row?.selectionName ??
          (typeof row?.selection === 'object'
            ? Array.isArray(row.selection)
              ? row.selection
                  .map((s) => s?.name)
                  .filter(Boolean)
                  .join(' | ')
              : (row.selection?.name ?? '--')
            : (row?.selection ?? '--')),
      },
      {
        key: 'type',
        label: t('myBets.type', 'Type'),
        render: (_v, row) => row?.betType ?? row?.type ?? '--',
      },
      {
        key: 'betPlaced',
        label: t('myBets.betPlaced', 'Bet Placed'),
        render: (_v, row) =>
          row?.betPlacedAt ? new Date(row.betPlacedAt).toLocaleString() : '--',
      },
      {
        key: 'stake',
        label: t('markets.stake', 'Stake'),
        render: (_v, row) => row?.stake ?? '--',
      },
      {
        key: 'avgOddMatched',
        label: t('myBets.avgOddMatched', 'Avg. Odd Matched'),
        render: (_v, row) => row?.avgOddMatched ?? row?.odd ?? '--',
      },
      {
        key: 'actions',
        label: t('common.actions', 'Actions'),
        render: () => '--',
      },
    ],
    [t]
  )

  const [marketCategory, setMarketCategory] = useState('EXCHANGE')
  const [betStatus, setBetStatus] = useState('ALL')
  const [orderBy, setOrderBy] = useState({ betPlaced: true, market: false })
  const [bets, setBets] = useState([])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    const orderByKey = orderBy?.market ? 'market' : 'betPlaced'
    http
      .get(
        `bet/history?page=1&perPage=10&betStatus=${betStatus}&marketCategory=${marketCategory}&orderBy=${orderByKey}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        if (cancelled) return
        const payload = res.data?.data
        setBets(payload?.data ?? (Array.isArray(payload) ? payload : []))
      })
    return () => {
      cancelled = true
    }
  }, [token, marketCategory, betStatus, orderBy])

  return (
    <MarketTabs value={marketCategory} onChange={setMarketCategory}>
      <BetsFilter
        status={betStatus}
        onStatusChange={setBetStatus}
        orderBy={orderBy}
        onOrderChange={setOrderBy}
      />
      <Table
        columns={COLUMNS}
        data={bets}
        rowKey="_id"
        emptyMessage={t(
          'table.noData.currentBetsNoData',
          'You have no active bets.'
        )}
      />
    </MarketTabs>
  )
}
