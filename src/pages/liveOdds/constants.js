// All constants used across the LiveOdds page + its sub-components.
// Split out of LiveOdds.jsx so each leaf component only imports what it uses
// and the page module stops being a 3000-line monolith.

// ── Behaviour knobs ─────────────────────────────────────────────────────────
export const SPARK_TTL_MS = 750
export const PIP_SCROLL_THRESHOLD = 300
export const SCROLL_CONTAINER_SELECTOR = '.middle-content'

// Matches `BET_CONFIG.ODD` in baji-exchange-frontend/src/app/core/constants.ts.
export const PRICE_LIMIT = 20

// ── Domain enums ────────────────────────────────────────────────────────────
export const FANCY_TYPES = {
  ALL: 'all',
  SESSION: 'session',
  FANCY1: 'fancy1',
  ODD_EVEN: 'oddeven',
}

export const FANCY_TYPE_TABS = [
  { type: FANCY_TYPES.ALL, label: 'All' },
  { type: FANCY_TYPES.SESSION, label: 'Session' },
  { type: FANCY_TYPES.FANCY1, label: 'Fancy1' },
  { type: FANCY_TYPES.ODD_EVEN, label: 'Odd Even' },
]

export const SPORTSBOOK_CATEGORIES = {
  ALL: 'all',
  INNINGS: 'innings',
  OVER: 'over',
  MATCH: 'match',
  PLAYERS: 'players',
}

export const SPORTSBOOK_TABS = [
  { type: SPORTSBOOK_CATEGORIES.ALL, label: 'All' },
  { type: SPORTSBOOK_CATEGORIES.INNINGS, label: 'Innings' },
  { type: SPORTSBOOK_CATEGORIES.OVER, label: 'Over' },
  { type: SPORTSBOOK_CATEGORIES.MATCH, label: 'Match' },
  { type: SPORTSBOOK_CATEGORIES.PLAYERS, label: 'Players' },
]

export const MAIN_FANCY = {
  FANCY_BET: 'fancyBet',
  SPORTS_BOOK: 'sportBook',
}

// ── Tailwind class strings ──────────────────────────────────────────────────
export const MATCH_ODDS_TABLE =
  'w-full border-separate [border-spacing:1px_0] max-md:bg-white'

export const TABLE_TH =
  'text-(--dark) text-center align-bottom text-[11px] font-normal pb-[3px] max-md:px-[1.86667vw] max-md:pt-[1.86667vw] max-md:pb-[0.8vw] max-md:text-[3.46667vw] max-md:font-bold'

export const PRICE_CELL_BASE =
  'text-center text-(--header-primary) relative text-[12px] cursor-pointer w-[10.9%] h-[40px] max-md:text-[4vw] max-md:w-[70px] max-md:h-[11.51vw] max-md:px-[1.8666666667vw] py-1 max-md:py-[0.6vw] max-md:min-w-[18.66667vw] hover:opacity-80 [&_p]:font-bold [&_p]:leading-none [&_p]:text-[12px] max-md:[&_p]:text-[3.46667vw] max-md:[&_p]:leading-normal [&_span]:leading-none [&_span]:text-[12px] max-md:[&_span]:text-[2.93333vw]'

// Back (blue) tones
export const BLUE_XS = 'bg-(--back-0) hover:bg-(--back-0-hover)'
export const BLUE_MD = 'bg-(--back-1) hover:bg-(--back-1-hover)'
export const BLUE_XXS = 'bg-(--back-2) hover:bg-(--back-2-hover)'

// Lay (red/pink) tones
export const RED_XS = 'bg-(--lay-0) hover:bg-[rgba(var(--light-red),0.8)]'
export const RED_MD = 'bg-(--lay-1) hover:bg-(--lay-1-hover)'
export const RED_XXS = 'bg-(--lay-2) hover:bg-(--lay-2-hover)'

// Active state (selected cell highlight)
export const BLUE_XS_ACTIVE =
  '!bg-(--lg-blue-bg) !text-white shadow-[inset_0_1px_3px_rgba(var(--black-rgb),0.5)] hover:opacity-100'
export const RED_XS_ACTIVE =
  '!bg-(--lg-red-bg) !text-white shadow-[inset_0_1px_3px_rgba(var(--black-rgb),0.5)] hover:opacity-100'

// Suspended bg (diagonal stripes)
export const BG_LINE =
  '!bg-[url(/img/bg-line.png)] opacity-90 [filter:brightness(0.7)] [background-blend-mode:color-burn] !cursor-default pointer-events-none'

// Spark animations on odds change
export const BACK_SPARK = 'animate-[sparkBack_0.8s_ease-in-out]'
export const LAY_SPARK = 'animate-[sparkLay_0.8s_ease-in-out]'

// Runner-name first cell (white bg desktop / transparent mobile)
export const RUNNER_FIRST_CELL =
  ' bg-white text-start px-[10px] py-[3px] text-(--header-primary) border-t border-(--tbl-border-color) max-md:bg-transparent max-md:px-[1.8666666667vw] max-md:py-[0.3333333333vw] max-md:h-[11.51vw] max-md:text-[4vw]'

// Game-status overlay (suspended / etc.) inside bookmaker / fancy
export const GAME_STATUS_OVERLAY =
  'absolute inset-0 max-w-[665px] !w-full bg-[rgba(36,58,72,0.4)] z-[9] flex items-center justify-center text-white/80 [text-shadow:0_1px_4px_rgba(0,0,0,0.5)] text-[13px] cursor-default hover:bg-[rgba(36,58,72,0.6)] max-md:text-[3.46667vw] max-md:font-bold'

// Fancy info popup
export const FANCY_INFO_POPUP =
  'absolute top-0 right-0 w-auto bg-white z-[99] px-[1.8666666667vw] pb-[1.8666666667vw] shadow-[0_6px_10px_rgba(var(--black-rgb),0.7)] rounded-[1.0666666667vw] flex [&_p]:text-(--sxl-text-color) [&_p]:text-[2.6666666667vw] [&_p]:leading-[3.2vw] [&_p]:pt-[0.8vw] [&_p]:pb-[1.0666666667vw] [&_p]:whitespace-nowrap [&_p]:mb-0 [&_span]:leading-[3.7333333333vw] [&_span]:text-(--dark) [&_span]:whitespace-nowrap [&_span]:text-[3vw]'

export const FANCY_INFO_CLOSE_ICON =
  'pl-[2.5vw] pt-[1vw] inline-flex text-black [&_svg]:!h-[3.2vw] [&_svg]:!w-[3.2vw]'
