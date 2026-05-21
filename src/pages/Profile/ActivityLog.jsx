import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Table from '../../shared/Table.jsx'
import './activityLog.scss'

const PER_PAGE = 10

// Mirrors Angular's `| date : 'y-MM-dd H:mm:ss'` shared-table formatter
// used for the `type: 'date'` column in baji-exchange-frontend.
function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// Ports baji-exchange-frontend's CommonService.getConvertedAddress —
// flattens each activity row's nested `address.{city, state, country}` into
// a single `country` field formatted as `"city/state/country"`.
function getConvertedAddress(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map((activity) => {
    const { city, state, country } = activity?.address || {}
    return {
      ...activity,
      country: `${city ? `${city}/` : ''}${state ?? ''}/${country ?? ''}`,
    }
  })
}

const wrapSpan = (value) => <span>{value}</span>

// "SUCCESS" → "Success", "FAILED" → "Failed", etc. The API returns all-caps
// status values; baji-exchange-frontend uses `text-transform: capitalize` in
// CSS, but that doesn't lowercase the trailing letters. Easier to normalize
// in JS so the rendered text reads "Success" / "Failed" cleanly.
function titleCase(value) {
  if (typeof value !== 'string' || !value) return value
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

// Columns wired to api.mcv88.live's actual response shape:
// { _id, ip, isp, address: {city, state, country}, status, activity, activityAt }
// `address` is flattened into a combined `country` string by
// `getConvertedAddress` below. baji-exchange-frontend uses different field
// names (`logInAt`, `logInStatus`) — this backend uses `activityAt` + `status`.
const columns = [
  {
    key: 'activityAt',
    label: 'Login Date & Time',
    render: (value) => formatDate(value),
  },
  {
    key: 'status',
    label: 'Login Status',
    cellClassName: (value) => {
      if (typeof value !== 'string' || !value) return ''
      const slug = value.toLowerCase().trim().replace(/\s+/g, '-')
      return `logInStatus-${slug}`
    },
    render: (value) => <span>{titleCase(value)}</span>,
  },
  { key: 'ip', label: 'IP Address', render: wrapSpan },
  { key: 'isp', label: 'ISP', render: wrapSpan },
  { key: 'country', label: 'Country', render: wrapSpan },
  // Angular reuses `country` here for "User Agent Type" — preserving parity.
  { key: 'country', label: 'User Agent Type', render: wrapSpan },
]

export default function ActivityLog() {
  const token = useSelector(selectToken)
  const [logs, setLogs] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    http
      .get(`user/activity-log?page=${currentPage}&perPage=${PER_PAGE}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (cancelled) return
        const rows = res.data?.data?.data ?? []
        setLogs(getConvertedAddress(rows))
        setTotalCount(res.data?.data?.totalCount ?? 0)
      })
    return () => {
      cancelled = true
    }
  }, [token, currentPage])

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
