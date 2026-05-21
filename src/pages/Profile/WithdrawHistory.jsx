import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Table from '../../shared/Table.jsx'
import {
  fetchWithdrawalHistory,
  selectWithdrawalHistory,
} from '../../store/slices/accountSlice.js'

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

const PER_PAGE = 10

export default function WithdrawHistory() {
  const dispatch = useDispatch()
  const { data: history, totalCount } = useSelector(selectWithdrawalHistory)
  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(fetchWithdrawalHistory({ page, perPage: PER_PAGE }))
  }, [dispatch, page])

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / PER_PAGE))

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
    </>
  )
}
