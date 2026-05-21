import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Table from '../../shared/Table.jsx'
import {
  fetchWithdrawalHistory,
  selectWithdrawalHistory,
} from '../../store/slices/accountSlice.js'
import { selectCurrency } from '../../store/slices/authSlice.js'
// Reuse the .payment-img + status- class colors already defined for the
// Deposit History page (same selectors used by the shared Table component).
import './deposit-history.scss'

const PER_PAGE = 10

// Mirrors Angular's `| date : 'YYYY-MM-dd HH:mm:ss'` pipe.
function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// Renders the `<img class="payment-img">` HTML string that the thunk stamps
// onto each row's `paymentType` field (mirrors Angular's `type: 'template'`).
function PaymentTypeCell({ html }) {
  if (!html) return null
  return (
    <span
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

// `<a class="rejected-reason">View Note</a>` link cell. Clickable when the
// row has a `reason`; opens the Decline Reason modal (mirrors Angular's
// modalService.setContent(declineReason)).
function ReasonCell({ html, onClick }) {
  if (!html) return null
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default function WithdrawHistory() {
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
      { key: 'accountNumber', label: 'Account Number' },
      { key: 'trxId', label: 'Trx Id' },
      {
        key: 'paymentType',
        label: 'Payment Type',
        render: (value) => <PaymentTypeCell html={value} />,
      },
      { key: 'currency', label: 'Currency' },
      { key: 'pbu', label: `${currency} Amount` },
      {
        key: 'remainingAmount',
        label: 'Remaining amount',
        cellClassName: 'w-nowrap',
      },
      { key: 'transactionId', label: 'Transaction Id' },
      {
        key: 'reasonTemp',
        label: 'Rejected Reason',
        render: (value, row) => (
          <ReasonCell html={value} onClick={() => openReason(row)} />
        ),
      },
      {
        key: 'createdAt',
        label: 'Created On',
        render: (value) => formatDate(value),
      },
      {
        key: 'status',
        label: 'Status',
        cellClassName: (value) => {
          if (!value) return ''
          const slug = String(value).toLowerCase().replace(/\s+/g, '-')
          return `status-${slug}`
        },
        render: (value) => <span>{value}</span>,
      },
    ],
    [currency],
  )

  return (
    <>
      <div className="page-title d-flex justify-content-between align-items-center">
        <p className="m-0">Withdraw History</p>
      </div>

      <Table
        columns={columns}
        data={history}
        pagination={{ currentPage: page, totalPages, onPageChange: setPage }}
      />

      {reasonModal.open && (
        <div className="reason-modal-backdrop" onClick={closeReason}>
          <div
            className="reason-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reason-modal-header">
              <h5 className="m-0">Decline Reason</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={closeReason}
              >
                ✕
              </button>
            </div>
            <div className="reason-modal-body">
              {reasonModal.reason || '—'}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
