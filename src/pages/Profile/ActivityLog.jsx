import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Table from '../../shared/Table.jsx'
import {
  fetchActivityLogs,
  selectActivityLogs,
} from '../../store/slices/accountSlice.js'
import './activityLog.scss'

const wrapSpan = (value) => <span>{value}</span>

const columns = [
  { key: 'loginDateTime', label: 'Login Date & Time' },
  {
    key: 'loginStatus',
    label: 'Login Status',
    cellClassName: (value) => {
      if (typeof value !== 'string' || !value) return ''
      const normalized = value.toLowerCase().trim().replace(/\s+/g, '-')
      return `logInStatus-${normalized}`
    },
    render: wrapSpan,
  },
  { key: 'ipAddress', label: 'IP Address', render: wrapSpan },
  { key: 'isp', label: 'ISP', render: wrapSpan },
  { key: 'cityStateCountry', label: 'City/State/Country', render: wrapSpan },
  { key: 'userAgentType', label: 'User Agent Type', render: wrapSpan },
]

const PER_PAGE = 10

export default function ActivityLog() {
  const dispatch = useDispatch()
  const { data: logs, totalCount } = useSelector(selectActivityLogs)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    dispatch(fetchActivityLogs({ page: currentPage, perPage: PER_PAGE }))
  }, [dispatch, currentPage])

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / PER_PAGE))

  return (
    <div className="inner-outer-wrapper">
      <Table
        title="Activity Log"
        columns={columns}
        data={logs}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      />
    </div>
  )
}
