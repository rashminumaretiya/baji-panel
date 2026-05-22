import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Table from '../../shared/Table.jsx'
import './balanceOverview.scss'

const summaryCards = [
  {
    key: 'balances',
    title: 'Your Balances',
    heading: 'Welcome,',
    description:
      'View your account details here. You can manage funds, review and change your settings and see the performance of your betting activity.',
  },
  {
    key: 'betHold',
    title: 'Bet Placement Hold',
    heading: 'On Hold for Bets,',
    description:
      'A portion of your funds is currently on hold due to active or pending bets. You can track these bets and manage your activity in your account details.',
  },
  {
    key: 'withdrawHold',
    title: 'Withdrawal Hold',
    heading: 'Funds Awaiting Withdrawal,',
    description:
      'Some of your funds are reserved for a pending withdrawal request. You can review and manage this in your account details.',
  },
]

const PER_PAGE = 10

const columns = [
  {
    key: 'date',
    label: 'Date',
    render: (_v, row) =>
      row?.createdAt ? new Date(row.createdAt).toLocaleString() : '--',
  },
  {
    key: 'transactionNo',
    label: 'Transaction №',
    render: (_v, row) => row?.transactionId ?? row?._id ?? '--',
  },
  {
    key: 'debits',
    label: 'Debits',
    render: (_v, row) => row?.withdraw ?? 0,
  },
  {
    key: 'credits',
    label: 'Credits',
    render: (_v, row) => row?.deposit ?? 0,
  },
  { key: 'balance', label: 'Balance' },
  {
    key: 'remarks',
    label: 'Remarks',
    render: (_v, row) => row?.remark ?? row?.remarks ?? '--',
  },
]

export default function BalanceOverview() {
  const token = useSelector(selectToken)
  const [summary, setSummary] = useState({
    balances: { amount: 0, currency: 'BDT' },
    betHold: { amount: 0, currency: 'BDT' },
    withdrawHold: { amount: 0, currency: 'BDT' },
  })
  const [transactions, setTransactions] = useState([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    http
      .get('user/balance', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (cancelled) return
        const d = res.data?.data
        if (!d) return
        const currency = d.currency || 'BDT'
        setSummary({
          balances: { amount: d.balance ?? 0, currency },
          betHold: { amount: d.holdAmount?.bet ?? 0, currency },
          withdrawHold: { amount: d.holdAmount?.withdraw ?? 0, currency },
        })
      })
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    http
      .get(`user/transaction-history?page=${page}&perPage=${PER_PAGE}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (cancelled) return
        const d = res.data?.data
        setTransactions(d?.data ?? d ?? [])
        setTotalCount(d?.totalCount ?? 0)
      })
    return () => {
      cancelled = true
    }
  }, [token, page])

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE))

  return (
    <>
      <p className="page-title">Summary</p>

      {summaryCards.map((card) => {
        const value = summary[card.key] || {}
        return (
          <div className="card" key={card.key}>
            <div className="card-body">
              <div className="account-balance-wrapper">
                <p className="balance-header">{card.title}</p>
                <p className="balance mb-0">
                  <span>{value.amount ?? 0}</span> {value.currency || 'BDT'}
                </p>
              </div>
              <div className="welcome-section">
                <h4 className="balance-header">{card.heading}</h4>
                <p className="mb-0">{card.description}</p>
              </div>
            </div>
          </div>
        )
      })}

      <Table
        columns={columns}
        data={transactions}
        rowKey="_id"
        pagination={{
          currentPage: page,
          totalPages,
          onPageChange: setPage,
        }}
      />
    </>
  )
}
