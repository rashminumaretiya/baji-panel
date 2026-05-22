import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { getSportIdFromSlug, getSportName } from '../core/constant/constants.js'
import { http } from '../core/http/client.js'
import { emitSocket, listenSocket, onReconnect } from '../core/socket/client.js'
import { SOCKET_EVENTS } from '../core/socket/events.js'

import { useIsMobile } from '../hooks/useMediaQuery.js'
import {
  selectCurrency,
  selectIsAuthenticated,
  setLoginWindow,
} from '../store/slices/authSlice.js'
import {
  selectIsYellowTheme,
  setIsPlayLiveStream,
  setMainScreenLoader,
  setStreamUrlAvailable,
} from '../store/slices/commonSlice.js'
import {
  placeBet,
  selectActiveBetSlip,
  selectIsPlacingBet,
  selectPlacingSelectionId,
  setActiveBetSlip,
} from '../store/slices/betSlipSlice.js'
import InlineBetSlip from '../components/GameDetails/InlineBetSlip.jsx'
import { alertService } from '../shared/services/alert.js'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SPARK_TTL_MS = 750
const PIP_SCROLL_THRESHOLD = 300
const SCROLL_CONTAINER_SELECTOR = '.middle-content'
// Matches `BET_CONFIG.ODD` in baji-exchange-frontend/src/app/core/constants.ts.
// `BOOKMAKER_ODD = 99` from the Angular constants is intentionally NOT applied
// to bookmaker cells — the live feed delivers legitimate ACTIVE odds above 99.
const PRICE_LIMIT = 20

const FANCY_TYPES = {
  ALL: 'all',
  SESSION: 'session',
  FANCY1: 'fancy1',
  ODD_EVEN: 'oddeven',
}

const FANCY_TYPE_TABS = [
  { type: FANCY_TYPES.ALL, label: 'All' },
  { type: FANCY_TYPES.SESSION, label: 'Session' },
  { type: FANCY_TYPES.FANCY1, label: 'Fancy1' },
  { type: FANCY_TYPES.ODD_EVEN, label: 'Odd Even' },
]

const SPORTSBOOK_CATEGORIES = {
  ALL: 'all',
  INNINGS: 'innings',
  OVER: 'over',
  MATCH: 'match',
  PLAYERS: 'players',
}

const SPORTSBOOK_TABS = [
  { type: SPORTSBOOK_CATEGORIES.ALL, label: 'All' },
  { type: SPORTSBOOK_CATEGORIES.INNINGS, label: 'Innings' },
  { type: SPORTSBOOK_CATEGORIES.OVER, label: 'Over' },
  { type: SPORTSBOOK_CATEGORIES.MATCH, label: 'Match' },
  { type: SPORTSBOOK_CATEGORIES.PLAYERS, label: 'Players' },
]

const MAIN_FANCY = {
  FANCY_BET: 'fancyBet',
  SPORTS_BOOK: 'sportBook',
}

// ─────────────────────────────────────────────────────────────────────────────
// Tailwind class constants (extracted to keep the JSX readable since the same
// styles repeat across runners, bookmaker rows, fancy rows, etc.)
// ─────────────────────────────────────────────────────────────────────────────

// ── Match-Odds table base
const MATCH_ODDS_TABLE =
  'w-full border-separate [border-spacing:1px_0] max-md:bg-white'

// ── Generic table th/td (mirrors the SCSS .table th / .table td defaults)
const TABLE_TH =
  'text-[var(--dark)] text-center align-bottom text-[11px] font-normal pb-[3px] max-md:px-[1.86667vw] max-md:pt-[1.86667vw] max-md:pb-[0.8vw] max-md:text-[3.46667vw] max-md:font-bold'

// ── Price cell base (back/lay)
const PRICE_CELL_BASE =
  'text-center border-t border-[var(--tbl-border-color)] text-[var(--header-primary)] relative text-[12px] cursor-pointer w-[10.9%] h-[40px] max-md:text-[4vw] max-md:w-[70px] max-md:h-[11.51vw] max-md:min-w-[18.66667vw] hover:opacity-80 [&_p]:font-bold [&_p]:leading-none [&_p]:text-[12px] max-md:[&_p]:text-[3.46667vw] max-md:[&_p]:leading-normal [&_span]:leading-none [&_span]:text-[12px] max-md:[&_span]:text-[2.93333vw]'

// ── Back (blue) tones
const BLUE_XS = 'bg-[var(--back-0)] hover:bg-[var(--back-0-hover)]'
const BLUE_MD = 'bg-[var(--back-1)] hover:bg-[var(--back-1-hover)]'
const BLUE_XXS = 'bg-[var(--back-2)] hover:bg-[var(--back-2-hover)]'

// ── Lay (red/pink) tones
const RED_XS = 'bg-[var(--lay-0)] hover:bg-[rgba(var(--light-red),0.8)]'
const RED_MD = 'bg-[var(--lay-1)] hover:bg-[var(--lay-1-hover)]'
const RED_XXS = 'bg-[var(--lay-2)] hover:bg-[var(--lay-2-hover)]'

// ── Active state (yellow highlight / blue / red as per SCSS)
const BLUE_XS_ACTIVE =
  '!bg-[var(--lg-blue-bg)] !text-white shadow-[inset_0_1px_3px_rgba(var(--black-rgb),0.5)] hover:opacity-100'
const RED_XS_ACTIVE =
  '!bg-[var(--lg-red-bg)] !text-white shadow-[inset_0_1px_3px_rgba(var(--black-rgb),0.5)] hover:opacity-100'

// ── Suspended bg (diagonal stripes)
const BG_LINE =
  '!bg-[url(/img/bg-line.png)] opacity-90 [filter:brightness(0.7)] [background-blend-mode:color-burn] !cursor-default pointer-events-none'

// ── Spark animations on odds change
const BACK_SPARK = 'animate-[sparkBack_0.8s_ease-in-out]'
const LAY_SPARK = 'animate-[sparkLay_0.8s_ease-in-out]'

// ── Runner-name first cell (white bg desktop / transparent mobile)
const RUNNER_FIRST_CELL =
  'whitespace-nowrap bg-white text-start px-[10px] py-[3px] text-[var(--header-primary)] border-t border-[var(--tbl-border-color)] max-md:bg-transparent max-md:px-[1.8666666667vw] max-md:py-[0.3333333333vw]'

// ── Game-status overlay (suspended / etc.) inside bookmaker / fancy
const GAME_STATUS_OVERLAY =
  'absolute inset-0 max-w-[665px] !w-full bg-[rgba(36,58,72,0.4)] z-[9] flex items-center justify-center text-white/80 [text-shadow:0_1px_4px_rgba(0,0,0,0.5)] text-[13px] cursor-default hover:bg-[rgba(36,58,72,0.6)] max-md:text-[3.46667vw] max-md:font-bold'

// ── Fancy_info popup
const FANCY_INFO_POPUP =
  'absolute top-0 right-0 w-auto bg-white z-[99] px-[1.8666666667vw] pb-[1.8666666667vw] shadow-[0_6px_10px_rgba(var(--black-rgb),0.7)] rounded-[1.0666666667vw] flex [&_p]:text-[var(--sxl-text-color)] [&_p]:text-[2.6666666667vw] [&_p]:leading-[3.2vw] [&_p]:pt-[0.8vw] [&_p]:pb-[1.0666666667vw] [&_p]:whitespace-nowrap [&_p]:mb-0 [&_span]:leading-[3.7333333333vw] [&_span]:text-[var(--dark)] [&_span]:whitespace-nowrap [&_span]:text-[3vw]'

const FANCY_INFO_CLOSE_ICON =
  'pl-[2.5vw] pt-[1vw] inline-flex text-black [&_svg]:!h-[3.2vw] [&_svg]:!w-[3.2vw]'

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (value, digits = 0) => {
  if (value == null || value === '') return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

// Mirrors Angular's default `| number` pipe (format `1.0-3`): 1 minimum integer,
// 0 minimum / 3 maximum fractional digits — so 1.7 stays "1.7" (not "1.70"),
// 1.69 stays "1.69", 3371 becomes "3,371" with thousands separator.
const fmtPrice = (value) => {
  if (value == null || value === '' || value === 0) return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })
}

const fmtDate = (date) => {
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

const cx = (...parts) => parts.filter(Boolean).join(' ')

const titleCase = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())

const num = (value) => {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

const isBookmakerStatusBlocked = (status) =>
  status === 'SUSPENDED' ||
  status === 'BALL RUNNING' ||
  status === 'BALL_RUNNING_UPPER'

// Diff back/lay arrays against previous snapshot, flagging cells whose price changed.
const flagChanged = (current, previous) => {
  if (!Array.isArray(current)) return current
  return current.map((cell, i) => ({
    ...cell,
    isChanged: previous
      ? num(previous?.[i]?.price) !== num(cell?.price)
      : false,
  }))
}

const diffMatchOddsSpark = (current, previous) => {
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

const clearSpark = (market) => {
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

const normalizeMatchOdds = (raw) => {
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

// Group fancy items by gtype with stable priority + sort by sr_no.
const groupFancyByType = (items) => {
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

// Categorize sportbook markets by name (Innings / Over / Match / Players).
const groupSportbookByCategory = (items) => {
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

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function LiveOdds() {
  const { t } = useTranslation()
  const { eventId, sport: sportSlug } = useParams()
  const sportId = getSportIdFromSlug(sportSlug)

  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const currency = useSelector(selectCurrency)
  // Match-odds bet slip lives in the right-side <BetSlip /> driven by Redux.
  const activeRightSideBet = useSelector(selectActiveBetSlip)
  const isPlacingBet = useSelector(selectIsPlacingBet)
  const placingSelectionId = useSelector(selectPlacingSelectionId)

  // ── State
  const [matchOddsList, setMatchOddsList] = useState([])
  const [bookmakerOdds, setBookmakerOdds] = useState([])
  const [fancy, setFancy] = useState([])
  const [premium, setPremium] = useState([])
  const [marketSettings, setMarketSettings] = useState(null)
  const [liveStreamUrl, setLiveStreamUrl] = useState(null)
  const [scoreIframeUrl, setScoreIframeUrl] = useState(null)
  const [isLiveStreamOn, setIsLiveStreamOn] = useState(true)
  const [scrolledPastPip, setScrolledPastPip] = useState(false)
  const [selectedFancy, setSelectedFancy] = useState(MAIN_FANCY.FANCY_BET)
  const [selectedFancyPriority, setSelectedFancyPriority] = useState(
    FANCY_TYPES.ALL
  )
  const [selectedSportsbook, setSelectedSportsbook] = useState(
    SPORTSBOOK_CATEGORIES.ALL
  )
  const [betLimitOpen, setBetLimitOpen] = useState(false)
  const [bookmakerInfoOpen, setBookmakerInfoOpen] = useState(false)
  const [fancyInfoIndex, setFancyInfoIndex] = useState(-1)
  const [error, setError] = useState(null)

  // Inline bet-slip pointers for bookmaker / fancy / sportbook.
  // Match odds routes to the right-side BetSlip via Redux (see selectActiveBetSlip).
  const [activeBookmaker, setActiveBookmaker] = useState(null)
  const [activeFancyBet, setActiveFancyBet] = useState(null)
  const [activeSportBook, setActiveSportBook] = useState(null)

  // Refs
  const previousMatchOddsRef = useRef(new Map())
  const sparkClearTimerRef = useRef(null)
  const iframeRef = useRef(null)

  // ── Spark processing
  const processMatchOddsList = useCallback((incoming) => {
    if (!Array.isArray(incoming)) return []
    const prevMap = previousMatchOddsRef.current
    const next = incoming.map((market) => {
      const prev = prevMap.get(market?.marketId)
      const sparked = diffMatchOddsSpark(market, prev)
      prevMap.set(market?.marketId, sparked)
      return sparked
    })
    if (sparkClearTimerRef.current) clearTimeout(sparkClearTimerRef.current)
    sparkClearTimerRef.current = setTimeout(() => {
      setMatchOddsList((prev) => prev.map((m) => clearSpark(m)))
    }, SPARK_TTL_MS)
    return next
  }, [])

  useEffect(() => {
    const sparkTimer = sparkClearTimerRef
    const prevOdds = previousMatchOddsRef
    return () => {
      if (sparkTimer.current) clearTimeout(sparkTimer.current)
      prevOdds.current.clear()
    }
  }, [])

  // ── Default odds fetch — drives the global `loader-wrapper` overlay via
  // `setMainScreenLoader`, exactly like Angular's `commonService.showLoader()`
  // / `hideLoader()` flow in `live-odds.component.ts`.
  const loadDefaultOdds = useCallback(
    async (signal) => {
      if (!sportId || !eventId) return
      dispatch(setMainScreenLoader(true))
      setError(null)
      try {
        const response = await http.post(
          'sport/default-odds',
          { sportId, eventId },
          { signal }
        )
        const payload = response?.data?.data ?? response?.data ?? {}
        previousMatchOddsRef.current.clear()
        setMatchOddsList(processMatchOddsList(payload.match_odds ?? []))
        setBookmakerOdds(payload.bookmaker ?? [])
        setFancy(payload.fancy ?? [])
        setPremium(payload.premium ?? payload.sportBook ?? [])
        setMarketSettings(payload.marketSetting ?? null)
        const tvUrl = payload.tv || null
        setLiveStreamUrl(tvUrl)
        setScoreIframeUrl(payload.iframeScore || payload.iframeScoreV2 || null)
        dispatch(setStreamUrlAvailable(!!tvUrl))
        dispatch(setIsPlayLiveStream(!!tvUrl))
        if (tvUrl) setIsLiveStreamOn(true)
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED')
          return
        setError(err)
      } finally {
        dispatch(setMainScreenLoader(false))
      }
    },
    [sportId, eventId, processMatchOddsList, dispatch]
  )

  useEffect(() => {
    const controller = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDefaultOdds(controller.signal)
    return () => controller.abort()
  }, [loadDefaultOdds])

  useEffect(() => {
    return () => {
      dispatch(setStreamUrlAvailable(false))
      dispatch(setIsPlayLiveStream(false))
      dispatch(setActiveBetSlip(null))
    }
  }, [dispatch])

  // Open bets are fetched + polled by <OpenBets /> itself (which reads the
  // current route's `eventId` from useParams), so it works on /odds/:eventId
  // (event-scoped) and on home / list pages (all events).

  // ── Socket subscriptions
  useEffect(() => {
    if (!sportId || !eventId) return undefined
    const payload = { sportId, eventId }

    const subscribe = () => {
      emitSocket(SOCKET_EVENTS.MARKET_ODDS, payload)
      emitSocket(SOCKET_EVENTS.FANCY_BM_ODDS, payload)
      emitSocket(SOCKET_EVENTS.PREMIUM_FANCY_ODDS, payload)
    }
    subscribe()

    const offMatch = listenSocket(SOCKET_EVENTS.MARKET_ODDS, (odds) => {
      if (!odds) return
      const list = Array.isArray(odds) ? odds : [odds]
      setMatchOddsList(processMatchOddsList(list))
    })

    const offFancyBm = listenSocket(SOCKET_EVENTS.FANCY_BM_ODDS, (odds) => {
      if (!odds) return
      // Server may emit as { bookmaker, fancy } or as the wire-level tuple
      // [eventName, { bookmaker, fancy }] — accept either.
      const data = Array.isArray(odds) ? (odds[1] ?? {}) : odds
      if (Array.isArray(data?.bookmaker)) setBookmakerOdds(data.bookmaker)
      if (Array.isArray(data?.fancy)) setFancy(data.fancy)
    })

    const offPremium = listenSocket(
      SOCKET_EVENTS.PREMIUM_FANCY_ODDS,
      (odds) => {
        if (!odds) return
        const list = Array.isArray(odds)
          ? odds
          : (odds.premium ?? odds.sportBook)
        if (list) setPremium(list)
      }
    )

    const offAdmin = listenSocket(
      SOCKET_EVENTS.ADMIN_SETTINGS_CHANGED,
      (evt) => {
        if (!evt || evt.eventId !== eventId) return
        setMarketSettings((current) => applyAdminPatch(current, evt))
      }
    )

    const offReconnect = onReconnect(subscribe)

    return () => {
      emitSocket(SOCKET_EVENTS.ODDS_LEAVE, payload)
      offMatch?.()
      offFancyBm?.()
      offPremium?.()
      offAdmin?.()
      offReconnect?.()
    }
  }, [sportId, eventId, processMatchOddsList])

  // ── PIP scroll handler
  useEffect(() => {
    if (!isMobile) return undefined
    const scrollEl = document.querySelector(SCROLL_CONTAINER_SELECTOR)
    if (!scrollEl) return undefined
    const handler = () => {
      setScrolledPastPip(scrollEl.scrollTop > PIP_SCROLL_THRESHOLD)
    }
    scrollEl.addEventListener('scroll', handler, { passive: true })
    return () => scrollEl.removeEventListener('scroll', handler)
  }, [isMobile])

  // ── Derived data
  const matchOddsArray = useMemo(
    () => normalizeMatchOdds(matchOddsList),
    [matchOddsList]
  )
  const isInplay = useMemo(
    () => matchOddsArray.some((m) => m.inplay),
    [matchOddsArray]
  )
  const fancyBuckets = useMemo(() => groupFancyByType(fancy), [fancy])
  const sportbookBuckets = useMemo(
    () => groupSportbookByCategory(premium),
    [premium]
  )

  const filteredFancy = useMemo(
    () => fancyBuckets[selectedFancyPriority] ?? [],
    [fancyBuckets, selectedFancyPriority]
  )
  const filteredSportbook = useMemo(
    () => sportbookBuckets[selectedSportsbook] ?? [],
    [sportbookBuckets, selectedSportsbook]
  )

  const fancyMainTabs = useMemo(() => {
    const tabs = []
    if (fancy.length)
      tabs.push({ type: MAIN_FANCY.FANCY_BET, title: 'Fancy Bet' })
    if (premium.length && isAuthenticated) {
      tabs.push({ type: MAIN_FANCY.SPORTS_BOOK, title: 'Premium Cricket' })
    }
    return tabs
  }, [fancy.length, premium.length, isAuthenticated])

  useEffect(() => {
    if (
      fancyMainTabs.length &&
      !fancyMainTabs.some((t) => t.type === selectedFancy)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedFancy(fancyMainTabs[0].type)
    }
  }, [fancyMainTabs, selectedFancy])

  const bookmakerSetting = useMemo(() => {
    const list = marketSettings?.bookmaker ?? []
    const s = list[0]
    return {
      min: s?.stakeLimit?.min ?? bookmakerOdds?.[0]?.min ?? 1,
      max: s?.stakeLimit?.max ?? bookmakerOdds?.[0]?.max ?? 10000,
      isSuspended: s?.isSuspended ?? false,
      pbuLimit: s?.pbuLimit,
    }
  }, [marketSettings, bookmakerOdds])

  const matchOddsSettingFor = useCallback(
    (marketId) => {
      const list = marketSettings?.match_odds ?? []
      const s = list.find((row) => row.marketId === marketId)
      return {
        min: s?.stakeLimit?.min ?? 1,
        max: s?.stakeLimit?.max ?? 100,
        isSuspended: s?.isSuspended ?? false,
        pbuLimit: s?.pbuLimit ?? 0,
      }
    },
    [marketSettings]
  )

  // ── Handlers
  const refreshMarkets = useCallback(() => {
    const controller = new AbortController()
    void loadDefaultOdds(controller.signal)
  }, [loadDefaultOdds])

  const toggleLiveStream = useCallback(() => setIsLiveStreamOn((on) => !on), [])
  const closeLiveStream = useCallback(() => setIsLiveStreamOn(false), [])

  // Inline bookmaker / fancy / sportsbook slips. Dispatches the Redux thunk so
  // the loading flag (`isPlacingBet` + `placingSelectionId`) propagates to the
  // <InlineBetSlip /> button disabled state across the page.
  const handlePlaceBet = useCallback(
    async (slip, onDone) => {
      const context = {
        sport: sportSlug ?? '',
        eventId: String(eventId ?? ''),
        eventTitle:
          matchOddsList?.[0]?.eventName || matchOddsList?.[0]?.eventTitle || '',
        runners: matchOddsList?.[0]?.runners ?? [],
      }
      try {
        await dispatch(placeBet({ slip, context })).unwrap()
        alertService.success('Bet placed successfully')
        onDone?.()
      } catch (msg) {
        alertService.error(
          typeof msg === 'string' ? msg : 'Failed to place bet'
        )
      }
    },
    [dispatch, sportSlug, eventId, matchOddsList]
  )

  const toggleFullscreen = useCallback(() => {
    const node = iframeRef.current
    if (!node) return
    if (node.requestFullscreen) node.requestFullscreen()
    else if (node.webkitRequestFullscreen) node.webkitRequestFullscreen()
  }, [])

  const onMatchOddsClick = (runner, odd, betType) => {
    if (!odd?.price) return
    if (!isAuthenticated) {
      dispatch(setLoginWindow(true))
      return
    }
    // Match Odds bets are placed in the right-side BetSlip panel (Redux).
    // Payload shape matches what `src/components/BetSlip.jsx` reads.
    dispatch(
      setActiveBetSlip({
        marketId: runner._marketId,
        marketName: runner._marketName || 'Match Odds',
        eventTitle: runner._eventTitle || '',
        selectionId: runner.selectionId,
        selectionName: runner.runnerName || runner.runner,
        betType,
        odd: odd.price,
        size: odd.size,
        stake: '',
      })
    )
  }
  const onBookmakerClick = (bookmaker, odd, betType) => {
    if (!odd?.price) return
    if (isBookmakerStatusBlocked(bookmaker.s ?? bookmaker.status)) return
    if (!isAuthenticated) {
      dispatch(setLoginWindow(true))
      return
    }
    setActiveBookmaker({
      marketId: bookmaker.mid ?? bookmaker.marketId,
      marketName: 'BOOKMAKER',
      type: betType,
      selectionId: bookmaker.sid ?? bookmaker.selectionId,
      runnerId: bookmaker.sid ?? bookmaker.selectionId,
      runnerName: bookmaker.nat ?? bookmaker.runnerName,
      betType,
      odds: odd.price,
      stake: 0,
      min: Number(bookmaker.min ?? 1),
      max: Number(bookmaker.max ?? 10000),
    })
  }
  const onFancyClick = (item, betType) => {
    const price = betType === 'NO' ? item.LayPrice1 : item.BackPrice1
    const size = betType === 'NO' ? item.LaySize1 : item.BackSize1
    if (!price || item.GameStatus === 'SUSPENDED') return
    if (!isAuthenticated) {
      dispatch(setLoginWindow(true))
      return
    }
    setActiveFancyBet({
      marketId: item.default_marketId,
      marketName: 'FANCY',
      type: betType,
      selectionId: item.SelectionId,
      runnerId: item.SelectionId,
      runnerName: item.RunnerName,
      betType,
      odds: price,
      size,
      stake: 0,
      min: Number(item.min ?? 1),
      max: Number(item.max ?? 1000),
      gtype: item.gtype,
    })
  }
  const onSportbookClick = (market, runner) => {
    if (
      !runner?.back?.[0]?.price ||
      market.status !== '1' ||
      runner.status !== '1'
    )
      return
    if (!isAuthenticated) {
      dispatch(setLoginWindow(true))
      return
    }
    setActiveSportBook({
      marketId: market.marketId,
      marketName: 'SPORTS_BOOK',
      type: 'BACK',
      selectionId: runner.selectionId,
      runnerId: runner.selectionId,
      runnerName: runner.runnerName,
      betType: 'BACK',
      odds: runner.back[0].price,
      stake: 0,
      min: 1,
      max: 5000,
    })
  }

  // ── Render
  if (error) {
    return (
      <div className="p-4">
        <p className="text-[12px] text-[var(--red)] mb-2">
          Failed to load markets: {error?.message || 'Unknown error'}
        </p>
        <button
          type="button"
          className="text-[12px] px-3 py-1 bg-[var(--sm-text-color)] text-white rounded"
          onClick={refreshMarkets}
        >
          Retry
        </button>
      </div>
    )
  }

  const hasLiveStream = !!liveStreamUrl
  const hasScoreboard = !!scoreIframeUrl
  const showStream = isAuthenticated && hasLiveStream && isLiveStreamOn
  const showPip = isMobile && scrolledPastPip && showStream

  return (
    <div>
      <div className={cx('mobile:mt-1', isYellowTheme && 'yellow-theme')}>
        {isMobile && showStream && (
          <>
            {showPip && (
              <div className="w-full aspect-video max-md:aspect-video" />
            )}
            <div
              className={cx(
                'hover:[&_.close]:opacity-100',
                showPip &&
                  'fixed top-[120px] left-[calc(50%-40px)] z-[999] max-w-[260px] h-auto transition-all duration-300 ease-in-out max-h-[32vw] overflow-visible max-md:top-[15.583vw] max-md:left-auto max-md:right-[1vw] max-md:max-w-[54.167vw] max-md:rounded-[2vw] max-md:overflow-hidden'
              )}
            >
              <LiveStream
                url={liveStreamUrl}
                iframeRef={iframeRef}
                onClose={closeLiveStream}
                onFullscreen={toggleFullscreen}
                hideClose={isMobile}
                isPip={showPip}
              />
            </div>
          </>
        )}

        <div className={cx(isMobile && showStream && '')}>
          {isMobile && (
            <div className="bg-[var(--text-color)] flex justify-between items-center px-3 mr-0 leading-[2] text-white">
              <span className="capitalize">{getSportName(sportId)}</span>
              {isInplay && (
                <div className="inline-flex items-center [&_i]:inline-flex [&_i]:rounded-[0.8vw] [&_i]:mr-[0.6vw] [&_i]:bg-gradient-to-t [&_i]:from-[var(--xs-green-primary)] [&_i]:via-[var(--xs-green-primary)] [&_i]:to-[var(--xs-shadow-primary)] [&_small]:text-[3.2666666667vw] [&_small]:font-normal">
                  <i aria-hidden="true" />
                  <small>In-Play</small>
                </div>
              )}
            </div>
          )}

          {hasScoreboard && isAuthenticated && (
            <div
              className={cx(
                'text-center pb-0 bg-[#1e1e1e]',
                isMobile && '[&_iframe]:max-md:h-[185px]'
              )}
            >
              <iframe
                className="block"
                src={scoreIframeUrl}
                width="100%"
                height="100%"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;"
                allowFullScreen
                title={t('common.scoreboard', 'Scoreboard')}
              />
            </div>
          )}

          <PinRefresh onRefresh={refreshMarkets} />
        </div>
        <div>
          {matchOddsArray.map((matchOdds, idx) => (
            <MatchOddsSection
              key={matchOdds.marketId}
              matchOdds={matchOdds}
              isMobile={isMobile}
              isAuthenticated={isAuthenticated}
              isYellowTheme={isYellowTheme}
              currency={currency}
              marketSetting={matchOddsSettingFor(matchOdds.marketId)}
              isStreamAvailable={hasLiveStream}
              isLiveStreamOn={isLiveStreamOn}
              onToggleLive={toggleLiveStream}
              active={
                activeRightSideBet?.marketName === 'Match Odds' &&
                activeRightSideBet?.marketId === matchOdds.marketId
                  ? activeRightSideBet
                  : null
              }
              onPick={onMatchOddsClick}
              onCancelMatchOdds={() => dispatch(setActiveBetSlip(null))}
              onPlaceBet={handlePlaceBet}
              isPlacingActive={
                isPlacingBet &&
                String(placingSelectionId) ===
                  String(activeRightSideBet?.selectionId ?? '')
              }
              betLimitOpen={betLimitOpen}
              onToggleBetLimit={() => setBetLimitOpen((v) => !v)}
              // Live stream slot — mirrors Angular's `<ng-container [ngTemplateOutlet]="liveStream"></ng-container>`
              // rendered inside the first match-odds-wrapper.
              liveStreamSlot={
                idx === 0 && !isMobile && showStream ? (
                  <LiveStream
                    url={liveStreamUrl}
                    iframeRef={iframeRef}
                    onClose={closeLiveStream}
                    onFullscreen={toggleFullscreen}
                  />
                ) : null
              }
            />
          ))}

          {bookmakerOdds.length > 0 && (
            <BookmakerSection
              runners={bookmakerOdds}
              setting={bookmakerSetting}
              isMobile={isMobile}
              infoOpen={bookmakerInfoOpen}
              onToggleInfo={() => setBookmakerInfoOpen((v) => !v)}
              active={activeBookmaker}
              onActiveChange={setActiveBookmaker}
              onPick={onBookmakerClick}
              onPlaceBet={handlePlaceBet}
              isPlacingActive={
                isPlacingBet &&
                String(placingSelectionId) ===
                  String(activeBookmaker?.selectionId ?? '')
              }
            />
          )}

          {fancyMainTabs.length > 0 && (
            <div className="mt-4">
              <FancyTabHeader
                tabs={fancyMainTabs}
                selectedFancy={selectedFancy}
                onSelect={setSelectedFancy}
                isMobile={isMobile}
              />

              {selectedFancy === MAIN_FANCY.FANCY_BET && (
                <FancySection
                  items={filteredFancy}
                  buckets={fancyBuckets}
                  selectedType={selectedFancyPriority}
                  onSelectType={setSelectedFancyPriority}
                  isMobile={isMobile}
                  fancyInfoIndex={fancyInfoIndex}
                  setFancyInfoIndex={setFancyInfoIndex}
                  active={activeFancyBet}
                  onActiveChange={setActiveFancyBet}
                  onPick={onFancyClick}
                  onPlaceBet={handlePlaceBet}
                  isPlacingActive={
                    isPlacingBet &&
                    String(placingSelectionId) ===
                      String(activeFancyBet?.selectionId ?? '')
                  }
                />
              )}

              {selectedFancy === MAIN_FANCY.SPORTS_BOOK && (
                <SportbookSection
                  markets={filteredSportbook}
                  selectedCategory={selectedSportsbook}
                  onSelectCategory={setSelectedSportsbook}
                  active={activeSportBook}
                  onActiveChange={setActiveSportBook}
                  onPick={onSportbookClick}
                  onPlaceBet={handlePlaceBet}
                  isPlacingActive={
                    isPlacingBet &&
                    String(placingSelectionId) ===
                      String(activeSportBook?.selectionId ?? '')
                  }
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components — flat, file-local, mirror Angular template fragments 1:1
// ─────────────────────────────────────────────────────────────────────────────

function PinRefresh({ onRefresh }) {
  const { t } = useTranslation()
  // Each div is a Pin / Refresh pill; the first has a rotated ::before tail,
  // the second a rotated ::after tail to give the angled-pill shape.
  const baseDiv =
    'text-white font-bold z-[1] min-w-[90px] h-[25px] leading-[20px] relative max-md:px-3 max-md:py-[6px] max-md:h-[7.46667vw] max-md:leading-tight max-md:text-[3.2vw] max-md:min-w-[25.5vw] [&_i_svg]:h-[14px] [&_i_svg]:w-[14px] max-md:[&_i_svg]:h-[3.73333vw] max-md:[&_i_svg]:w-[3.73333vw] mobile:[&_span]:hidden'

  const firstDiv = `${baseDiv} bg-[var(--text-xl-color)] rounded-bl-[10px] max-md:bg-gradient-to-t max-md:from-[var(--xls-navy)] max-md:to-[var(--xts-light-bg)] max-md:w-[25.5vw] max-md:rounded-bl-[3vw] before:content-[''] before:absolute before:left-[-3px] before:w-[19px] before:bg-[var(--text-xl-color)] before:top-[-4px] before:bottom-[1px] before:-z-[1] before:[transform:rotate(-22deg)] before:rounded-bl-[10px] max-md:before:[transform:rotate(-16deg)] max-md:before:bg-gradient-to-t max-md:before:from-[var(--xs-navy)] max-md:before:to-[var(--xts-md-bg)] max-md:before:rounded-bl-[3vw]`

  const secondDiv = `${baseDiv} bg-[var(--text-xl-color)] shadow-[1px_0_0_0_rgba(255,255,255,0.3)_inset] rounded-br-[10px] max-md:bg-gradient-to-t max-md:from-[var(--xls-navy)] max-md:to-[var(--xts-light-bg)] max-md:rounded-br-[3vw] max-md:border-l-[0.53333vw] max-md:border-l-[rgba(22,40,49,0.9)] after:content-[''] after:absolute after:right-[-3px] after:w-[19px] after:bg-[var(--text-xl-color)] after:top-[-4px] after:bottom-[1px] after:-z-[1] after:rounded-br-[10px] after:[transform:rotate(22deg)] max-md:after:[transform:rotate(16deg)] max-md:after:bg-gradient-to-t max-md:after:from-[var(--xs-navy)] max-md:after:to-[var(--xts-md-bg)] max-md:after:rounded-br-[3vw]`

  return (
    <div className="text-center overflow-hidden bg-white mt-px max-md:bg-[var(--light-bg)] max-md:mt-0">
      <div className="inline-flex items-center relative cursor-pointer">
        <div className={firstDiv}>
          <PinIcon />
          <span>{t('common.pin', 'Pin')}</span>
        </div>
        <div className={secondDiv} onClick={onRefresh} role="button">
          <RefreshIcon />
          <span>{t('common.refresh', 'Refresh')}</span>
        </div>
      </div>
    </div>
  )
}

function LiveStream({
  url,
  iframeRef,
  onClose,
  onFullscreen,
  hideClose,
  isPip,
}) {
  const { t } = useTranslation()
  if (!url) return null
  return (
    <div className="relative max-w-[500px] mx-auto text-center mobile:mb-3 mobile:p-2 pb-0 max-md:max-w-full max-md:overflow-hidden">
      <iframe
        ref={iframeRef}
        className={cx(
          'mx-auto h-auto block aspect-video',
          isPip
            ? 'max-w-[260px] max-md:max-w-[54.167vw] max-md:h-[32vw]'
            : 'max-w-[480px] max-md:max-w-full max-md:w-full'
        )}
        src={url}
        width="100%"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;"
        allowFullScreen
        title={t('common.liveStream', 'Live stream')}
      />
      {!hideClose && (
        <div
          className={cx(
            'absolute top-[15px] right-[15px] max-[991px]:right-0',
            isPip &&
              'top-[5px] right-[5px] max-md:top-[1.042vw] max-md:right-[1.042vw]'
          )}
        >
          <i
            className={cx(
              'close cursor-pointer h-[35px] w-[50px] bg-black/50 rounded-md border border-[var(--xxl-gray)] flex items-center justify-center z-[999] text-white hover:bg-black/60 [&_svg]:h-[14px] [&_svg]:w-[14px] max-md:h-[8.33333vw] max-md:w-[8.33333vw] max-md:[&_svg]:h-[2.73333vw] max-md:[&_svg]:w-[2.73333vw]',
              isPip &&
                '!rounded-full !h-[15px] !w-[15px] max-md:!h-[3.125vw] max-md:!w-[3.125vw]'
            )}
            onClick={onClose}
            role="button"
            aria-label={t('common.close', 'Close')}
          >
            <CloseIcon />
          </i>
        </div>
      )}
      <div>
        <i
          className="absolute right-[18px] bottom-[8px] max-md:right-[16px] cursor-pointer"
          onClick={onFullscreen}
          role="button"
          aria-label={t('common.fullscreen', 'Fullscreen')}
        >
          <FullscreenIcon />
        </i>
      </div>
    </div>
  )
}

function MatchOddsSection({
  matchOdds,
  isMobile,
  isAuthenticated,
  isYellowTheme,
  currency,
  marketSetting,
  isStreamAvailable,
  isLiveStreamOn,
  onToggleLive,
  active,
  onPick,
  onCancelMatchOdds,
  onPlaceBet,
  isPlacingActive,
  betLimitOpen,
  onToggleBetLimit,
  liveStreamSlot,
}) {
  const { t } = useTranslation()
  if (!matchOdds) return null
  const totalMatched = num(matchOdds.totalMatched)
  const minMaxStr = `${fmt(marketSetting.min || 1)} / ${fmt(marketSetting.max || 100)}`

  const matchOddsTabClass = isYellowTheme
    ? // mobile yellow theme: gradient + coffee border + dark text
      'inline-block relative font-bold mr-0 max-md:!bg-gradient-to-t max-md:!from-[#ffa10c] max-md:!to-[var(--md-primary-yellow)] max-md:border max-md:!border-[var(--coffee)] max-md:!text-[var(--dark)] max-md:px-[3.4vw] max-md:rounded-[4.8vw] max-md:text-[3.46667vw] max-md:leading-[9.06667vw] mobile:bg-[var(--sm-white)] mobile:text-[var(--xxl-blue)] mobile:px-[2px] mobile:py-[8px_2px_7px_10px] mobile:py-2 mobile:pl-[10px] mobile:pr-[2px] mobile:text-[13px] mobile:mr-5 mobile:after:content-[""] mobile:after:absolute mobile:after:[background-image:url(/img/main-s1aea395e8c.png)] mobile:after:z-[1] mobile:after:bottom-0 mobile:after:top-0 mobile:after:-right-5 mobile:after:h-[30px] mobile:after:[background-position:432px_1725px] mobile:after:w-5'
    : 'inline-block relative font-bold mr-0 max-md:text-white max-md:border max-md:border-[rgba(var(--md-dark-rgb),0.3)] max-md:bg-gradient-to-b max-md:from-[var(--xs-primary)] max-md:to-[var(--xxs-primary)] max-md:px-[3.4vw] max-md:rounded-[4.8vw] max-md:text-[3.46667vw] max-md:leading-[9.06667vw] mobile:bg-[var(--sm-white)] mobile:text-[var(--xxl-blue)] mobile:pl-[10px] mobile:pr-[2px] mobile:py-2 mobile:text-[13px] mobile:mr-5 mobile:after:content-[""] mobile:after:absolute mobile:after:[background-image:url(/img/main-s1aea395e8c.png)] mobile:after:z-[1] mobile:after:bottom-0 mobile:after:top-0 mobile:after:-right-5 mobile:after:h-[30px] mobile:after:[background-position:432px_1725px] mobile:after:w-5'

  return (
    <div className="mobile:mb-[30px]">
      <div className="flex flex-wrap justify-between items-center relative">
        <div className="w-full">
          <div
            className={cx(
              'flex justify-between relative bg-white border-b border-[var(--sm-text-color)]',
              'max-md:border-b-0 max-md:bg-[var(--light-bg)] max-md:p-[1.86667vw]'
            )}
          >
            <div>
              <span className={matchOddsTabClass}>
                {t('odds.matchOdds', 'Match Odds')}
              </span>
              {!isMobile && (
                <span
                  className={cx(
                    'text-[13px] ml-2 align-text-bottom inline-block',
                    matchOdds.inplay
                      ? 'text-[var(--dark-green)]'
                      : 'text-inherit'
                  )}
                >
                  <i
                    className={cx(
                      "inline-block align-middle w-[15px] h-[15px] mr-[5px] [background-image:url('/img/main-s1aea395e8c.png')]",
                      matchOdds.inplay
                        ? '[background-position:-399px_-2401px]'
                        : '[background-position:-399px_-2869px]'
                    )}
                  />
                  <span className="inline-block ml-1 align-middle">
                    {matchOdds.inplay
                      ? t('common.inPlay', 'In-Play')
                      : fmtDate(matchOdds.marketStartTime)}
                  </span>
                </span>
              )}
            </div>
            {!isMobile && (
              <>
                <div className="flex text-black absolute top-0 left-1/2 -translate-x-1/2 my-[7px] mx-[5px] bg-[var(--xl-light-bg)] text-[12px] leading-4 rounded-[3px] px-[6px] !text-[var(--sm-xl-dark)]">
                  <p className="mb-0">
                    {t('common.min', 'Min')}/ {t('common.max', 'Max')}
                  </p>
                  <p className="mb-0 ml-1">
                    <small className="text-[13px] text-[var(--light-navy)]">
                      {minMaxStr}
                    </small>
                  </p>
                </div>
                <div className="flex">
                  <div className="flex items-center text-[13px] text-[var(--lg-white,#fff)] [&_span]:font-bold">
                    <p className="m-0">{t('common.matched', 'Matched')}</p>
                    <span className="ml-1">{currency || 'PBU'}</span>
                    <span className="ml-1 mr-2">{fmt(totalMatched)}</span>
                  </div>
                  {isAuthenticated && isStreamAvailable && (
                    <div>
                      <button
                        type="button"
                        className={cx(
                          'relative h-[23px] leading-[19px] rounded-[3px] text-white px-[7px] my-[3px_4px_3px_5px] mx-[5px] text-[13px] before:content-[""] before:inline-block before:[background-image:url(/img/live-icons.png)] before:align-middle before:mr-[5px] before:[background-position:-396px_-2453px] before:h-[15px] before:w-[18px]',
                          isLiveStreamOn
                            ? 'bg-gradient-to-b from-[var(--md-cloud)] to-[var(--lg-cloud)]'
                            : 'bg-gradient-to-b from-[var(--mds-orange)] to-[var(--lg-orange)] before:[background-image:url(/img/close-live.png)] before:[background-position:center]'
                        )}
                        onClick={onToggleLive}
                      >
                        {t('common.live', 'Live')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {liveStreamSlot}

      <div className="overflow-auto">
        <table className={MATCH_ODDS_TABLE}>
          <thead>
            <tr>
              {isMobile ? (
                <>
                  <th className={cx(TABLE_TH, 'text-start whitespace-nowrap')}>
                    <div className="flex items-center">
                      <div className="bg-[var(--light-bg)] relative max-md:m-[-1.86vw_3.7vw_-2vw_-1.9vw] max-md:p-[2.13333vw_1.86667vw_3.2vw_1.86667vw] max-md:before:content-[''] max-md:before:absolute max-md:before:top-0 max-md:before:left-[10.4vw] max-md:before:border-b-[14.33333vw] max-md:before:border-b-transparent max-md:before:border-l-[1.86667vw] max-md:before:border-l-[var(--light-bg)] [&_svg]:max-md:w-[6.66667vw] [&_svg]:max-md:h-[6.66667vw]">
                        <InfoIcon onClick={onToggleBetLimit} />
                        {betLimitOpen && (
                          <div
                            className={cx(
                              FANCY_INFO_POPUP,
                              'left-0 w-max [&_svg]:!h-[14px] [&_svg]:!w-[14px]'
                            )}
                          >
                            <div>
                              <p>{t('common.max', 'Max')}</p>
                              <span>{fmt(marketSetting.max || 100)}</span>
                            </div>
                            <i
                              className={FANCY_INFO_CLOSE_ICON}
                              onClick={onToggleBetLimit}
                              role="button"
                            >
                              <CloseIcon />
                            </i>
                          </div>
                        )}
                      </div>
                      <i className="[background-image:url('/img/svg/barChart.svg')] bg-contain bg-no-repeat max-md:w-[6.5vw] max-md:h-[6.66667vw]" />
                      <div className="max-md:pl-[1.86667vw] [&_p]:leading-[7px] [&_p]:font-normal [&_p]:mt-1 [&_p]:max-md:text-[2.93333vw] [&_span]:font-bold [&_span]:max-md:text-[2.93333vw]">
                        <p className="mb-0">{t('common.matched', 'Matched')}</p>
                        <span>{currency || 'PBU'}</span>{' '}
                        <span>{fmt(totalMatched)}</span>
                      </div>
                    </div>
                  </th>
                  <th className={cx(TABLE_TH, '!w-[18.66667vw]')}>
                    {t('common.back', 'Back')}
                  </th>
                  <th className={cx(TABLE_TH, '!w-[18.66667vw]')}>
                    {t('common.lay', 'Lay')}
                  </th>
                </>
              ) : (
                <>
                  <th
                    className={cx(
                      TABLE_TH,
                      'text-start whitespace-nowrap text-[var(--sm-text-color)] pt-[20px] pl-1'
                    )}
                  >
                    {matchOdds.numberOfRunners ??
                      matchOdds.runners?.length ??
                      0}{' '}
                    {t('common.selection', 'Selection')}
                  </th>
                  <th colSpan={3} className={cx(TABLE_TH, 'text-start')}>
                    101%
                  </th>
                  <th colSpan={3} className={cx(TABLE_TH, 'text-end')}>
                    99.6%
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {(matchOdds.runners ?? []).map((runner, rowIdx) => {
              const back = runner.ex?.availableToBack ?? []
              const lay = runner.ex?.availableToLay ?? []
              const runnerExt = {
                ...runner,
                _marketId: matchOdds.marketId,
                _marketName: matchOdds.marketName || 'Match Odds',
                _eventTitle:
                  matchOdds.eventName ||
                  matchOdds.eventTitle ||
                  matchOdds.event?.name ||
                  '',
              }
              const isSuspended =
                marketSetting.isSuspended ||
                matchOdds.status === 'SUSPENDED' ||
                runner.status === 'SUSPENDED'

              const bgLine = (price) =>
                isSuspended ||
                !price ||
                (marketSetting.pbuLimit &&
                  totalMatched < marketSetting.pbuLimit) ||
                price > PRICE_LIMIT

              const backCells = isMobile
                ? [back[0]]
                : [back[2], back[1], back[0]]
              const layCells = isMobile ? [lay[0]] : [lay[0], lay[1], lay[2]]
              const backClasses = isMobile
                ? [BLUE_XS]
                : [BLUE_XXS, BLUE_MD, BLUE_XS]
              const layClasses = isMobile ? [RED_XS] : [RED_XS, RED_MD, RED_XXS]

              const isFirstRow = rowIdx === 0

              return (
                <Fragment key={runner.selectionId}>
                  <tr className="hover:[&>td:first-child:not(.price)]:bg-[var(--mds-light-bg)]">
                    <td
                      className={cx(
                        RUNNER_FIRST_CELL,
                        'h-[40px] max-md:h-[11.51vw]'
                      )}
                    >
                      <div className="flex flex-col">
                        <p className="mb-1 font-bold overflow-hidden text-ellipsis [-webkit-line-clamp:2] [-webkit-box-orient:vertical] [display:-webkit-box] min-w-[150px]">
                          <i className="inline-block align-bottom w-[15px] h-[15px] mr-[5px] bg-no-repeat [background-image:url('/img/main-s1aea395e8c.png')] [background-position:-398px_-1968px]" />
                          {runner.runnerName || runner.runner}
                        </p>
                        <div className="flex items-center">
                          {/* bet-exposure slot (Angular: <app-bet-exposure />) */}
                        </div>
                      </div>
                    </td>
                    {/* BACK columns — Angular: @for back of matchOdd.back; classes blue-xxs/blue-md/blue-xs */}
                    {backCells.map((cell, idx) => {
                      const price = cell?.price
                      const tone = backClasses[idx]
                      const isBestBack =
                        (isMobile && idx === 0) || (!isMobile && idx === 2)
                      // Active highlight follows Angular: only the best-back cell (blue-xs)
                      // shows the active state when this runner has an active BACK bet.
                      const isActive =
                        isBestBack &&
                        active?.selectionId === runner.selectionId &&
                        active?.betType === 'BACK'
                      // First-row best back cell shows the "Back All" pseudo-header (desktop only).
                      const showBackAllHeader =
                        isFirstRow && isBestBack && !isMobile
                      return (
                        <td
                          key={`b-${idx}`}
                          className={cx(
                            PRICE_CELL_BASE,
                            tone,
                            cell?.isChanged && BACK_SPARK,
                            bgLine(price) && BG_LINE,
                            isActive && BLUE_XS_ACTIVE,
                            showBackAllHeader &&
                              "relative before:content-['Back_All'] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:w-full before:h-[22px] before:leading-[23px] before:font-semibold before:bg-no-repeat before:[background-image:url('/img/main-s1aea395e8c.png')] before:[background-position:-274px_-317px] before:text-[var(--xs-black)] before:border-b before:border-white"
                          )}
                          onClick={() =>
                            !bgLine(price) && onPick(runnerExt, cell, 'BACK')
                          }
                        >
                          <p className="m-0">{fmtPrice(price)}</p>
                          <span>{fmtPrice(cell?.size)}</span>
                        </td>
                      )
                    })}
                    {/* LAY columns — Angular: @for lay of matchOdd.lay; classes red-xs/red-md/red-xxs */}
                    {layCells.map((cell, idx) => {
                      const price = cell?.price
                      const tone = layClasses[idx]
                      const isBestLay = idx === 0
                      const isActive =
                        isBestLay &&
                        active?.selectionId === runner.selectionId &&
                        active?.betType === 'LAY'
                      const showLayAllHeader =
                        isFirstRow && isBestLay && !isMobile
                      // last cell on the lay side gets a white border-left (mirrors :last-child rule)
                      const isLastLay = idx === layCells.length - 1
                      return (
                        <td
                          key={`l-${idx}`}
                          className={cx(
                            PRICE_CELL_BASE,
                            tone,
                            isLastLay && 'border-l border-white',
                            cell?.isChanged && LAY_SPARK,
                            bgLine(price) && BG_LINE,
                            isActive && RED_XS_ACTIVE,
                            showLayAllHeader &&
                              "relative before:content-['Lay_All'] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:w-full before:h-[22px] before:leading-[23px] before:font-semibold before:bg-no-repeat before:[background-image:url('/img/main-s1aea395e8c.png')] before:[background-position:100%_-399px] before:text-[var(--xs-black)] before:border-b before:border-white"
                          )}
                          onClick={() =>
                            !bgLine(price) && onPick(runnerExt, cell, 'LAY')
                          }
                        >
                          <p className="m-0">{fmtPrice(price)}</p>
                          <span>{fmtPrice(cell?.size)}</span>
                        </td>
                      )
                    })}
                  </tr>
                  {/* Mobile: inline bet slip below the active runner — Angular parity.
                      Desktop: bet slip lives in the right-side <BetSlip /> panel via Redux. */}
                  {isMobile && active?.selectionId === runner.selectionId && (
                    <tr>
                      <td colSpan={3} className="p-0">
                        <InlineBetSlip
                          betSlipDetails={{
                            ...active,
                            type: active.betType,
                            runnerId: active.selectionId,
                            runnerName: active.selectionName,
                            odds: active.odd,
                            min: 1,
                            max: 100,
                            stake: 0,
                          }}
                          onChange={() => {}}
                          onCancel={onCancelMatchOdds}
                          onPlaceBet={(slip) =>
                            onPlaceBet?.(slip, onCancelMatchOdds)
                          }
                          isPlacing={isPlacingActive}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BookmakerSection({
  runners,
  setting,
  isMobile,
  infoOpen,
  onToggleInfo,
  active,
  onActiveChange,
  onPick,
  onPlaceBet,
  isPlacingActive,
}) {
  const { t } = useTranslation()
  // Normalise the React API's flat shape ({sid, nat, s, b1..b3, l1..l3, bs1..bs3, ls1..ls3})
  // into the Angular shape ({selectionId, runnerName, status, back:[…], lay:[…]}) so the
  // JSX below mirrors the Angular template element-for-element.
  const normalized = useMemo(
    () =>
      runners.map((bm) => ({
        selectionId: bm.sid ?? bm.selectionId,
        runnerName: bm.nat ?? bm.runnerName,
        status: bm.s ?? bm.status ?? 'ACTIVE',
        // back[0] = worst (blue-xxs), back[2] = best (blue-xs, closest to lay)
        back: [
          { price: num(bm.b3), size: num(bm.bs3) },
          { price: num(bm.b2), size: num(bm.bs2) },
          { price: num(bm.b1), size: num(bm.bs1) },
        ],
        // lay[0] = best (red-xs, closest to back), lay[2] = worst (red-xxs)
        lay: [
          { price: num(bm.l1), size: num(bm.ls1) },
          { price: num(bm.l2), size: num(bm.ls2) },
          { price: num(bm.l3), size: num(bm.ls3) },
        ],
        min: bm.min,
        max: bm.max,
        mid: bm.mid,
      })),
    [runners]
  )

  const backCellCls = (i, isActiveAny) =>
    cx(
      PRICE_CELL_BASE,
      // status-table cells have their own size + transparent bg
      'h-[42px] !w-[16.66667%] !border-l-0 text-center bg-transparent z-[9] !border-t-0 max-md:!min-w-[18.66667vw] max-md:!h-[11.51vw]',
      i === 2 && BLUE_XS,
      i === 1 && BLUE_MD,
      i === 0 && BLUE_XXS,
      isActiveAny && active?.betType === 'BACK' && i === 2 && BLUE_XS_ACTIVE
    )

  const layCellCls = (i, isActiveAny) =>
    cx(
      PRICE_CELL_BASE,
      'h-[42px] !w-[16.66667%] !border-l-0 text-center bg-transparent z-[9] !border-t-0 max-md:!min-w-[18.66667vw] max-md:!h-[11.51vw]',
      i === 0 && RED_XS,
      i === 1 && RED_MD,
      i === 2 && RED_XXS,
      isActiveAny && active?.betType === 'LAY' && i === 0 && RED_XS_ACTIVE
    )

  return (
    <div>
      <MatchHeader>
        <div className="flex items-center justify-center [&_.icon-wrapper]:flex [&_.icon-wrapper]:items-center [&_.icon-wrapper]:justify-center [&_.icon-wrapper]:max-md:pl-[1.86667vw] mobile:[&_.icon-wrapper_i]:bg-no-repeat mobile:[&_.icon-wrapper_i]:[background-image:url('/img/main-s1aea395e8c.png')] mobile:[&_.icon-wrapper_i]:[background-position:-385px_-833px] mobile:[&_.icon-wrapper_i]:h-[28px] mobile:[&_.icon-wrapper_i]:w-[29px] mobile:[&_.icon-wrapper_i]:mr-[6px] mobile:[&_.icon-wrapper_svg]:hidden max-md:[&_.icon-wrapper_svg]:block max-md:[&_.icon-wrapper_svg]:w-[6.66667vw] max-md:[&_.icon-wrapper_svg]:h-[6.66667vw]">
          <span className="icon-wrapper">
            <i>
              <PinSvg />
            </i>
          </span>
          <span className="text-white font-bold text-[14px] inline-block max-md:ml-[1.86667vw] max-md:text-[3.46667vw] max-md:leading-[8.53333vw]">
            {t('odds.bookmakerMarket', 'Bookmaker Market')}
            <small className="opacity-70 font-normal">
              | {t('odds.zeroCommission', 'Zero Commission')}
            </small>
          </span>
        </div>

        {!isMobile ? (
          <div className="flex items-center justify-center mr-[10px] [&_span]:text-[11px]">
            <span className="rounded-sm px-[16px] py-[1px] bg-[var(--xl-light-bg)] text-[11px]">
              {t('common.min', 'Min')}
            </span>
            <span className="inline-block ml-1 text-white">
              {fmt(setting.min || 1)}
            </span>
            <span className="rounded-sm px-[16px] py-[1px] bg-[var(--xl-light-bg)] text-[11px] ml-2 inline-block">
              {t('common.max', 'Max')}
            </span>
            <span className="inline-block ml-1 text-white">
              {fmt(setting.max || 10000)}
            </span>
          </div>
        ) : (
          <span className="bg-gradient-to-br from-[var(--xts-lightest-navy)] to-[var(--mds-lightest-navy)] inline-block rounded-tr-[12px] relative mobile:px-2 mr-[1.86667vw] text-white [&_svg]:max-md:w-[4vw] [&_svg]:max-md:h-[4vw]">
            <i
              onClick={onToggleInfo}
              role="button"
              aria-label={t('common.info', 'Info')}
            >
              <WarningSvg />
            </i>
            {infoOpen && (
              <div className={FANCY_INFO_POPUP}>
                <div className="flex-1 flex flex-col">
                  <p>
                    {t('common.min', 'Min')} / {t('common.max', 'Max')}
                  </p>
                  <span>
                    {fmt(setting.min || 1)} / {fmt(setting.max || 1000)}
                  </span>
                </div>
                <i
                  className={FANCY_INFO_CLOSE_ICON}
                  onClick={onToggleInfo}
                  role="button"
                  aria-label={t('common.close', 'Close')}
                >
                  <CloseIcon />
                </i>
              </div>
            )}
          </span>
        )}
      </MatchHeader>

      <div className="mb-4">
        <table className="w-full border-collapse bg-[var(--light-xs-yellow)] max-md:bg-[var(--light-xts-yellow)]">
          <thead className="bg-[var(--light-xs-yellow)] max-md:bg-[var(--light-xts-yellow)]">
            <tr>
              <th className="h-[22px] p-[5px] max-md:h-[8vw]" />
              <th
                colSpan={isMobile ? 1 : 2}
                className="h-[22px] p-[5px] max-md:h-[8vw] w-[64px]"
              />
              {!isMobile && (
                <>
                  <th className="h-[22px] p-[5px] max-md:h-[8vw]" />
                  <th className="h-[22px] p-[5px] max-md:h-[8vw] w-[64px]" />
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {normalized.map((bookmaker, rowIdx) => {
              const isStatusBlocked = isBookmakerStatusBlocked(bookmaker.status)
              const isSuspended = setting.isSuspended || isStatusBlocked
              const isInlineBookmaker =
                active?.selectionId === bookmaker.selectionId && !isSuspended
              const statusLabel = titleCase(
                setting.isSuspended ? 'Suspended' : bookmaker.status || ''
              )
              const isFirstRow = rowIdx === 0

              return (
                <Fragment key={bookmaker.selectionId}>
                  <tr className="bg-[var(--light-xs-yellow)] max-md:bg-[var(--light-xts-yellow)] hover:[&_td]:bg-white/40 hover:[&_td:first-child]:bg-white/40">
                    <td className="px-[10px] pt-[4px] !align-top bg-[var(--light-xs-yellow)] max-md:bg-[var(--light-xts-yellow)] max-md:px-[1.8666666667vw] max-md:py-0 max-md:!align-middle">
                      <div className="flex flex-col">
                        <span className="font-bold">
                          {bookmaker.runnerName}
                        </span>
                        <div className="flex items-center">
                          {/* bet-exposure slot (Angular: <app-bet-exposure />) */}
                        </div>
                      </div>
                    </td>
                    <td
                      colSpan={isMobile ? 1 : 5}
                      className="p-0 w-full max-md:w-[140px]"
                    >
                      <table
                        align="right"
                        className="border-collapse relative mobile:w-full mobile:max-w-[76%] before:content-[''] before:bg-gradient-to-r before:from-[rgba(130,183,221,0.15)] before:to-[rgba(130,183,221,0.8)] before:absolute before:left-0 before:right-0 before:top-0 before:bottom-0 before:w-1/2 before:z-0 after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-1/2 after:bg-gradient-to-l after:from-[rgba(231,170,184,0.8)] after:to-[rgba(231,170,184,0.15)] after:z-0 after:top-0"
                      >
                        <tbody>
                          <tr>
                            {/* BACK — iterates bookmaker.back; mobile shows only $index === 2 */}
                            {bookmaker.back.map((backCell, i) => {
                              if (isMobile && i !== 2) return null
                              const isBestBack = i === 2
                              const showBackHeader = isFirstRow && isBestBack
                              return (
                                <td
                                  key={`back-${i}`}
                                  className={cx(
                                    backCellCls(i, isInlineBookmaker),
                                    showBackHeader &&
                                      "relative max-md:bg-gradient-to-r max-md:from-[rgba(151,199,234,0.7)] max-md:to-[var(--xs-lightest-navy)] before:absolute before:left-0 before:right-0 before:text-center before:content-['Back'] before:bottom-full before:px-[6px] before:py-[5px] before:text-[12px] before:text-[var(--xs-black)] before:font-bold max-md:before:text-[3.46667vw]",
                                    // chip styling: rounded outer cell — handled by ::after layer
                                    "after:content-[''] after:absolute after:inset-[2px] after:rounded-[4px] after:border after:border-white after:bg-[var(--xs-blue)] after:-z-[1] max-md:after:inset-[1vw]",
                                    isInlineBookmaker &&
                                      active?.betType === 'BACK' &&
                                      isBestBack &&
                                      '!bg-[var(--xs-blue)] !shadow-none'
                                  )}
                                  onClick={() =>
                                    backCell?.price &&
                                    !isSuspended &&
                                    onPick(bookmaker, bookmaker.back[2], 'BACK')
                                  }
                                >
                                  <p className="m-0">{backCell.price || ''}</p>
                                </td>
                              )
                            })}
                            {/* LAY — iterates bookmaker.lay; mobile shows only $index === 0 */}
                            {bookmaker.lay.map((layCell, i) => {
                              if (isMobile && i !== 0) return null
                              const isBestLay = i === 0
                              const showLayHeader = isFirstRow && isBestLay
                              return (
                                <td
                                  key={`lay-${i}`}
                                  className={cx(
                                    layCellCls(i, isInlineBookmaker),
                                    showLayHeader &&
                                      "relative !bg-transparent max-md:bg-gradient-to-l max-md:from-[var(--xts-red)] max-md:to-[rgba(247,205,214,0.75)] before:absolute before:left-0 before:right-0 before:text-center before:content-['Lay'] before:bottom-full before:px-[6px] before:py-[5px] before:text-[12px] before:text-[var(--xs-black)] before:font-bold max-md:before:text-[3.46667vw]",
                                    "after:content-[''] after:absolute after:inset-[2px] after:rounded-[4px] after:border after:border-white after:bg-[var(--xs-red)] after:-z-[1] max-md:after:inset-[5px]",
                                    isInlineBookmaker &&
                                      active?.betType === 'LAY' &&
                                      isBestLay &&
                                      '!bg-[var(--xs-red)] !shadow-none'
                                  )}
                                  onClick={() =>
                                    layCell?.price &&
                                    !isSuspended &&
                                    onPick(bookmaker, bookmaker.lay[0], 'LAY')
                                  }
                                >
                                  <p className="m-0">{layCell.price || ''}</p>
                                </td>
                              )
                            })}
                          </tr>
                          {isSuspended && (
                            <tr>
                              <td colSpan={6}>
                                <div className={GAME_STATUS_OVERLAY}>
                                  {statusLabel}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  {/* INLINE BET SLIP — separate <tr> below the runner row, matches Angular */}
                  {isInlineBookmaker && (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <InlineBetSlip
                          betSlipDetails={active}
                          onChange={onActiveChange}
                          onCancel={() => onActiveChange(null)}
                          onPlaceBet={(slip) =>
                            onPlaceBet?.(slip, () => onActiveChange(null))
                          }
                          isPlacing={isPlacingActive}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Tiny shared header bar (used by Bookmaker + Fancy "match-header")
function MatchHeader({ children }) {
  return (
    <div className="flex items-center justify-between bg-[var(--light-navy)] max-md:bg-[var(--text-color)]">
      {children}
    </div>
  )
}

function FancyTabHeader({ tabs, selectedFancy, onSelect, isMobile }) {
  const { t } = useTranslation()
  const isSportsBookSelected = selectedFancy === MAIN_FANCY.SPORTS_BOOK

  return (
    <div
      className={cx(
        'flex items-center border-b-2 border-[var(--sky-blue-light)] max-md:border-b-[1.06667vw] max-md:border-b-[var(--smd-text-color)]',
        isSportsBookSelected && '!border-b-[var(--orange)]'
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.type === selectedFancy
        const isPremium =
          isSportsBookSelected && tab.type === MAIN_FANCY.SPORTS_BOOK

        // Base chip wrapper
        const chipBase =
          'inline-flex items-center cursor-pointer relative ml-4 max-md:ml-[4.786vw]'
        const chipActive = isActive ? 'ml-0' : ''
        // Hide the pin for the second chip (sports-book), as per :nth-child(2) rule
        // We approximate by checking the tab type instead of index.
        const hidePin = tab.type === MAIN_FANCY.SPORTS_BOOK

        // Inner-bg base
        let innerBg =
          'flex items-center px-[10px] py-[7px] h-[30px] bg-[var(--light-navy)] text-white relative font-bold max-md:px-[1.66667vw] max-md:py-[1.3vw] max-md:h-[7.55vw]'
        // Skew tails before/after — only when NOT active
        if (!isActive) {
          innerBg +=
            " before:content-[''] before:absolute before:top-0 before:bottom-0 before:left-[-6px] before:w-[10px] before:rounded-tl-[4px] before:[transform:skew(-14deg,0deg)] before:bg-[var(--light-navy)] before:z-[1] max-md:before:left-[-1.582vw] max-md:before:w-[3.304vw] max-md:before:rounded-tl-[0.522vw] max-md:before:h-[8.55vw]" +
            " after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-[-6px] after:w-[10px] after:rounded-tr-[4px] after:[transform:skew(14deg,0deg)] after:bg-[var(--light-navy)] after:z-[1] max-md:after:right-[-1.782vw] max-md:after:w-[3.304vw] max-md:after:rounded-tr-[0.522vw] max-md:after:h-[8.55vw]"
        } else {
          innerBg = innerBg.replace(
            'bg-[var(--light-navy)]',
            isPremium
              ? '!bg-[var(--orange)]'
              : 'bg-gradient-to-b from-[var(--md-lightest-navy)] to-[var(--smd-text-color)]'
          )
        }

        return (
          <div
            key={tab.type}
            className={cx(chipBase, chipActive)}
            onClick={() => onSelect(tab.type)}
            role="button"
          >
            {tab.type === MAIN_FANCY.SPORTS_BOOK && !isActive && (
              <p className="absolute overflow-visible top-[-5px] right-[-15px] h-[14px] z-[99] [filter:drop-shadow(1px_1px_2px_rgba(0,0,0,0.6))] mb-0 max-md:top-[-3.5667vw] max-md:right-[-5vw] before:content-[''] before:absolute before:bottom-[-8px] before:left-[15px] before:w-0 before:h-0 before:border-solid before:border-t-[8px] before:border-r-[7px] before:border-b-0 before:border-l-0 before:border-t-[var(--xsm-red)] before:border-r-transparent max-md:before:border-t-[1.8vw] max-md:before:border-r-[1.8vw] max-md:before:left-[3.5vw] max-md:before:bottom-[-1.3vw]">
                <span className="rounded-[15px] px-2 py-[3px] text-white text-[10px] bg-[var(--xsm-red)] max-md:px-[1.7vw] max-md:py-[0.2vw] max-md:rounded-[0.8vw]">
                  New
                </span>
              </p>
            )}
            <div className={cx(innerBg)}>
              {isMobile && tab.type !== MAIN_FANCY.SPORTS_BOOK && !hidePin && (
                <i className="relative z-[2] mr-[4vw] before:content-[''] before:absolute before:left-[-4vw] before:right-0 before:top-[0.2vw] before:bottom-[0.3vw] before:bg-[var(--xsm-blue)] before:w-[10.5vw] before:[transform:skewX(15deg)] before:-z-[1] [&_svg]:w-[5vw] [&_svg]:h-[8vw]">
                  <PinSvg />
                </i>
              )}
              <i className="bg-gradient-to-t from-[var(--xs-green-primary)] via-[var(--xs-green-primary)] to-[var(--xs-shadow-primary)] rounded-[3px] max-md:w-[4vw] max-md:h-[4vw] max-md:text-center [&_svg]:max-md:w-[3.8vw] [&_svg]:max-md:h-[3.8vw] [&_svg]:max-md:leading-[3.8vw]">
                <TimeSvg />
              </i>
              <span
                className={cx(
                  'inline-block align-middle text-[12px] text-[var(--xts-gray)] max-md:text-[3.73333vw]',
                  isActive && 'ml-2 !text-white'
                )}
              >
                {tab.title}
              </span>
            </div>
            {isActive && (
              <i className="inline-flex text-center relative text-white z-[2] px-1 w-[16px] h-[16px] max-md:w-[4vw] max-md:h-[4.45vw] after:content-[''] after:bg-no-repeat after:absolute after:z-[1] after:bg-center after:left-0 after:top-0 after:bg-contain after:w-[16px] after:h-[16px] after:[background-image:url('/img/svg/info.svg')] max-md:after:w-[5vw] max-md:after:h-[4vw] max-md:after:[background-image:url('/img/svg/questionMarkRounded.svg')] before:content-[''] before:absolute before:rounded-tr-[4px] before:[transform:skew(14deg,0deg)] before:-z-[1] before:left-[-5px] before:w-[28px] before:top-[-7px] before:bottom-[-7px] max-md:before:top-[-1.6vw] max-md:before:bottom-0 max-md:before:w-[7vw] max-md:before:h-[7.6vw] max-md:before:left-[-1vw]" />
            )}
          </div>
        )
      })}
      {isSportsBookSelected && (
        <p className="text-black mb-0 inline-flex items-center bg-[var(--xl-light-bg)] !text-[var(--light-navy)] ml-auto px-2 py-px rounded-[3px] mr-[5px] text-[11px] leading-4 max-md:h-[6.4vw] max-md:px-[1.6vw] max-md:mr-[1.86667vw] max-md:-mt-[0.9vw] max-md:text-[3.46667vw] max-md:leading-[6.4vw] max-md:rounded-[1.06667vw] [&_i]:inline-flex [&_i]:mr-1 [&_svg]:w-[11px] [&_svg]:h-[11px] [&_svg_path]:fill-black max-md:[&_i]:mr-[1vw] max-md:[&_i]:text-[var(--light-navy)] max-md:[&_svg]:w-[3.4666666667vw] max-md:[&_svg]:h-[3.4666666667vw]">
          <i>
            <WarningSvg />
          </i>
          <span>{t('common.min', 'Min')}</span>
        </p>
      )}
    </div>
  )
}

// Shared tabs (Fancy / Sportbook priority strip)
function PriorityTabs({ tabs, selectedType, onSelectType, variant = 'fancy' }) {
  const isSportBook = variant === 'sport-book'

  const containerCls = cx(
    'overflow-x-auto whitespace-nowrap cursor-pointer [&::-webkit-scrollbar]:hidden'
  )

  const wrapperCls = cx(
    'flex justify-center items-center shadow-[inset_0_1px_0_0_rgba(var(--black-rgb),0.2)] bg-gradient-to-b from-[var(--md-lightest-navy)] from-[15%] to-[var(--lg-lightest-navy)] max-md:!shadow-none max-md:bg-none max-md:bg-[var(--smd-text-color)] max-md:justify-start max-md:pl-[1.6vw]',
    isSportBook &&
      '!bg-gradient-to-b !from-[var(--xs-orange)] !from-[15%] !to-[var(--md-orange)] pb-[3px] max-md:!bg-[var(--orange)]'
  )

  const ulCls =
    'flex pl-0 mb-0 w-auto bg-white/50 rounded-[5px] my-[1px_3px_0] justify-center items-center max-md:bg-transparent'

  return (
    <div className={containerCls}>
      <div className={wrapperCls}>
        <ul className={ulCls}>
          {tabs.map((tab) => {
            const isActive = selectedType === tab.type
            const liBase =
              'min-w-[70px] h-[18px] leading-[18px] font-bold rounded-[4px] px-[5px] text-center max-md:h-[5.9333333333vw] max-md:min-w-0 max-md:px-[2.6666666667vw] max-md:leading-[6vw] max-md:rounded-none max-md:border-r max-md:border-r-white/40 hover:[&_a]:underline'
            const liActive = isActive
              ? cx(
                  'bg-white hover:[&_a]:!no-underline max-md:rounded-[1.0666666667vw]',
                  isSportBook &&
                    'max-md:!bg-[var(--orange)] max-md:!rounded-none'
                )
              : ''
            const aCls = cx(
              'no-underline text-[var(--lg-lightest-navy)] max-md:text-white',
              isSportBook &&
                'text-[rgba(var(--orange-rgba),0.85)] max-md:text-white',
              isActive && 'max-md:!text-[var(--lg-lightest-navy)]'
            )

            return (
              <li
                key={tab.type}
                className={cx(liBase, liActive)}
                onClick={() => onSelectType(tab.type)}
              >
                <a className={aCls}>{tab.label}</a>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function FancySection({
  items,
  buckets,
  selectedType,
  onSelectType,
  isMobile,
  fancyInfoIndex,
  setFancyInfoIndex,
  active,
  onActiveChange,
  onPick,
  onPlaceBet,
  isPlacingActive,
}) {
  const { t } = useTranslation()
  if (!items.length) {
    return (
      <div className="text-center p-3 text-[var(--sm-text-color)] text-[12px] bg-white">
        {t('common.noFancyMarkets', 'No fancy markets')}
      </div>
    )
  }

  const availableTabs = FANCY_TYPE_TABS.filter(
    (t) =>
      t.type === FANCY_TYPES.ALL ||
      (buckets[t.type] && buckets[t.type].length > 0)
  )

  return (
    <>
      <PriorityTabs
        tabs={availableTabs}
        selectedType={selectedType}
        onSelectType={onSelectType}
        variant="fancy"
      />

      {!isMobile && (
        <MatchHeader>
          <div className="flex items-center justify-center pr-3 [&_.icon-wrapper]:flex [&_.icon-wrapper]:items-center [&_.icon-wrapper]:justify-center mobile:[&_.icon-wrapper_i]:bg-no-repeat mobile:[&_.icon-wrapper_i]:[background-image:url('/img/main-s1aea395e8c.png')] mobile:[&_.icon-wrapper_i]:[background-position:-385px_-833px] mobile:[&_.icon-wrapper_i]:h-[28px] mobile:[&_.icon-wrapper_i]:w-[29px] mobile:[&_.icon-wrapper_i]:mr-[6px] mobile:[&_.icon-wrapper_svg]:hidden">
            <span className="icon-wrapper">
              <i>
                <PinSvg />
              </i>
            </span>
            <span className="text-white font-bold text-[14px] inline-block ml-2">
              Fancy Bet
            </span>
          </div>
        </MatchHeader>
      )}

      <div className="overflow-auto">
        <table className="w-full border-collapse max-md:bg-white">
          <thead className="bg-white">
            <tr>
              <th className="px-[10px] py-1 font-bold text-[12px] max-md:text-[var(--lg-white,#fff)] max-md:text-[3.46667vw] max-md:h-[4.954vw] max-md:p-[1.33333vw_1.86667vw]" />
              <th className="px-[10px] py-1 font-bold text-[12px] max-md:text-[var(--lg-white,#fff)] max-md:text-[3.46667vw] max-md:h-[4.954vw] max-md:p-[1.33333vw_1.86667vw]">
                No
              </th>
              <th className="px-[10px] py-1 font-bold text-[12px] max-md:text-[var(--lg-white,#fff)] max-md:text-[3.46667vw] max-md:h-[4.954vw] max-md:p-[1.33333vw_1.86667vw]">
                Yes
              </th>
              {!isMobile && (
                <>
                  <th className="px-[10px] py-1 font-bold text-[12px]" />
                  <th className="px-[10px] py-1 font-bold text-[12px] max-[1199px]:hidden" />
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const isInline =
                active &&
                active.selectionId === item.SelectionId &&
                item.GameStatus !== 'SUSPENDED'
              const isSuspended = item.GameStatus === 'SUSPENDED'

              return (
                <Fragment key={`${item.SelectionId}-${i}`}>
                  {isMobile && (
                    <tr className="bg-[var(--xsl-blue-bg)] max-md:even:[&_td]:border-t-0">
                      <td
                        colSpan={3}
                        className="p-[7px_0_7px_8px] border-b-0 h-[38px] max-md:!p-[1.33333vw_1.86667vw] max-md:h-[8.954vw] [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:text-[var(--sm-light-bg)] max-md:[&_svg]:w-[4vw] max-md:[&_svg]:h-[4vw]"
                      >
                        <div className="flex justify-between items-center">
                          <span className="block w-full max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap font-bold max-md:!text-[3.4666666667vw]">
                            {item.RunnerName}
                          </span>
                          <span className="relative mr-[1.86667vw] text-white [&_svg]:max-md:w-[4vw] [&_svg]:max-md:h-[4vw]">
                            <i
                              onClick={() =>
                                setFancyInfoIndex(fancyInfoIndex === i ? -1 : i)
                              }
                              role="button"
                              aria-label={t('common.info', 'Info')}
                            >
                              <WarningSvg />
                            </i>
                            {fancyInfoIndex === i && (
                              <div className={FANCY_INFO_POPUP}>
                                <div className="flex-1 flex flex-col">
                                  <p>
                                    {t('common.min', 'Min')} /{' '}
                                    {t('common.max', 'Max')}
                                  </p>
                                  <span>
                                    {fmt(item.min || 1)} /{' '}
                                    {fmt(item.max || 1000)}
                                  </span>
                                </div>
                                <i
                                  className={FANCY_INFO_CLOSE_ICON}
                                  onClick={() => setFancyInfoIndex(-1)}
                                  role="button"
                                  aria-label={t('common.close', 'Close')}
                                >
                                  <CloseIcon />
                                </i>
                              </div>
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr className="hover:bg-[var(--hover-bg)] hover:[&>td]:bg-[var(--hover-bg)] hover:[&>td:last-child]:border-l-[var(--hover-bg)]">
                    <td className="px-[10px] py-[5px] relative min-w-[100px] max-md:min-w-[70px]">
                      {!isMobile && (
                        <div>
                          <span className="block w-full max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap font-bold min-w-[50px]">
                            {item.RunnerName}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        {/* bet-exposure slot (Angular: <app-bet-exposure />) */}
                      </div>
                    </td>
                    <td colSpan={2} className="p-0 relative">
                      {item.GameStatus && (
                        <div className="absolute inset-0 bg-[rgba(36,58,72,0.4)] z-[9] flex items-center justify-center text-white/80 font-bold [text-shadow:0_1px_4px_rgba(0,0,0,0.5)] text-[13px] cursor-default max-md:text-[3.46667vw]">
                          {item.GameStatus === 'SUSPENDED'
                            ? 'Suspended'
                            : item.GameStatus}
                        </div>
                      )}
                      <table className="w-full border-collapse">
                        <tbody>
                          <tr>
                            <td
                              className={cx(
                                PRICE_CELL_BASE,
                                RED_XS,
                                'h-[42px] !w-[100px] !min-w-[53px] !px-[5px] max-md:!h-[11.51vw]',
                                isInline &&
                                  active?.betType === 'NO' &&
                                  RED_XS_ACTIVE
                              )}
                              onClick={() => onPick(item, 'NO')}
                            >
                              <p className="m-0">{item.LayPrice1 || ''}</p>
                              <small className="text-[12px] leading-none max-md:text-[2.93333vw]">
                                {!isSuspended && item.LaySize1
                                  ? item.LaySize1
                                  : ''}
                              </small>
                            </td>
                            <td
                              className={cx(
                                PRICE_CELL_BASE,
                                BLUE_XS,
                                'h-[42px] !w-[100px] !min-w-[53px] !px-[5px] max-md:!h-[11.51vw]',
                                isInline &&
                                  active?.betType === 'YES' &&
                                  BLUE_XS_ACTIVE
                              )}
                              onClick={() => onPick(item, 'YES')}
                            >
                              <p className="m-0">{item.BackPrice1 || ''}</p>
                              <small className="text-[12px] leading-none max-md:text-[2.93333vw]">
                                {!isSuspended && item.BackSize1
                                  ? item.BackSize1
                                  : ''}
                              </small>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    {!isMobile && (
                      <>
                        <td className="px-[10px] py-[5px] relative border-l border-white">
                          <p className="mb-0 text-[var(--sm-text-color)] min-h-[32px] text-left text-[11px]">
                            Min/Max
                            <span className="block whitespace-nowrap !text-[12px] text-[var(--dark)]">
                              {fmt(item.min || 1)} / {fmt(item.max || 1000)}
                            </span>
                          </p>
                        </td>
                        <td className="max-[1199px]:hidden" />
                      </>
                    )}
                  </tr>
                  {isInline && (
                    <tr>
                      <td colSpan={isMobile ? 3 : 5} className="p-0">
                        <InlineBetSlip
                          betSlipDetails={active}
                          onChange={onActiveChange}
                          onCancel={() => onActiveChange(null)}
                          onPlaceBet={(slip) =>
                            onPlaceBet?.(slip, () => onActiveChange(null))
                          }
                          isPlacing={isPlacingActive}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

function SportbookSection({
  markets,
  selectedCategory,
  onSelectCategory,
  active,
  onActiveChange,
  onPick,
  onPlaceBet,
  isPlacingActive,
}) {
  const [collapsed, setCollapsed] = useState({})
  const toggle = (id) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))

  if (!markets.length) {
    return (
      <div className="text-center p-3 text-[var(--sm-text-color)] text-[12px] bg-white">
        No sportsbook markets
      </div>
    )
  }

  return (
    <>
      <PriorityTabs
        tabs={SPORTSBOOK_TABS}
        selectedType={selectedCategory}
        onSelectType={onSelectCategory}
        variant="sport-book"
      />

      <div>
        {markets.map((market, i) => {
          if (!market.runners?.length) return null
          const id = market.marketId || `mkt-${i}`
          const isCollapsed =
            collapsed[id] === undefined ? i > 5 : collapsed[id]
          return (
            <div key={id} className="mobile:mb-1 mb-0">
              <h2>
                <button
                  type="button"
                  className="pl-0 flex items-center w-full text-left max-md:bg-[var(--text-color)] max-md:px-0 max-md:pl-[1.8666666667vw] max-md:leading-[8.6vw] max-md:border-b max-md:border-b-[var(--sm-text-color)] max-md:text-white"
                  onClick={() => toggle(id)}
                >
                  <i className="mobile:mr-1 inline-flex items-center justify-center bg-gradient-to-b from-[var(--xl-blue)] to-[var(--xs-black)] h-[25px] w-[25px] text-center leading-[22px] text-[var(--sm-white)] hover:bg-gradient-to-b hover:from-[var(--xs-black)] hover:to-[var(--xl-blue)] hover:text-[var(--xs-shadow-primary)] [&_svg]:h-[16px] [&_svg]:w-[18px] max-md:rounded-full max-md:h-[6.6666666667vw] max-md:w-[6.6666666667vw] max-md:leading-normal max-md:bg-[var(--xs-dark)] max-md:mr-[1.4vw] max-md:[&_svg]:w-[4.6666666667vw] max-md:[&_svg]:h-[4.6666666667vw]">
                    <PinSvg />
                  </i>
                  <span className="text-[14px] font-bold max-md:text-[3.4666666667vw] max-md:leading-[1.5] max-md:flex-1">
                    {market.market}
                  </span>
                </button>
              </h2>
              {!isCollapsed && (
                <div className="w-full flex flex-col flex-wrap relative">
                  {market.runners.map((runner) => {
                    const isSuspended =
                      market.status === '1' && runner.status !== '1'
                    const isActive =
                      active?.selectionId === runner.selectionId &&
                      runner.status === '1'
                    return (
                      <Fragment key={runner.selectionId}>
                        <div
                          className={cx(
                            'w-full flex items-center min-h-[40px] border-b border-[var(--sm-text-color)] relative hover:bg-[var(--hover-bg)] max-md:min-h-0',
                            isSuspended && 'z-[9]'
                          )}
                          onClick={() => !isSuspended && onPick(market, runner)}
                          role="button"
                        >
                          <p className="m-0 flex-[0_0_60%] w-[60%] py-1 pl-[10px] pr-[5px] max-md:flex-1 max-md:w-auto max-md:font-bold max-md:py-[1.3333333333vw] max-md:px-[1.8666666667vw] max-md:leading-[7vw]">
                            <span className="font-bold">
                              {titleCase(runner.runnerName)}
                            </span>
                            {/* bet-exposure slot */}
                          </p>
                          <div className="flex items-center flex-[0_0_40%] max-md:flex-[0_0_37.3333333333vw]">
                            <span
                              className={cx(
                                'relative cursor-pointer min-h-[39px] w-full block border border-transparent text-center leading-[34px] max-md:min-h-[11vw] max-md:leading-[10vw] [&_b]:max-md:text-[2.9333333333vw] [&_b]:max-md:font-normal',
                                isActive &&
                                  'text-white !bg-[var(--lg-green-bg)] shadow-[inset_0_1px_3px_rgba(var(--black-rgb),0.5)]'
                              )}
                            >
                              {isSuspended && (
                                <div className="absolute inset-[-1px] bg-[rgba(var(--black-rgb),0.435)] [backdrop-filter:blur(2px)] text-white flex items-center justify-center cursor-default">
                                  Suspended
                                </div>
                              )}
                              <b>{runner.back?.[0]?.price || ''}</b>
                            </span>
                            <span className="mobile:inline-block max-md:hidden" />
                          </div>
                        </div>
                        {isActive && (
                          <div className="w-full">
                            <InlineBetSlip
                              betSlipDetails={active}
                              onChange={onActiveChange}
                              onCancel={() => onActiveChange(null)}
                              onPlaceBet={(slip) =>
                                onPlaceBet?.(slip, () => onActiveChange(null))
                              }
                              isPlacing={isPlacingActive}
                            />
                          </div>
                        )}
                      </Fragment>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG icons (inlined, no external sprite dependency)
// ─────────────────────────────────────────────────────────────────────────────

function PinIcon() {
  return (
    <i>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="8"
        height="12"
        viewBox="0 0 8 12"
        aria-hidden="true"
      >
        <path
          d="M6.714 5.25c.857.321 1.286.812 1.286 1.473 0 .232-.036.384-.107.455-.071.071-.214.107-.429.107h-2.893l-.429 4.714h-.286l-.429-4.714h-2.893c-.214 0-.357-.04-.429-.121-.071-.08-.107-.228-.107-.442 0-.661.429-1.152 1.286-1.473l.143-.054c.262-.107.429-.277.5-.509l.643-3.161v-.134c0-.143-.119-.259-.357-.348l-.036-.027h-.036c-.286-.089-.429-.241-.429-.455 0-.25.048-.406.143-.469.095-.063.262-.094.5-.094h3.286c.238 0 .405.031.5.094.095.063.143.219.143.469 0 .214-.143.366-.429.455h-.036l-.036.027c-.238.089-.357.205-.357.348v.134l.643 3.161c.071.232.238.402.5.509l.143.054z"
          fill="currentColor"
        />
      </svg>
    </i>
  )
}

function RefreshIcon() {
  return (
    <i>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        width="14"
        height="14"
        aria-hidden="true"
      >
        <path
          d="M10 4.029c1.635 0 3.144.36 4.527 1.079 1.365.703 2.443 1.655 3.233 2.854.827 1.247 1.24 2.59 1.24 4.028 0 1.44-.413 2.782-1.24 4.03-.79 1.214-1.868 2.173-3.233 2.877A9.596 9.596 0 0 1 10 20a9.596 9.596 0 0 1-4.527-1.103c-1.365-.704-2.443-1.663-3.233-2.878C1.413 14.772 1 13.43 1 11.99h2.263c0 1.088.301 2.09.903 3.01.602.92 1.42 1.647 2.452 2.182 1.033.536 2.16.804 3.382.804s2.349-.268 3.382-.804c1.033-.535 1.85-1.263 2.452-2.182.602-.92.903-1.922.903-3.01 0-1.087-.301-2.09-.903-3.01-.602-.918-1.42-1.646-2.452-2.181-1.033-.536-2.16-.804-3.382-.804v4.029L4.368 5.012 10 0v4.029z"
          fill="currentColor"
        />
      </svg>
    </i>
  )
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      />
    </svg>
  )
}

function FullscreenIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M7 14H5v5h5v-2H7zm-2-4h2V7h3V5H5zm12 7h-3v2h5v-5h-2zM14 5v2h3v3h2V5z"
      />
    </svg>
  )
}

function InfoIcon({ onClick }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="25"
      viewBox="0 0 25 25"
      width="25"
      onClick={onClick}
    >
      <g fill="none" fillRule="evenodd" transform="">
        <circle
          cx="12.5"
          cy="12.5"
          fill="#7e97a7"
          fillRule="evenodd"
          r="12.5"
        ></circle>
        <circle cx="12.5" cy="12.5" r="12" stroke="#7e97a7"></circle>
        <path
          d="m8 14h6v2h-6v3l-4-4 4-4zm9 0v-3h-6v-2h6v-3l4 4z"
          fill="#e0e6e6"
          fillRule="nonzero"
          transform="matrix(0 1 -1 0 25 0)"
        ></path>
      </g>
    </svg>
  )
}

function WarningSvg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 15 15"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M6.76 5.246V3.732h1.48v1.514H6.76zm.74 8.276a5.86 5.86 0 0 0 3.029-.83 5.839 5.839 0 0 0 2.163-2.163 5.86 5.86 0 0 0 .83-3.029 5.86 5.86 0 0 0-.83-3.029 5.839 5.839 0 0 0-2.163-2.163 5.86 5.86 0 0 0-3.029-.83 5.86 5.86 0 0 0-3.029.83A5.839 5.839 0 0 0 2.308 4.47a5.86 5.86 0 0 0-.83 3.029 5.86 5.86 0 0 0 .83 3.029 5.839 5.839 0 0 0 2.163 2.163 5.86 5.86 0 0 0 3.029.83zM7.5 0c1.37 0 2.638.343 3.804 1.028a7.108 7.108 0 0 1 2.668 2.668A7.376 7.376 0 0 1 15 7.5c0 1.37-.343 2.638-1.028 3.804a7.108 7.108 0 0 1-2.668 2.668A7.376 7.376 0 0 1 7.5 15a7.376 7.376 0 0 1-3.804-1.028 7.243 7.243 0 0 1-2.668-2.686A7.343 7.343 0 0 1 0 7.5c0-1.358.343-2.62 1.028-3.786a7.381 7.381 0 0 1 2.686-2.686A7.343 7.343 0 0 1 7.5 0zm-.74 11.268V6.761h1.48v4.507H6.76z"
      ></path>
    </svg>
  )
}

function PinSvg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="8"
      height="12"
      viewBox="0 0 8 12"
    >
      <path
        d="M6.714 5.25c.857.321 1.286.812 1.286 1.473 0 .232-.036.384-.107.455-.071.071-.214.107-.429.107h-2.893l-.429 4.714h-.286l-.429-4.714h-2.893c-.214 0-.357-.04-.429-.121-.071-.08-.107-.228-.107-.442 0-.661.429-1.152 1.286-1.473l.143-.054c.262-.107.429-.277.5-.509l.643-3.161v-.134c0-.143-.119-.259-.357-.348l-.036-.027h-.036c-.286-.089-.429-.241-.429-.455 0-.25.048-.406.143-.469.095-.063.262-.094.5-.094h3.286c.238 0 .405.031.5.094.095.063.143.219.143.469 0 .214-.143.366-.429.455h-.036l-.036.027c-.238.089-.357.205-.357.348v.134l.643 3.161c.071.232.238.402.5.509l.143.054z"
        fill="currentColor"
      ></path>
    </svg>
  )
}

function TimeSvg() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <mask
        id="mask0_195_15463"
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="1"
        y="1"
        width="14"
        height="14"
      >
        <rect
          x="1.33789"
          y="1.33301"
          width="13.3333"
          height="13.3333"
          fill="#D9D9D9"
        ></rect>
      </mask>
      <g mask="url(#mask0_195_15463)">
        <path
          d="M8.00456 13.5553C7.31011 13.5553 6.65965 13.4234 6.05317 13.1595C5.44669 12.8956 4.91891 12.5391 4.46984 12.0901C4.02076 11.641 3.66428 11.1132 3.40039 10.5067C3.1365 9.90025 3.00456 9.24978 3.00456 8.55534C3.00456 7.86089 3.1365 7.21043 3.40039 6.60395C3.66428 5.99747 4.02076 5.46969 4.46984 5.02062C4.91891 4.57154 5.44669 4.21506 6.05317 3.95117C6.65965 3.68728 7.31011 3.55534 8.00456 3.55534C8.699 3.55534 9.34947 3.68728 9.95595 3.95117C10.5624 4.21506 11.0902 4.57154 11.5393 5.02062C11.9884 5.46969 12.3448 5.99747 12.6087 6.60395C12.8726 7.21043 13.0046 7.86089 13.0046 8.55534C13.0046 9.24978 12.8726 9.90025 12.6087 10.5067C12.3448 11.1132 11.9884 11.641 11.5393 12.0901C11.0902 12.5391 10.5624 12.8956 9.95595 13.1595C9.34947 13.4234 8.699 13.5553 8.00456 13.5553ZM9.56011 10.8887L10.3379 10.1109L8.56011 8.33312V5.77756H7.449V8.77756L9.56011 10.8887ZM4.449 2.63867L5.22678 3.41645L2.86567 5.77756L2.08789 4.99978L4.449 2.63867ZM11.5601 2.63867L13.9212 4.99978L13.1434 5.77756L10.7823 3.41645L11.5601 2.63867ZM8.00456 12.4442C9.08789 12.4442 10.0069 12.0669 10.7615 11.3123C11.5161 10.5577 11.8934 9.63867 11.8934 8.55534C11.8934 7.47201 11.5161 6.55302 10.7615 5.79839C10.0069 5.04376 9.08789 4.66645 8.00456 4.66645C6.92122 4.66645 6.00224 5.04376 5.24761 5.79839C4.49298 6.55302 4.11567 7.47201 4.11567 8.55534C4.11567 9.63867 4.49298 10.5577 5.24761 11.3123C6.00224 12.0669 6.92122 12.4442 8.00456 12.4442Z"
          fill="white"
        ></path>
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function applyAdminPatch(current, evt) {
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
