// Shared date formatters. Each function mirrors a specific Angular pipe used
// by the original sbex-user-fe app, kept as separate exports because the
// callers expect different output strings.

// `| date : 'YYYY-MM-dd HH:mm:ss'` — used by table cells across the
// my-account pages (ActivityLog, DepositHistory, WithdrawHistory, Deposit).
export function formatDateTimeStamp(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
