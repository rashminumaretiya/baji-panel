// Pure helpers extracted from LiveOdds.jsx — no React, no Redux, no DOM.
// Safe to unit-test and import from any sub-component.

export const fmt = (value, digits = 0) => {
  if (value == null || value === '') return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

// Mirrors Angular's default `| number` pipe (format `1.0-3`).
export const fmtPrice = (value) => {
  if (value == null || value === '' || value === 0) return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })
}

export const fmtDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}

export const cx = (...parts) => parts.filter(Boolean).join(' ')

export const titleCase = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())

export const num = (value) => {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

// ── Market status ──────────────────────────────────────────────────────────
const BLOCKED_STATUSES = new Set([
  'SUSPENDED',
  'BALL RUNNING',
  'BALL_RUNNING',
  'BALL_RUNNING_UPPER',
  'CLOSED',
  'SETTLED',
  'INACTIVE',
])

const normalizeStatus = (status) =>
  String(status ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')

export const isMarketStatusBlocked = (status) =>
  BLOCKED_STATUSES.has(normalizeStatus(status))

// Back-compat alias for any imports referencing the old name.
export const isBookmakerStatusBlocked = isMarketStatusBlocked

// ── Spark diffing ──────────────────────────────────────────────────────────
const flagChanged = (current, previous) => {
  if (!Array.isArray(current)) return current
  return current.map((cell, i) => ({
    ...cell,
    isChanged: previous
      ? num(previous?.[i]?.price) !== num(cell?.price)
      : false,
  }))
}

export const diffMatchOddsSpark = (current, previous) => {
  if (!current?.runners) return current
  const prevById = new Map(
    (previous?.runners ?? []).map((r) => [r.selectionId, r])
  )
  return {
    ...current,
    runners: current.runners.map((runner) => {
      const prev = prevById.get(runner.selectionId)
      return {
        ...runner,
        ex: {
          ...runner.ex,
          availableToBack: flagChanged(
            runner.ex?.availableToBack,
            prev?.ex?.availableToBack
          ),
          availableToLay: flagChanged(
            runner.ex?.availableToLay,
            prev?.ex?.availableToLay
          ),
        },
      }
    }),
  }
}

export const clearSpark = (market) => {
  if (!market?.runners) return market
  return {
    ...market,
    runners: market.runners.map((r) => ({
      ...r,
      ex: {
        ...r.ex,
        availableToBack: (r.ex?.availableToBack ?? []).map((c) => ({
          ...c,
          isChanged: false,
        })),
        availableToLay: (r.ex?.availableToLay ?? []).map((c) => ({
          ...c,
          isChanged: false,
        })),
      },
    })),
  }
}

export const normalizeMatchOdds = (raw) => {
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

// ── Bucketing ──────────────────────────────────────────────────────────────
export const groupFancyByType = (items) => {
  const buckets = { session: [], fancy1: [], oddeven: [], all: [] }
  if (!Array.isArray(items)) return buckets

  for (const item of items) {
    const g = (item.gtype || '').toLowerCase()
    if (g === 'session') buckets.session.push(item)
    else if (g === 'fancy1') buckets.fancy1.push(item)
    else if (g === 'oddeven') buckets.oddeven.push(item)
  }

  const sortBySr = (a, b) =>
    (Number(a.sr_no) || Number.MAX_SAFE_INTEGER) -
    (Number(b.sr_no) || Number.MAX_SAFE_INTEGER)

  buckets.session.sort(sortBySr)
  buckets.fancy1.sort(sortBySr)
  buckets.oddeven.sort(sortBySr)
  buckets.all = [...buckets.session, ...buckets.fancy1, ...buckets.oddeven]
  return buckets
}

export const groupSportbookByCategory = (items) => {
  const buckets = { all: [], innings: [], over: [], match: [], players: [] }
  if (!Array.isArray(items)) return buckets

  const nth = /\b\d+(st|nd|rd|th)\b/i
  const overs = /\bovers\s+\d+\s+to\s+\d+\b/i
  const over = /\bover\s+\d+\b/i
  const totalOrTop = /^(total|top)\b/i

  for (const m of items) {
    const name = (m.market || '').toLowerCase()
    buckets.all.push(m)
    if (
      (overs.test(name) || nth.test(name)) &&
      !over.test(name) &&
      !name.includes(',')
    ) {
      buckets.innings.push(m)
    }
    if (over.test(name)) buckets.over.push(m)
    if (name.includes('-') && name.includes(',')) buckets.players.push(m)
    if (
      name.includes('tie') ||
      name.includes('winner') ||
      totalOrTop.test(name)
    ) {
      buckets.match.push(m)
    }
  }
  return buckets
}

// ── Admin patch (socket-driven market-settings updates) ────────────────────
export function applyAdminPatch(current, evt) {
  if (!current) return current
  const sections = ['match_odds', 'bookmaker', 'fancy', 'sportBook']
  const next = { ...current }
  let changed = false
  for (const section of sections) {
    const list = current[section]
    if (!Array.isArray(list)) continue
    let sectionChanged = false
    const updated = list.map((entry) => {
      if (entry.marketId !== evt.marketId) return entry
      sectionChanged = true
      switch (evt.settingName) {
        case 'isSuspended':
          return { ...entry, isSuspended: evt.isSuspended }
        case 'isAdvanceRestricted':
          return { ...entry, isAdvanceRestricted: evt.isAdvanceRestricted }
        case 'pbuLimit':
          return { ...entry, pbuLimit: evt.pbuLimit }
        case 'stakeLimit':
          return { ...entry, stakeLimit: evt.stakeLimit }
        default:
          return entry
      }
    })
    if (sectionChanged) {
      next[section] = updated
      changed = true
    }
  }
  return changed ? next : current
}
