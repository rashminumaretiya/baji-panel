import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import Table from '../../shared/Table.jsx'
import {
  fetchDepositHistory,
  selectDepositHistory,
} from '../../store/slices/accountSlice.js'
import { selectCurrency } from '../../store/slices/authSlice.js'
import { iconMap } from '../../components/icons.jsx'

const PER_PAGE = 10

// Mirrors Angular's `| date : 'YYYY-MM-dd HH:mm:ss'` pipe.
function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// Action button used in the Upload ScreenShot / Repayment cells. Hidden when
// the row's conditionField (e.g. isShowComplaint) evaluates falsy — mirrors
// Angular's `conditionField` option.
function ActionButton({ visible, icon, title, label, onClick }) {
  if (!visible) return null
  const ActionIcon = iconMap[icon]
  return (
    // .deposit-action-btn: transparent bg, primary text, 4/6 padding,
    // 18px svg sizing scoped via [&_i_svg].
    <button
      type="button"
      className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent px-[6px] py-[4px] text-(--primary) hover:text-(--lg-primary) [&_i]:inline-flex [&_i]:leading-none [&_i_svg]:h-[18px] [&_i_svg]:w-[18px]"
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      {ActionIcon && <ActionIcon />}
      {label && <span>{label}</span>}
    </button>
  )
}

// Verbatim port of baji-exchange-frontend styles.scss @status mixin (lines
// 1073-1104). The `$bg` parameter is declared in the mixin signature but
// never used inside its body — so the visual is colour-only, no background
// tint. Three buckets match the SCSS rule groups exactly.
function StatusPill({ value }) {
  if (!value) return null
  const slug = String(value).toLowerCase().trim()
  let color = ''
  if (
    slug.includes('complete') ||
    slug.includes('approve') ||
    slug === 'active' ||
    slug === 'accept' ||
    slug === 'transfered'
  ) {
    color = 'text-(--avocado-green)'
  } else if (
    slug.includes('reject') ||
    slug.includes('decline') ||
    slug === 'suspend'
  ) {
    color = 'text-(--failed-status)'
  } else if (slug.includes('pending') || slug.includes('initiated')) {
    color = 'text-(--primary-yellow)'
  }
  // width:100%; border-radius:5px; position:relative; font-size:12px;
  // text-align:center; display:flex; align-items:center; text-transform:capitalize;
  return (
    <span
      className={`relative flex w-full items-center rounded-[5px] text-center text-[12px] capitalize ${color}`}
    >
      {value}
    </span>
  )
}

export default function DepositHistory() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { data: history, totalCount } = useSelector(selectDepositHistory)
  const currency = useSelector(selectCurrency) || 'BDT'

  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(fetchDepositHistory({ page, perPage: PER_PAGE }))
  }, [dispatch, page])

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / PER_PAGE))

  const onRepayment = (row) => {
    if (row?.status === 'completed') return
    // mcv88 API returns the field as `paymentUrl` (camelCase) — sbex-user-fe
    // deposit-history.ts:175 uses the same key. baji-exchange-frontend's
    // `payment_url` snake_case is the 1ten365 backend's variant.
    if (row?.paymentUrl) {
      window.location.href = row.paymentUrl
    }
  }

  const columns = useMemo(
    () => [
      // Column order ported from sbex-user-fe deposit-history.ts:93-159. The
      // mcv88 API returns `gateway`/`paymentType` at the top level + nested
      // `transaction.{paymentMethod, transactionId}` — `mapDepositHistoryRows`
      // in accountSlice.js flattens those into the row shape used here.
      {
        key: 'createdAt',
        label: t('myBets.createdOn', 'Created On'),
        render: (value) => formatDate(value),
      },
      {
        key: 'paymentType',
        label: t('myBets.paymentType', 'Payment Type'),
        render: (value) => <span className="capitalize">{value || ''}</span>,
      },
      {
        key: 'gateway',
        label: t('common.paymentMethod', 'Payment Method'),
        // baji-exchange-frontend reads `resp.payment` here (plain text); the
        // mcv88 backend exposes the same concept as `gateway` (e.g. "sbkash").
        render: (value) => <span className="capitalize">{value || ''}</span>,
      },
      {
        key: 'amount',
        label: `${currency} ${t('myBets.amount', 'Amount')}`,
      },
      {
        key: 'transactionId',
        label: t('myBets.trxId', 'Trx Id'),
      },
      {
        key: 'status',
        label: t('myBets.status', 'Status'),
        render: (value) => <StatusPill value={value} />,
      },
      {
        key: 'action',
        label: t('common.actions', 'Action'),
        render: (_, row) => {
          // The button is only meaningful when both `isShowRepayment` is true
          // AND the API actually returned a `paymentUrl`/`payment_url` to
          // redirect to. Otherwise clicking silently does nothing, so render
          // an explicit "undefined" placeholder instead of an empty cell.
          const redirectUrl = row?.paymentUrl || row?.payment_url
          if (!row?.isShowRepayment || !redirectUrl) {
            return <span className="text-(--dark)">undefined</span>
          }
          return (
            <ActionButton
              visible
              icon="arrowRoundBox"
              title={t('myBets.repayment', 'Repay')}
              onClick={() => onRepayment(row)}
            />
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currency, page, t]
  )

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="mb-1.5 pt-1.5 text-[13px] leading-5 font-bold text-[#1e1e1e]">
          {t('common.depositHistory', 'Deposit History')}
        </p>
      </div>

      <Table
        columns={columns}
        data={history}
        pagination={{ currentPage: page, totalPages, onPageChange: setPage }}
      />
    </>
  )
}
