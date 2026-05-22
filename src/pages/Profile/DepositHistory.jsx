import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import Table from '../../shared/Table.jsx'
import {
  fetchDepositHistory,
  selectDepositHistory,
  sendDepositComplaint,
} from '../../store/slices/accountSlice.js'
import { selectCurrency } from '../../store/slices/authSlice.js'
import { Icon } from './depositIcons.jsx'

const PER_PAGE = 10

// Mirrors Angular's `| date : 'YYYY-MM-dd HH:mm:ss'` pipe.
function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// The fetchDepositHistory thunk stamps each row's `paymentMethod` field
// with a raw `<img class="payment-img" src="…">` HTML string (mirrors
// Angular's `type: 'template'` column rendering). Wrap it in a span and
// scope `.payment-img` height/width via a Tailwind `&_img` selector so the
// original 30px image height survives without the dedicated scss file.
function PaymentMethodCell({ html }) {
  if (!html) return null
  return (
    <span
      className="[&_img]:h-[30px] [&_img]:w-auto"
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
    // .deposit-action-btn: transparent bg, primary text, 4/6 padding,
    // 18px svg sizing scoped via [&_i_svg].
    <button
      type="button"
      className="bg-transparent border-0 px-[6px] py-[4px] cursor-pointer inline-flex items-center gap-1 text-[var(--primary)] hover:text-[var(--lg-primary)] [&_i]:inline-flex [&_i]:leading-none [&_i_svg]:w-[18px] [&_i_svg]:h-[18px]"
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      <Icon name={icon} />
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
    color = 'text-[var(--avocado-green)]'
  } else if (
    slug.includes('reject') ||
    slug.includes('decline') ||
    slug === 'suspend'
  ) {
    color = 'text-[var(--failed-status)]'
  } else if (slug.includes('pending') || slug.includes('initiated')) {
    color = 'text-[var(--primary-yellow)]'
  }
  // width:100%; border-radius:5px; position:relative; font-size:12px;
  // text-align:center; display:flex; align-items:center; text-transform:capitalize;
  return (
    <span
      className={`w-full rounded-[5px] relative text-[12px] text-center flex items-center capitalize ${color}`}
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
        label: t('myBets.createdOn', 'Created On'),
        render: (value) => formatDate(value),
      },
      {
        key: 'paymentMethod',
        label: t('myBets.paymentType', 'Payment Type'),
        render: (value) => <PaymentMethodCell html={value} />,
      },
      {
        key: 'payment',
        label: t('common.paymentMethod', 'Payment Method'),
      },
      {
        key: 'original_amount',
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
        key: 'uploadScreenshot',
        label: t('myBets.screenshot', 'Upload ScreenShot'),
        render: (_, row) => (
          <ActionButton
            visible={!!row?.isShowComplaint}
            icon="uploadSS"
            title={t('myBets.screenshot', 'Upload Screenshot')}
            onClick={() => onUploadScreenshot(row)}
          />
        ),
      },
      {
        key: 'action',
        label: t('common.actions', 'Action'),
        render: (_, row) => (
          <ActionButton
            visible={!!row?.isShowRepayment}
            icon="arrowRoundBox"
            title={t('myBets.repayment', 'Repay')}
            onClick={() => onRepayment(row)}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currency, page, t]
  )

  return (
    <>
      <div className="flex justify-between items-center">
        <p className="text-[#1e1e1e] font-bold text-[13px] leading-5 pt-1.5 mb-1.5">
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
