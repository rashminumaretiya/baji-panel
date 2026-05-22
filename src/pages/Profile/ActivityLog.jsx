import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Table from '../../shared/Table.jsx'

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

// Login-status pill colours used to live in the global table.scss as
// `.logInStatus-login-success`, `.logInStatus-login-failed`, etc. That file
// has been deleted, so we map the API status string to inline Tailwind
// utility classes here. Anything not matched falls back to the default cell
// styling (no extra colour).
function getLoginStatusCellClass(value) {
  if (typeof value !== 'string' || !value) return ''
  const slug = value.toLowerCase().trim()
  if (slug.includes('success'))
    return 'text-[var(--avocado-green)] font-bold'
  if (slug.includes('fail') || slug.includes('error'))
    return 'text-[var(--failed-status)] font-bold'
  return ''
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
    cellClassName: getLoginStatusCellClass,
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
    // Fixed column widths (18/12/14/22/17/17%) ported from activityLog.scss
    // via [&_thead>tr>th]/[&_tbody>tr>td] selectors. table-fixed enforces the
    // declared widths instead of letting cells size to content.
    <div className="max-h-[calc(100svh-240px)] overflow-y-auto overflow-x-hidden [&_table]:table-fixed [&_table]:w-full [&_thead>tr>th:nth-child(1)]:w-[18%] [&_thead>tr>th:nth-child(2)]:w-[12%] [&_thead>tr>th:nth-child(3)]:w-[14%] [&_thead>tr>th:nth-child(4)]:w-[22%] [&_thead>tr>th:nth-child(5)]:w-[17%] [&_thead>tr>th:nth-child(6)]:w-[17%] [&_tbody>tr>td:nth-child(1)]:w-[18%] [&_tbody>tr>td:nth-child(2)]:w-[12%] [&_tbody>tr>td:nth-child(3)]:w-[14%] [&_tbody>tr>td:nth-child(4)]:w-[22%] [&_tbody>tr>td:nth-child(5)]:w-[17%] [&_tbody>tr>td:nth-child(6)]:w-[17%]">
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
