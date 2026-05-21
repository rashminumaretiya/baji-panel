import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Table from '../../shared/Table.jsx'

const PER_PAGE = 10

const columns = [
  {
    key: 'dateTime',
    label: 'Date/Time',
    render: (_v, row) =>
      row?.createdAt ? new Date(row.createdAt).toLocaleString() : '--',
  },
  { key: 'deposit', label: 'Deposit' },
  { key: 'withdraw', label: 'Withdraw' },
  { key: 'balance', label: 'Balance' },
  { key: 'remark', label: 'Remark' },
  {
    key: 'fromTo',
    label: 'From/To',
    render: (_v, row) => `${row?.from ?? '--'} / ${row?.to ?? '--'}`,
  },
]

export default function AccountStatement() {
  const token = useSelector(selectToken)
  const [statements, setStatements] = useState([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    http
      .get(`user/transaction-history?page=${page}&perPage=${PER_PAGE}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (cancelled) return
        setStatements(res.data?.data?.data ?? [])
        setTotalCount(res.data?.data?.totalCount ?? 0)
      })
    return () => {
      cancelled = true
    }
  }, [token, page])

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE))

  return (
    <Table
      title="Account Statement"
      columns={columns}
      data={statements}
      rowKey="_id"
      pagination={{
        currentPage: page,
        totalPages,
        onPageChange: setPage,
      }}
    />
  )
}
