import { useState } from 'react'
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

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'transactionNo', label: 'Transaction №' },
  { key: 'debits', label: 'Debits' },
  { key: 'credits', label: 'Credits' },
  { key: 'balance', label: 'Balance' },
  { key: 'remarks', label: 'Remarks' },
]

export default function BalanceOverview() {
  const [summary] = useState({
    balances: { amount: 0, currency: 'BDT' },
    betHold: { amount: 0, currency: 'BDT' },
    withdrawHold: { amount: 0, currency: 'BDT' },
  })
  const [transactions] = useState([])

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

      <Table columns={columns} data={transactions} />
    </>
  )
}
