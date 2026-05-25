import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Table from '../../shared/Table.jsx'
import Modal from '../../shared/components/Modal.jsx'
import { alertService, resolveApiMessage } from '../../shared/services/alert.js'
import { ComplaintIcon } from '../../components/icons.jsx'
import MarketTabs from './MarketTabs.jsx'
import { betTypeColorClass } from './betType.js'

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

  const [marketCategory, setMarketCategory] = useState('EXCHANGE')
  const [betStatus, setBetStatus] = useState('ALL')
  const [orderBy, setOrderBy] = useState({ betPlaced: true, market: false })
  const [bets, setBets] = useState([])
  const [complaintBet, setComplaintBet] = useState(null)
  const [complaintText, setComplaintText] = useState('')
  const [complaintTouched, setComplaintTouched] = useState(false)
  const [complaintSubmitting, setComplaintSubmitting] = useState(false)

  const openComplaint = (row) => {
    setComplaintBet(row)
    setComplaintText('')
    setComplaintTouched(false)
  }
  const closeComplaint = () => {
    setComplaintBet(null)
    setComplaintText('')
    setComplaintTouched(false)
    setComplaintSubmitting(false)
  }
  const submitComplaint = () => {
    const text = complaintText.trim()
    if (!text) {
      setComplaintTouched(true)
      return
    }
    const betId = complaintBet?._id ?? complaintBet?.betId
    setComplaintSubmitting(true)
    http
      .post(
        'bet/unsettled-bets-complains',
        { betId, complaint: text },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        const msg = resolveApiMessage(
          t,
          res?.data,
          t('myBets.complaintSent', 'Complaint sent successfully')
        )
        if (msg) alertService.success(msg)
        closeComplaint()
      })
      .catch((err) => {
        alertService.error(
          resolveApiMessage(
            t,
            err,
            t('errors.complaintFailed', 'Failed to send complaint')
          )
        )
        setComplaintSubmitting(false)
      })
  }

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
        // Fancy bets show the matched odd alongside the bet type
        // ("{betType} > {odd}"); other market categories keep just betType.
        // Text colour mirrors Angular's `.type-back/.type-yes` → --blue,
        // `.type-lay/.type-no` → --red rules from styles.scss.
        render: (_v, row) => {
          const betType = row?.betType ?? row?.type ?? '--'
          let label = betType
          if (marketCategory === 'FANCY') {
            const odd = row?.odd ?? row?.avgOddMatched
            if (odd != null && odd !== '') label = `${betType} > ${odd}`
          }
          return (
            <span className={betTypeColorClass(betType)}>{label}</span>
          )
        },
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
        render: (_v, row) => (
          <div className="flex justify-end">
            <ComplaintIcon
              className="mx-1 cursor-pointer text-[#3b5160]"
              title={t('myBets.complaint', 'Complaint')}
              aria-label={t('myBets.complaint', 'Complaint')}
              role="button"
              tabIndex={0}
              onClick={() => openComplaint(row)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openComplaint(row)
                }
              }}
            />
          </div>
        ),
      },
    ],
    [t, marketCategory]
  )

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
      {bets.length > 0 && (
        <Table columns={COLUMNS} data={bets} rowKey="_id" />
      )}

      <Modal
        isOpen={!!complaintBet}
        onClose={closeComplaint}
        title={t('myBets.sendComplaint', 'Send Complaint')}
        size="md"
        closeOnEscape
      >
        <div className="form-group">
          <label
            htmlFor="complaint"
            className="mb-2 block text-[12px] font-medium text-[#3b5160]"
          >
            {t('myBets.complaint', 'Complaint')}
          </label>
          <textarea
            id="complaint"
            className="w-full rounded border border-[#aaa] bg-white p-2 text-[13px] focus:border-(--cyanBlue) focus:outline-none"
            rows={4}
            placeholder={t(
              'myBets.complaintPlaceholder',
              'Enter your complaint'
            )}
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            onBlur={() => setComplaintTouched(true)}
          />
          {complaintTouched && !complaintText.trim() && (
            <span className="mt-1 block text-[12px] text-(--red)">
              {t('myBets.complaintRequired', 'Complaint is required')}
            </span>
          )}
        </div>
        <div className="mt-3 text-center">
          <button
            type="button"
            className="btn btn-primary px-3 py-1 text-[12px]!"
            disabled={complaintSubmitting}
            onClick={submitComplaint}
          >
            {t('myBets.sendComplaint', 'Send Complaint')}
          </button>
        </div>
      </Modal>
    </MarketTabs>
  )
}
