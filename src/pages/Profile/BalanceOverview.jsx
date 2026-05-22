import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Table from '../../shared/Table.jsx'

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

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'transactionNo', label: 'Transaction №' },
  { key: 'debits', label: 'Debits' },
  { key: 'credits', label: 'Credits' },
  { key: 'balance', label: 'Balance' },
  { key: 'remarks', label: 'Remarks' },
]

export default function BalanceOverview() {
  const token = useSelector(selectToken)
  const [summary, setSummary] = useState({
    balances: { amount: 0, currency: 'BDT' },
    betHold: { amount: 0, currency: 'BDT' },
    withdrawHold: { amount: 0, currency: 'BDT' },
  })
  const [transactions] = useState([])

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

  return (
    <>
      <p className="text-[#1e1e1e] font-bold text-[13px] leading-5 pt-1.5 mb-1.5">
        Summary
      </p>

      {summaryCards.map((card) => {
        const value = summary[card.key] || {}
        return (
          <div className="mb-[15px]" key={card.key}>
            <div className="flex bg-white py-[7px] px-[10px] border-b border-[var(--dark-gray)]">
              {/* account-balance-wrapper: flex: 0 0 31.37255% / pr-4 */}
              <div className="pr-4 basis-[31.37255%] shrink-0 grow-0">
                <p className="text-[15px] font-bold mb-[7px] text-[#3b5160]">
                  {card.title}
                </p>
                <p className="mb-0 text-[12px] text-[#7e97a7]">
                  <span className="text-[30px] leading-9 font-bold text-[#2789ce]">
                    {value.amount ?? 0}
                  </span>{' '}
                  {value.currency || 'BDT'}
                </p>
              </div>
              {/* welcome-section: left border, padding 0 10px 3px */}
              <div className="px-[10px] pb-[3px] relative border-l border-[var(--xs-lightGray)]">
                <h4 className="text-[15px] font-bold mb-[7px] text-[#3b5160]">
                  {card.heading}
                </h4>
                <p className="mb-0 text-[#3b5160] text-[13px] leading-[18px] max-w-[570px]">
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        )
      })}

      <Table columns={columns} data={transactions} />
    </>
  )
}
