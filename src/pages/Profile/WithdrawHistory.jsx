import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import Table from '../../shared/Table.jsx'
import {
  fetchWithdrawalHistory,
  selectWithdrawalHistory,
} from '../../store/slices/accountSlice.js'
import { selectCurrency } from '../../store/slices/authSlice.js'
import { formatDateTimeStamp as formatDate } from '../../utils/format.js'

const PER_PAGE = 10

// The thunk attaches a `<img class="payment-img">` HTML string to each
// row's `paymentType` field (mirrors Angular's `type: 'template'`).
// Scope the image sizing inline so we don't need a dedicated scss file.
function PaymentTypeCell({ html }) {
  if (!html) return null
  return (
    <span
      className="[&_img]:h-[30px] [&_img]:w-auto"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

// `<a class="rejected-reason">View Note</a>` link cell. Clickable when the
// row has a `reason`; opens the Decline Reason modal (mirrors Angular's
// modalService.setContent(declineReason)). The injected HTML inherits the
// blue/underlined link colours via Tailwind selectors scoped to this span.
function ReasonCell({ html, onClick }) {
  if (!html) return null
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="[&_a]:cursor-pointer [&_a]:text-[12px] [&_a]:text-(--cyanBlue) [&_a]:underline"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

// Status colour mapping shared with DepositHistory.
function getStatusCellClass(value) {
  if (!value) return ''
  const slug = String(value).toLowerCase().trim()
  if (
    slug.includes('complete') ||
    slug.includes('approve') ||
    slug.includes('success')
  )
    return 'text-(--avocado-green) font-bold'
  if (
    slug.includes('fail') ||
    slug.includes('reject') ||
    slug.includes('decline')
  )
    return 'text-(--failed-status) font-bold'
  if (slug.includes('pending') || slug.includes('process'))
    return 'text-(--orange-dark) font-bold'
  return ''
}

export default function WithdrawHistory() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { data: history, totalCount } = useSelector(selectWithdrawalHistory)
  const currency = useSelector(selectCurrency) || 'BDT'

  const [page, setPage] = useState(1)
  const [reasonModal, setReasonModal] = useState({ open: false, reason: '' })

  useEffect(() => {
    dispatch(fetchWithdrawalHistory({ page, perPage: PER_PAGE }))
  }, [dispatch, page])

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / PER_PAGE))

  const openReason = (row) => {
    setReasonModal({ open: true, reason: row?.reason || '' })
  }
  const closeReason = () => setReasonModal({ open: false, reason: '' })

  const columns = useMemo(
    () => [
      {
        key: 'accountNumber',
        label: t('myBets.accountNumber', 'Account Number'),
      },
      { key: 'trxId', label: t('myBets.trxId', 'Trx Id') },
      {
        key: 'paymentType',
        label: t('myBets.paymentType', 'Payment Type'),
        render: (value) => <PaymentTypeCell html={value} />,
      },
      { key: 'currency', label: t('common.currency', 'Currency') },
      { key: 'pbu', label: `${currency} ${t('myBets.amount', 'Amount')}` },
      {
        key: 'remainingAmount',
        label: t('myBets.remainingAmount', 'Remaining amount'),
        cellClassName: 'whitespace-nowrap',
      },
      {
        key: 'transactionId',
        label: t('myBets.transactionID', 'Transaction Id'),
      },
      {
        key: 'reasonTemp',
        label: t('myBets.rejectedReason', 'Rejected Reason'),
        render: (value, row) => (
          <ReasonCell html={value} onClick={() => openReason(row)} />
        ),
      },
      {
        key: 'createdAt',
        label: t('myBets.createdOn', 'Created On'),
        render: (value) => formatDate(value),
      },
      {
        key: 'status',
        label: t('myBets.status', 'Status'),
        cellClassName: getStatusCellClass,
        render: (value) => <span>{value}</span>,
      },
    ],
    [currency, t]
  )

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="mb-1.5 pt-1.5 text-[13px] leading-5 font-bold text-[#1e1e1e]">
          {t('common.withdrawHistory', 'Withdraw History')}
        </p>
      </div>

      <Table
        columns={columns}
        data={history}
        pagination={{ currentPage: page, totalPages, onPageChange: setPage }}
      />

      {reasonModal.open && (
        // .reason-modal-backdrop + .reason-modal — fixed full-screen overlay
        // with a centred 420px-wide white card; the deposit-history.scss copy
        // is preserved verbatim here in utility form.
        <div
          className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50"
          onClick={closeReason}
        >
          <div
            className="w-[90%] max-w-[420px] overflow-hidden rounded-md bg-white shadow-[0_4px_20px_rgba(0,0,0,0.25)]"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-(--light-gray) px-4 py-3">
              <h5 className="m-0 text-[16px] font-semibold">
                {t('myBets.rejectedReason', 'Decline Reason')}
              </h5>
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent text-[18px] text-(--dark-md-gray) hover:text-black"
                aria-label="Close"
                onClick={closeReason}
              >
                ✕
              </button>
            </div>
            <div className="p-4 text-[14px] break-words text-(--dark-md-gray)">
              {reasonModal.reason || '—'}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
