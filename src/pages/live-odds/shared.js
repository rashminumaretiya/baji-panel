export const PRICE_LIMIT = 20

export const FANCY_TYPES = {
  ALL: 'all',
  SESSION: 'session',
  FANCY1: 'fancy1',
  ODD_EVEN: 'oddeven',
}

export const SPORTSBOOK_CATEGORIES = {
  ALL: 'all',
  INNINGS: 'innings',
  OVER: 'over',
  MATCH: 'match',
  PLAYERS: 'players',
}

export const MAIN_FANCY = {
  FANCY_BET: 'fancyBet',
  SPORTS_BOOK: 'sportBook',
}

// ─── Tailwind class strings ─────────────────────────────────────────────────

export const TABLE_TH =
  'text-(--dark) text-center align-bottom text-[11px] font-normal pb-[3px] max-md:px-[1.86667vw] max-md:pt-[1.86667vw] max-md:pb-[0.8vw] max-md:text-[3.46667vw] max-md:font-bold'

export const PRICE_CELL_BASE =
  'text-center text-(--header-primary) border-t border-(--tbl-border-color) relative text-[12px] cursor-pointer w-[10.9%] h-[40px] max-md:text-[4vw] max-md:w-[70px] max-md:h-[11.51vw] max-md:px-[1.8666666667vw] py-1 max-md:py-[0.6vw] max-md:min-w-[18.66667vw] [&_p]:font-bold [&_p]:leading-none [&_p]:text-[12px] max-md:[&_p]:text-[3.46667vw] max-md:[&_p]:leading-normal [&_span]:leading-none [&_span]:text-[12px] max-md:[&_span]:text-[2.93333vw]'

export const BLUE_XS = 'bg-(--back-0) hover:bg-(--back-0-hover)'
export const BLUE_MD = 'bg-(--back-1) hover:bg-(--back-1-hover)'
export const BLUE_XXS = 'bg-(--back-2) hover:bg-(--back-2-hover)'

export const RED_XS = 'bg-(--lay-0) hover:bg-[rgba(var(--light-red),0.8)]'
export const RED_MD = 'bg-(--lay-1) hover:bg-(--lay-1-hover)'
export const RED_XXS = 'bg-(--lay-2) hover:bg-(--lay-2-hover)'

const ACTIVE_SHADOW =
  'shadow-[inset_0_1px_3px_rgba(var(--black-rgb),0.5)] hover:opacity-100'

export const BLUE_XS_ACTIVE = `!bg-(--lg-blue-bg) !text-white ${ACTIVE_SHADOW}`
export const BLUE_MD_ACTIVE = `!bg-(--back-0) !text-white ${ACTIVE_SHADOW}`
export const BLUE_XXS_ACTIVE = `!bg-(--back-1) !text-(--header-primary) ${ACTIVE_SHADOW}`

export const RED_XS_ACTIVE = `!bg-(--lg-red-bg) !text-white ${ACTIVE_SHADOW}`
export const RED_MD_ACTIVE = `!bg-(--lay-0) !text-white ${ACTIVE_SHADOW}`
export const RED_XXS_ACTIVE = `!bg-(--lay-1) !text-(--header-primary) ${ACTIVE_SHADOW}`

export const BG_LINE =
  '!bg-[url(/img/bg-line.png)] opacity-90 [filter:brightness(0.7)] [background-blend-mode:color-burn] !cursor-default pointer-events-none'

export const BACK_SPARK = 'animate-[sparkBack_0.8s_ease-in-out]'
export const LAY_SPARK = 'animate-[sparkLay_0.8s_ease-in-out]'

export const FANCY_INFO_POPUP =
  'absolute top-0 right-0 w-auto bg-white z-[99] px-[1.8666666667vw] pb-[1.8666666667vw] shadow-[0_6px_10px_rgba(var(--black-rgb),0.7)] rounded-[1.0666666667vw] flex [&_p]:text-(--sxl-text-color) [&_p]:text-[2.6666666667vw] [&_p]:leading-[3.2vw] [&_p]:pt-[0.8vw] [&_p]:pb-[1.0666666667vw] [&_p]:whitespace-nowrap [&_p]:mb-0 [&_span]:leading-[3.7333333333vw] [&_span]:text-(--dark) [&_span]:whitespace-nowrap [&_span]:text-[3vw]'

export const FANCY_INFO_CLOSE_ICON =
  'pl-[2.5vw] pt-[1vw] inline-flex text-black [&_svg]:!h-[3.2vw] [&_svg]:!w-[3.2vw]'

// ─── Formatters & status helpers ────────────────────────────────────────────

export const fmt = (value, digits = 0) => {
  if (value == null || value === '') return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

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

export const titleCase = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())

export const num = (value) => {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

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

export const isBookmakerStatusBlocked = isMarketStatusBlocked
