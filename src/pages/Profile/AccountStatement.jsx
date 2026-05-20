import { useState } from 'react'
import Table from '../../shared/Table.jsx'

const columns = [
  { key: 'dateTime', label: 'Date/Time' },
  { key: 'deposit', label: 'Deposit' },
  { key: 'withdraw', label: 'Withdraw' },
  { key: 'balance', label: 'Balance' },
  { key: 'remark', label: 'Remark' },
  { key: 'fromTo', label: 'From/To' },
]

export default function AccountStatement() {
  const [statements] = useState([])

  return (
    <Table title="Account Statement" columns={columns} data={statements} />
  )
}
