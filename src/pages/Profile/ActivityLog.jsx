import { useState } from 'react'
import Table from '../../shared/Table.jsx'
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

export default function ActivityLog() {
  const [logs] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages] = useState(0)

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
