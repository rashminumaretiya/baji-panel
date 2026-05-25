import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Table from '../../shared/Table.jsx'

const SUMMARY_CARDS = [
  {
    key: 'balances',
    titleKey: 'balanceOverview.yourBalance',
    titleFallback: 'Your Balances',
    headingKey: 'balanceOverview.welcome',
    headingFallback: 'Welcome',
    descriptionKey: 'balanceOverview.message',
    descriptionFallback:
      'View your account details here. You can manage funds, review and change your settings and see the performance of your betting activity.',
  },
  {
    key: 'betHold',
    titleKey: 'balanceOverview.betPlaceHoldAmount',
    titleFallback: 'Bet Placement Hold',
    headingKey: 'balanceOverview.onHoldForBets',
    headingFallback: 'On Hold for Bets',
    descriptionKey: 'balanceOverview.betPlaceMessage',
    descriptionFallback:
      'A portion of your funds is currently on hold due to active or pending bets. You can track these bets and manage your activity in your account details.',
  },
  {
    key: 'withdrawHold',
    titleKey: 'balanceOverview.withdrawHoldAmount',
    titleFallback: 'Withdrawal Hold',
    headingKey: 'balanceOverview.fundsAwaitingWithdrawal',
    headingFallback: 'Funds Awaiting Withdrawal',
    descriptionKey: 'balanceOverview.withdrawHoldMessage',
    descriptionFallback:
      'Some of your funds are reserved for a pending withdrawal request. You can review and manage this in your account details.',
  },
]

const PER_PAGE = 10

export default function BalanceOverview() {
  const { t } = useTranslation()
  const token = useSelector(selectToken)
  const [summary, setSummary] = useState({
    balances: { amount: 0, currency: 'BDT' },
    betHold: { amount: 0, currency: 'BDT' },
    withdrawHold: { amount: 0, currency: 'BDT' },
  })
  const [transactions, setTransactions] = useState([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const columns = useMemo(
    () => [
      {
        key: 'date',
        label: t('table.columns.date', 'Date'),
        render: (_v, row) =>
          row?.createdAt ? new Date(row.createdAt).toLocaleString() : '--',
      },
      {
        key: 'transactionNo',
        label: t('table.columns.transactionNo', 'Transaction №'),
        render: (_v, row) => row?.transactionId ?? row?._id ?? '--',
      },
      {
        key: 'debits',
        label: t('table.columns.debits', 'Debits'),
        render: (_v, row) => row?.withdraw ?? 0,
      },
      {
        key: 'credits',
        label: t('table.columns.credits', 'Credits'),
        render: (_v, row) => row?.deposit ?? 0,
      },
      { key: 'balance', label: t('table.columns.balance', 'Balance') },
      {
        key: 'remarks',
        label: t('table.columns.remarks', 'Remarks'),
        render: (_v, row) => row?.remark ?? row?.remarks ?? '--',
      },
    ],
    [t]
  )

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
      <p className="mb-1.5 pt-1.5 text-[13px] leading-5 font-bold text-[#1e1e1e]">
        {t('balanceOverview.summary', 'Summary')}
      </p>

      {SUMMARY_CARDS.map((card) => {
        const value = summary[card.key] || {}
        return (
          <div className="mb-[15px]" key={card.key}>
            <div className="flex border-b border-(--dark-gray) bg-white px-[10px] py-[7px]">
              <div className="shrink-0 grow-0 basis-[31.37255%] pr-4">
                <p className="mb-[7px] text-[15px] font-bold text-[#3b5160]">
                  {t(card.titleKey, card.titleFallback)}
                </p>
                <p className="mb-0 text-[12px] text-[#7e97a7]">
                  <span className="text-[30px] leading-9 font-bold text-[#2789ce]">
                    {value.amount ?? 0}
                  </span>{' '}
                  {value.currency || 'BDT'}
                </p>
              </div>
              <div className="relative border-l border-(--xs-lightGray) px-[10px] pb-[3px]">
                <h4 className="mb-[7px] text-[15px] font-bold text-[#3b5160]">
                  {t(card.headingKey, card.headingFallback)},
                </h4>
                <p className="mb-0 max-w-[570px] text-[13px] leading-[18px] text-[#3b5160]">
                  {t(card.descriptionKey, card.descriptionFallback)}
                </p>
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
