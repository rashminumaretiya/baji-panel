import { useState } from 'react'
import Table from '../../shared/Table.jsx'

const columns = [
  { key: 'accountNumber', label: 'Account Number' },
  { key: 'trxId', label: 'Trx Id' },
  { key: 'paymentType', label: 'Payment Type' },
  { key: 'currency', label: 'Currency' },
  { key: 'amount', label: 'BDT Amount' },
  { key: 'remainingAmount', label: 'Remaining amount' },
  { key: 'transactionId', label: 'Transaction Id' },
  { key: 'rejectedReason', label: 'Rejected Reason' },
  { key: 'createdOn', label: 'Created On' },
  { key: 'status', label: 'Status' },
]

export default function WithdrawHistory() {
  const [history] = useState([])

  return (
    <>
      <div className="page-title d-flex justify-content-between align-items-center">
        <p className="m-0">Withdraw History</p>
      </div>
      <Table columns={columns} data={history} />
    </>
  )
}
