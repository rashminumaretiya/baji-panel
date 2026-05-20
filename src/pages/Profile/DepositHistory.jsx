import { useState } from 'react'
import Table from '../../shared/Table.jsx'

const columns = [
  { key: 'createdOn', label: 'Created On' },
  { key: 'paymentType', label: 'Payment Type' },
  { key: 'paymentMethod', label: 'Payment Method' },
  { key: 'amount', label: 'BDT Amount' },
  { key: 'trxId', label: 'Trx Id' },
  { key: 'status', label: 'Status' },
  { key: 'screenshot', label: 'Upload ScreenShot' },
  { key: 'action', label: 'Action' },
]

export default function DepositHistory() {
  const [history] = useState([])

  return (
    <>
      <div className="page-title d-flex justify-content-between align-items-center">
        <p className="m-0">Deposit History</p>
      </div>
      <Table columns={columns} data={history} />
    </>
  )
}
