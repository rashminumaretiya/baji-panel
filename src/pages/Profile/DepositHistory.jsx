import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Table from '../../shared/Table.jsx'
import {
  fetchDepositHistory,
  selectDepositHistory,
  sendDepositComplaint,
} from '../../store/slices/accountSlice.js'
import { selectCurrency } from '../../store/slices/authSlice.js'
import { Icon } from './depositIcons.jsx'
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

// Renders the `<img class="payment-img" src="…">` HTML string that the
// fetchDepositHistory thunk attaches to each row's `paymentMethod` field
// (mirrors Angular's `type: 'template'` column rendering).
function PaymentMethodCell({ html }) {
  if (!html) return null
  return (
    <span
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

// Action button used in the Upload ScreenShot / Repayment cells. Hidden when
// the row's conditionField (e.g. isShowComplaint) evaluates falsy — mirrors
// Angular's `conditionField` option.
function ActionButton({ visible, icon, title, label, onClick }) {
  if (!visible) return null
  return (
    <button
      type="button"
      className="deposit-action-btn"
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      <Icon name={icon} />
      {label && <span>{label}</span>}
    </button>
  )
}

export default function DepositHistory() {
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
    if (row?.payment_url) {
      window.location.href = row.payment_url
    }
  }

  const onUploadScreenshot = (row) => {
    // baji-exchange-frontend opens a modal (DepositComplaintComponent) that
    // POSTs to /self-payment/complaint/:trxId with a screenshot. Until the
    // modal UI is ported, prompt for the screenshot URL inline so the action
    // still works end-to-end via the same thunk.
    const url = window.prompt('Paste screenshot URL or transaction note:')
    if (!url) return
    dispatch(sendDepositComplaint({ trxId: row?._id, payload: { url } }))
      .unwrap()
      .then(() => {
        // Refresh history so isShowComplaint flips off (mirrors Angular's
        // effect() that re-fetches when the modal closes).
        dispatch(fetchDepositHistory({ page, perPage: PER_PAGE }))
      })
      .catch(() => {})
  }

  const columns = useMemo(
    () => [
      {
        key: 'createdAt',
        label: 'Created On',
        render: (value) => formatDate(value),
      },
      {
        key: 'paymentMethod',
        label: 'Payment Type',
        render: (value) => <PaymentMethodCell html={value} />,
      },
      {
        key: 'paymentType',
        label: 'Payment Method',
      },
      {
        key: 'netAmount',
        label: `${currency} Amount`,
      },
      {
        key: 'transactionId',
        label: 'Trx Id',
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
      {
        key: 'uploadScreenshot',
        label: 'Upload ScreenShot',
        render: (_, row) => (
          <ActionButton
            visible={!!row?.isShowComplaint}
            icon="uploadSS"
            title="Upload Screenshot"
            onClick={() => onUploadScreenshot(row)}
          />
        ),
      },
      {
        key: 'action',
        label: 'Action',
        render: (_, row) => (
          <ActionButton
            visible={!!row?.isShowRepayment}
            icon="arrowRoundBox"
            title="Repay"
            onClick={() => onRepayment(row)}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currency, page],
  )

  return (
    <>
      <div className="page-title d-flex justify-content-between align-items-center">
        <p className="m-0">Deposit History</p>
      </div>

      <Table
        columns={columns}
        data={history}
        pagination={{ currentPage: page, totalPages, onPageChange: setPage }}
      />
    </>
  )
}
