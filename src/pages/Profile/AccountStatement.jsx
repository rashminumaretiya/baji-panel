import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Table from '../../shared/Table.jsx'

const PER_PAGE = 10

export default function AccountStatement() {
  const { t } = useTranslation()
  const token = useSelector(selectToken)
  const [statements, setStatements] = useState([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const columns = useMemo(
    () => [
      {
        key: 'dateTime',
        label: t('common.dateTime', 'Date/Time'),
        render: (_v, row) =>
          row?.createdAt ? new Date(row.createdAt).toLocaleString() : '--',
      },
      { key: 'deposit', label: t('common.deposit', 'Deposit') },
      { key: 'withdraw', label: t('common.withdraw', 'Withdraw') },
      { key: 'balance', label: t('table.columns.balance', 'Balance') },
      { key: 'remark', label: t('table.columns.remarks', 'Remark') },
      {
        key: 'fromTo',
        label: t('common.fromTo', 'From/To'),
        render: (_v, row) => `${row?.from ?? '--'} / ${row?.to ?? '--'}`,
      },
    ],
    [t]
  )

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
      title={t('common.accountStatement', 'Account Statement')}
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
