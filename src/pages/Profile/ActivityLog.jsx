import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { http } from '../../core/http/client.js'
import { selectToken } from '../../store/slices/authSlice.js'
import Table from '../../shared/Table.jsx'
import { formatDateTimeStamp as formatDate } from '../../utils/format.js'

const PER_PAGE = 10

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
  // Verbatim port of baji-exchange-frontend styles.scss:830-842 —
  //   .logInStatus-login-success span { color: var(--dark-green); }
  //   .logInStatus-login-failed  span { color: var(--red); }
  // `!` is required to beat the td's base `text-(--dark)`.
  if (slug.includes('success')) return 'text-(--dark-green)!'
  if (slug.includes('fail') || slug.includes('error')) return 'text-(--red)!'
  return ''
}

export default function ActivityLog() {
  const { t } = useTranslation()
  const token = useSelector(selectToken)

  const columns = useMemo(
    () => [
      {
        key: 'activityAt',
        label: t('activityLog.loginDateTime', 'Login Date & Time'),
        render: (value) => formatDate(value),
      },
      {
        key: 'status',
        label: t('activityLog.loginStatus', 'Login Status'),
        cellClassName: getLoginStatusCellClass,
        render: (value) => <span>{titleCase(value)}</span>,
      },
      {
        key: 'ip',
        label: t('activityLog.ipAddress', 'IP Address'),
        render: wrapSpan,
      },
      { key: 'isp', label: t('activityLog.isp', 'ISP'), render: wrapSpan },
      {
        key: 'country',
        label: t('profile.country', 'Country'),
        render: wrapSpan,
      },
      {
        key: 'country',
        label: t('activityLog.userAgentType', 'User Agent Type'),
        render: wrapSpan,
      },
    ],
    [t]
  )
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
    <div className="max-h-[calc(100svh-240px)] overflow-x-hidden overflow-y-auto [&_table]:w-full [&_table]:table-fixed [&_tbody>tr>td:nth-child(1)]:w-[18%] [&_tbody>tr>td:nth-child(2)]:w-[12%] [&_tbody>tr>td:nth-child(3)]:w-[14%] [&_tbody>tr>td:nth-child(4)]:w-[22%] [&_tbody>tr>td:nth-child(5)]:w-[17%] [&_tbody>tr>td:nth-child(6)]:w-[17%] [&_thead>tr>th:nth-child(1)]:w-[18%] [&_thead>tr>th:nth-child(2)]:w-[12%] [&_thead>tr>th:nth-child(3)]:w-[14%] [&_thead>tr>th:nth-child(4)]:w-[22%] [&_thead>tr>th:nth-child(5)]:w-[17%] [&_thead>tr>th:nth-child(6)]:w-[17%]">
      <Table
        title={t('activityLog.title', 'Activity Log')}
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
