import {
  Fragment,
  memo,
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
  selectIsOneClickBet,
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
  selectOneClickBetStake,
  selectOpenBetRefreshTick,
  selectPlacingSelectionId,
  selectPreExposureMarketName,
  setActiveBetSlip,
  setPreExposure,
} from '../store/slices/betSlipSlice.js'
import InlineBetSlip from '../components/GameDetails/InlineBetSlip.jsx'
import BetExposureCell from '../components/GameDetails/BetExposureCell.jsx'
import BookFancyModal from '../components/GameDetails/BookFancyModal.jsx'
import Modal from '../shared/components/Modal.jsx'
import { alertService } from '../shared/services/alert.js'

const SPARK_TTL_MS = 750
const PIP_SCROLL_THRESHOLD = 300
const SCROLL_CONTAINER_SELECTOR = '.middle-content'

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

const MATCH_ODDS_TABLE =
  'w-full border-separate [border-spacing:1px_0] max-md:bg-white'

const TABLE_TH =
  'text-[var(--dark)] text-center align-bottom text-[11px] font-normal pb-[3px] max-md:px-[1.86667vw] max-md:pt-[1.86667vw] max-md:pb-[0.8vw] max-md:text-[3.46667vw] max-md:font-bold'

const PRICE_CELL_BASE =
  'text-center text-[var(--header-primary)] relative text-[12px] cursor-pointer w-[10.9%] h-[40px] max-md:text-[4vw] max-md:w-[70px] max-md:h-[11.51vw] max-md:px-[1.8666666667vw] py-1 max-md:py-[0.6vw] max-md:min-w-[18.66667vw] hover:opacity-80 [&_p]:font-bold [&_p]:leading-none [&_p]:text-[12px] max-md:[&_p]:text-[3.46667vw] max-md:[&_p]:leading-normal [&_span]:leading-none [&_span]:text-[12px] max-md:[&_span]:text-[2.93333vw]'

const BLUE_XS = 'bg-[var(--back-0)] hover:bg-[var(--back-0-hover)]'
const BLUE_MD = 'bg-[var(--back-1)] hover:bg-[var(--back-1-hover)]'
const BLUE_XXS = 'bg-[var(--back-2)] hover:bg-[var(--back-2-hover)]'

const RED_XS = 'bg-[var(--lay-0)] hover:bg-[rgba(var(--light-red),0.8)]'
const RED_MD = 'bg-[var(--lay-1)] hover:bg-[var(--lay-1-hover)]'
const RED_XXS = 'bg-[var(--lay-2)] hover:bg-[var(--lay-2-hover)]'

const BLUE_XS_ACTIVE =
  '!bg-[var(--lg-blue-bg)] !text-white shadow-[inset_0_1px_3px_rgba(var(--black-rgb),0.5)] hover:opacity-100'
const RED_XS_ACTIVE =
  '!bg-[var(--lg-red-bg)] !text-white shadow-[inset_0_1px_3px_rgba(var(--black-rgb),0.5)] hover:opacity-100'

const BG_LINE =
  '!bg-[url(/img/bg-line.png)] opacity-90 [filter:brightness(0.7)] [background-blend-mode:color-burn] !cursor-default pointer-events-none'

const BACK_SPARK = 'animate-[sparkBack_0.8s_ease-in-out]'
const LAY_SPARK = 'animate-[sparkLay_0.8s_ease-in-out]'

const RUNNER_FIRST_CELL =
  ' bg-white text-start px-[10px] py-[3px] text-[var(--header-primary)] border-t border-[var(--tbl-border-color)] max-md:bg-transparent max-md:px-[1.8666666667vw] max-md:py-[0.3333333333vw] max-md:h-[11.51vw] max-md:text-[4vw]'

const GAME_STATUS_OVERLAY =
  'absolute inset-0 max-w-[665px] !w-full bg-[rgba(36,58,72,0.4)] z-[9] flex items-center justify-center text-white/80 [text-shadow:0_1px_4px_rgba(0,0,0,0.5)] text-[13px] cursor-default hover:bg-[rgba(36,58,72,0.6)] max-md:text-[3.46667vw] max-md:font-bold'

const FANCY_INFO_POPUP =
  'absolute top-0 right-0 w-auto bg-white z-[99] px-[1.8666666667vw] pb-[1.8666666667vw] shadow-[0_6px_10px_rgba(var(--black-rgb),0.7)] rounded-[1.0666666667vw] flex [&_p]:text-[var(--sxl-text-color)] [&_p]:text-[2.6666666667vw] [&_p]:leading-[3.2vw] [&_p]:pt-[0.8vw] [&_p]:pb-[1.0666666667vw] [&_p]:whitespace-nowrap [&_p]:mb-0 [&_span]:leading-[3.7333333333vw] [&_span]:text-[var(--dark)] [&_span]:whitespace-nowrap [&_span]:text-[3vw]'

const FANCY_INFO_CLOSE_ICON =
  'pl-[2.5vw] pt-[1vw] inline-flex text-black [&_svg]:!h-[3.2vw] [&_svg]:!w-[3.2vw]'

const fmt = (value, digits = 0) => {
  if (value == null || value === '') return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

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

const isMarketStatusBlocked = (status) =>
  BLOCKED_STATUSES.has(normalizeStatus(status))

const isBookmakerStatusBlocked = isMarketStatusBlocked

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

export default function LiveOdds() {
  const { t } = useTranslation()
  const { eventId, sport: sportSlug } = useParams()
  const sportId = getSportIdFromSlug(sportSlug)

  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isOneClickBet = useSelector(selectIsOneClickBet)
  const oneClickBetStake = useSelector(selectOneClickBetStake)
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const currency = useSelector(selectCurrency)

  const activeRightSideBet = useSelector(selectActiveBetSlip)
  const isPlacingBet = useSelector(selectIsPlacingBet)
  const placingSelectionId = useSelector(selectPlacingSelectionId)

  const preExposureMarket = useSelector(selectPreExposureMarketName)
  const openBetRefreshTick = useSelector(selectOpenBetRefreshTick)

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
  const [isFancyRulesOpen, setIsFancyRulesOpen] = useState(false)
  const [error, setError] = useState(null)

  const [activeBookmaker, setActiveBookmaker] = useState(null)
  const [activeFancyBet, setActiveFancyBet] = useState(null)
  const [activeSportBook, setActiveSportBook] = useState(null)
  const [bookFancyTarget, setBookFancyTarget] = useState(null)

  const [postExposureByMarket, setPostExposureByMarket] = useState(
    () => new Map()
  )

  const previousMatchOddsRef = useRef(new Map())
  const sparkClearTimerRef = useRef(null)
  const iframeRef = useRef(null)

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

  const matchOddsArray = useMemo(
    () => normalizeMatchOdds(matchOddsList),
    [matchOddsList]
  )
  const isInplay = useMemo(
    () => matchOddsArray.some((m) => m.inplay),
    [matchOddsArray]
  )

  useEffect(() => {
    if (!isAuthenticated || !eventId) return undefined
    let cancelled = false
    http
      .get(`bet/post-exposure/${eventId}`)
      .then(({ data }) => {
        if (cancelled) return
        const entries = Array.isArray(data?.data) ? data.data : []
        const next = new Map()
        const fancyBucket = []
        for (const entry of entries) {
          if (Array.isArray(entry?.selections) && entry?.marketId) {
            next.set(String(entry.marketId), entry.selections)
          } else if (entry?.selectionId != null) {
            fancyBucket.push({
              id: String(entry.selectionId),
              exposure: entry.exposure,
            })
          }
        }
        if (fancyBucket.length) next.set('0', fancyBucket)
        setPostExposureByMarket(next)
      })
      .catch(() => {
        if (cancelled) return
        setPostExposureByMarket(new Map())
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, eventId, openBetRefreshTick])

  const visibleExposureByMarket = useMemo(() => {
    if (!isAuthenticated || !eventId) return new Map()
    return postExposureByMarket
  }, [isAuthenticated, eventId, postExposureByMarket])

  //

  //

  const fancySelectionId = activeFancyBet?.selectionId
  const fancyType = activeFancyBet?.type
  const fancyStake = Number(activeFancyBet?.stake) || 0
  const fancySize = Number(activeFancyBet?.size) || 0
  useEffect(() => {
    if (fancySelectionId && fancyStake > 0 && fancySize > 0) {
      const pnl = Number(((fancySize * fancyStake) / 100).toFixed(2))
      const profit = (fancyType === 'YES' ? 1 : -1) * pnl
      dispatch(
        setPreExposure({
          selectionId: fancySelectionId,
          profit,
          liability: 0,
          betType: fancyType,
          marketName: 'FANCY',
        })
      )
    } else if (preExposureMarket === 'FANCY') {
      dispatch(setPreExposure(null))
    }
  }, [
    dispatch,
    fancySelectionId,
    fancyType,
    fancyStake,
    fancySize,
    preExposureMarket,
  ])
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

  // Active chip moves to first position — matches Angular's onChangeMainFancy.
  const orderedFancyMainTabs = useMemo(() => {
    const active = fancyMainTabs.find((t) => t.type === selectedFancy)
    if (!active) return fancyMainTabs
    return [active, ...fancyMainTabs.filter((t) => t.type !== selectedFancy)]
  }, [fancyMainTabs, selectedFancy])

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

  const refreshMarkets = useCallback(() => {
    const controller = new AbortController()
    void loadDefaultOdds(controller.signal)
  }, [loadDefaultOdds])

  const toggleLiveStream = useCallback(() => setIsLiveStreamOn((on) => !on), [])
  const closeLiveStream = useCallback(() => setIsLiveStreamOn(false), [])
  const toggleBetLimit = useCallback(() => setBetLimitOpen((v) => !v), [])
  const toggleBookmakerInfo = useCallback(
    () => setBookmakerInfoOpen((v) => !v),
    []
  )

  const cancelMatchOdds = useCallback(
    () => dispatch(setActiveBetSlip(null)),
    [dispatch]
  )
  // Mobile parity with the desktop right-side <BetSlip />: lets the inline
  // mobile match-odds slip mutate the Redux-backed slip (odds + stake edits).
  const updateMatchOddsSlip = useCallback(
    (next) => dispatch(setActiveBetSlip(next)),
    [dispatch]
  )

  const handlePlaceBet = useCallback(
    (slip) => {
      const context = {
        sport: sportSlug ?? '',
        eventId: String(eventId ?? ''),
        eventTitle:
          matchOddsList?.[0]?.eventName || matchOddsList?.[0]?.eventTitle || '',
        runners: matchOddsList?.[0]?.runners ?? [],
      }
      return dispatch(placeBet({ slip, context })).unwrap()
    },
    [dispatch, sportSlug, eventId, matchOddsList]
  )

  const toggleFullscreen = useCallback(() => {
    const node = iframeRef.current
    if (!node) return
    if (node.requestFullscreen) node.requestFullscreen()
    else if (node.webkitRequestFullscreen) node.webkitRequestFullscreen()
  }, [])

  const tryOneClickPlace = useCallback(
    (slip) => {
      if (!isOneClickBet) return false
      const stake = Number(oneClickBetStake)
      if (!stake || Number.isNaN(stake)) {
        alertService.error(
          t('errors.invalidStake', 'Set a one-click stake first')
        )
        return true
      }
      dispatch(
        placeBet({
          slip: { ...slip, stake },
          context: {
            sport: sportSlug ?? '',
            eventId: String(eventId ?? ''),
            eventTitle: matchOddsArray[0]?.eventName ?? '',
            runners: matchOddsArray[0]?.runners ?? [],
          },
        })
      )
        .unwrap()
        .then(() => alertService.success(t('common.betPlaced', 'Bet placed')))
        .catch((msg) =>
          alertService.error(
            typeof msg === 'string'
              ? msg
              : t('errors.placeBetFailed', 'Failed to place bet')
          )
        )
      return true
    },
    [
      isOneClickBet,
      oneClickBetStake,
      dispatch,
      t,
      sportSlug,
      eventId,
      matchOddsArray,
    ]
  )

  const onMatchOddsClick = (runner, odd, betType) => {
    if (!odd?.price) return
    if (!isAuthenticated) {
      dispatch(setLoginWindow(true))
      return
    }
    const market =
      matchOddsArray.find((m) => m.marketId === runner._marketId) ??
      matchOddsArray[0]
    const setting = matchOddsSettingFor(runner._marketId)
    const slip = {
      marketId: runner._marketId,
      marketName: 'MATCH_ODDS',
      marketDisplayName: runner._marketName || 'Match Odds',
      eventId: String(eventId ?? ''),
      eventTitle: runner._eventTitle || '',
      sport: sportSlug ?? '',
      runners: market?.runners ?? [],
      selectionId: runner.selectionId,
      selectionName: runner.runnerName || runner.runner,
      betType,
      odd: odd.price,
      size: odd.size,
      stake: 0,
      min: setting.min,
      max: setting.max,
    }
    if (tryOneClickPlace(slip)) return
    dispatch(setActiveBetSlip(slip))
  }
  const onBookmakerClick = (bookmaker, odd, betType) => {
    if (!odd?.price) return
    if (isMarketStatusBlocked(bookmaker.s ?? bookmaker.status)) return
    if (!isAuthenticated) {
      dispatch(setLoginWindow(true))
      return
    }
    const slip = {
      marketId: bookmaker.mid ?? bookmaker.marketId,
      marketName: 'BOOKMAKER',
      eventId: String(eventId ?? ''),
      eventTitle: matchOddsArray[0]?.eventName || '',
      sport: sportSlug ?? '',
      runners: matchOddsArray[0]?.runners ?? [],
      selectionId: bookmaker.sid ?? bookmaker.selectionId,
      runnerId: bookmaker.sid ?? bookmaker.selectionId,
      selectionName: bookmaker.nat ?? bookmaker.runnerName,
      runnerName: bookmaker.nat ?? bookmaker.runnerName,
      betType,
      type: betType,
      odd: odd.price,
      odds: odd.price,
      size: odd.size ?? 0,
      stake: 0,
      min: Number(bookmaker.min ?? bookmakerSetting.min ?? 1),
      max: Number(bookmaker.max ?? bookmakerSetting.max ?? 10000),
    }
    if (tryOneClickPlace(slip)) return
    setActiveBookmaker(slip)
  }
  const onFancyClick = (item, betType) => {
    const price = betType === 'NO' ? item.LayPrice1 : item.BackPrice1
    const size = betType === 'NO' ? item.LaySize1 : item.BackSize1
    if (!price || isMarketStatusBlocked(item.GameStatus)) return
    if (!isAuthenticated) {
      dispatch(setLoginWindow(true))
      return
    }
    const slip = {
      marketId: item.default_marketId,
      marketName: 'FANCY',
      type: betType,
      eventId: String(eventId ?? ''),
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
    }
    if (tryOneClickPlace(slip)) return
    setActiveFancyBet(slip)
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
    const slip = {
      marketId: market.marketId,
      marketName: 'SPORTS_BOOK',
      type: 'BACK',
      eventId: String(eventId ?? ''),
      selectionId: runner.selectionId,
      runnerId: runner.selectionId,
      runnerName: runner.runnerName,
      betType: 'BACK',
      odds: runner.back[0].price,
      size: runner.back[0].size ?? 0,
      stake: 0,
      min: 1,
      max: 5000,
    }
    if (tryOneClickPlace(slip)) return
    setActiveSportBook(slip)
  }

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
      <div className={cx('md:mt-1', isYellowTheme && 'yellow-theme')}>
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
            <div className="bg-[linear-gradient(-180deg,var(--xl-blue)_0%,var(--xxl-blue)_82%)] flex justify-between items-center px-3 max-md:px-[1.866667vw] mr-0 leading-[2] text-white max-md:text-[3.7333333333vw]">
              <span className="capitalize font-bold">
                {getSportName(sportId)}
              </span>
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
              exposureData={
                visibleExposureByMarket.get(String(matchOdds.marketId)) ?? null
              }
              active={
                activeRightSideBet?.marketName === 'Match Odds' &&
                activeRightSideBet?.marketId === matchOdds.marketId
                  ? activeRightSideBet
                  : null
              }
              onPick={onMatchOddsClick}
              onCancelMatchOdds={cancelMatchOdds}
              onSlipChange={updateMatchOddsSlip}
              onPlaceBet={handlePlaceBet}
              isPlacingActive={
                isPlacingBet &&
                String(placingSelectionId) ===
                  String(activeRightSideBet?.selectionId ?? '')
              }
              betLimitOpen={betLimitOpen}
              onToggleBetLimit={toggleBetLimit}
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
              onToggleInfo={toggleBookmakerInfo}
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
                tabs={orderedFancyMainTabs}
                selectedFancy={selectedFancy}
                onSelect={setSelectedFancy}
                isMobile={isMobile}
                onInfoClick={() => setIsFancyRulesOpen(true)}
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
                  exposureData={visibleExposureByMarket.get('0') ?? null}
                  onBookClick={setBookFancyTarget}
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
      {bookFancyTarget && (
        <BookFancyModal
          eventId={eventId}
          selectionId={bookFancyTarget.selectionId}
          runnerName={bookFancyTarget.runnerName}
          onClose={() => setBookFancyTarget(null)}
        />
      )}

      <Modal
        isOpen={isFancyRulesOpen}
        onClose={() => setIsFancyRulesOpen(false)}
        title={t('rules.fancyBets', 'Rules of Fancy Bets')}
        size="md"
        centered
        closeOnBackdrop
        closeOnEscape
        centerTitle
        hideClose
      >
        <div className="h-85 overflow-y-auto max-md:h-auto">
          <div className="text-[12px] leading-3.75 text-[rgba(var(--dark-blue-rgba),0.9)] max-md:text-[3.46667vw] max-md:leading-[5.86667vw] max-md:text-[rgba(var(--dark-wheat-rgba),0.8)] max-md:break-all">
            <ol className="list-decimal pl-5 m-0 [&>li]:mb-1 [&>li>ul]:list-none [&>li>ul]:p-0 [&>li>ul]:pl-4 [&>li>ul]:mt-1 [&_a]:text-(--blue) max-md:m-0 max-md:ml-[6.66667vw] max-md:p-0">
              <li>Once all session/fancy bets are completed and settled there will be no reversal even if the Match is Tied or is Abandoned.</li>
              <li>Advance Session or Player Runs and all Fancy Bets are only valid for 20/50 overs full match each side. (Please Note this condition is applied only in case of Advance Fancy Bets only).</li>
              <li>All advance fancy bets market will be suspended 60 mins prior to match and will be settled.</li>
              <li>Under the rules of Session/Fancy Bets if a market gets Suspended for any reason whatsoever and does not resume then all previous Bets will remain Valid and become HAAR/JEET bets.</li>
              <li>Incomplete Session/Fancy Bet will be cancelled but Complete Session will be settled.</li>
              <li>In the case of Running Match getting Cancelled/ No Result/ Abandoned but the session is complete it will still be settled. Player runs / fall of wicket will be also settled at the figures where match gets stopped due to rain for the inning (D/L), cancelled, abandoned, no result.</li>
              <li>If a player gets Retired Hurt and one ball is completed after you place your bets then all the betting till then is and will remain valid.</li>
              <li>Should a Technical Glitch in Software occur, we will not be held responsible for any losses.</li>
              <li>Should there be a power failure or a problem with the Internet connection at our end and session/fancy market does not get suspended then our decision on the outcome is final.</li>
              <li>All decisions relating to settlement of wrong market being offered will be taken by management. Management will consider all actual facts and decision taken will be full in final.</li>
              <li>Any bets which are deemed of being suspicious, including bets which have been placed from the stadium or from a source at the stadium maybe voided at anytime. The decision of whether to void the particular bet in question or to void the entire market will remain at the discretion of Company. The final decision of whether bets are suspicious will be taken by Company and that decision will be full and final.</li>
              <li>Any sort of cheating bet, any sort of Matching (Passing of funds), Court Siding (Ghaobaazi on commentary), Sharpening, Commission making is not allowed in Company. If any company User is caught in any of such act then all the funds belonging that account would be seized and confiscated. No argument or claim in that context would be entertained and the decision made by company management will stand as final authority.</li>
              <li>Fluke hunting/Seeking is prohibited in Company. All the fluke bets will be reversed. Cricket commentary is just an additional feature and facility for company user but company is not responsible for any delay or mistake in commentary.</li>
              <li>
                Valid for only 1st inning.
                <ul>
                  <li>• Highest Inning Run: This fancy is valid only for first inning of the match.</li>
                  <li>• Lowest Inning Run: This fancy is valid only for first inning of the match.</li>
                </ul>
              </li>
              <li>
                If any fancy value gets passed, we will settle that market after that match gets over. For example: If any market value is (22-24) and incase the result is 23 than that market will be continued, but if the result is 24 or above then we will settle that market. This rule is for the following market.
                <ul>
                  <li>• Total Sixes In Single Match</li>
                  <li>• Total Fours In Single Match</li>
                  <li>• Highest Inning Run</li>
                  <li>• Highest Over Run In Single Match</li>
                  <li>• Highest Individual Score By Batsman</li>
                  <li>• Highest Individual Wickets By Bowler</li>
                </ul>
              </li>
              <li>
                If any fancy value gets passed, we will settle that market after that match gets over. For example: If any market value is (22-24) and incase the result is 23 than that market will be continued, but if the result is 22 or below then we will settle that market. This rule is for the following market.
                <ul>
                  <li>• Lowest Inning Run</li>
                  <li>• Fastest Fifty</li>
                  <li>• Fastest Century</li>
                </ul>
              </li>
              <li>If any case wrong rate has been given in fancy, that particular bets will be cancelled (Wrong Commentary).</li>
              <li>In case customer make bets in wrong fancy we are not liable to delete, no changes will be made and bets will be considered as confirm bet.</li>
              <li>
                Dot Ball Market Rules
                <ul>
                  <li>Wides Ball - Not Count</li>
                  <li>No Ball - Not Count</li>
                  <li>Leg Bye - Not Count as A Dot Ball</li>
                  <li>Bye Run - Not Count as A Dot Ball</li>
                  <li>Run Out - On 1st Run Count as A Dot Ball</li>
                  <li>Run Out - On 2nd n 3rd Run Not Count as a Dot Ball</li>
                  <li>Out - Catch Out, Bowled, Stumped n LBW Count as A Dot Ball</li>
                </ul>
              </li>
              <li>
                Bookmaker Rules
                <ul>
                  <li>• Due to any reason any team will be getting advantage or disadvantage we are not concerned.</li>
                  <li>• We will simply compare both teams 25 overs score higher score team will be declared winner in ODI.</li>
                  <li>• We will simply compare both teams 10 overs higher score team will be declared winner in T20 matches.</li>
                </ul>
              </li>
              <li>Penalty Runs - Any Penalty Runs Awarded in the Match (In Any Running Fancy or ADV Fancy) Will Not be Counted While Settling in our Exchange.</li>
              <li>
                LIVE STREAMING OF ALL VIRTUAL CRICKET MATCHES IS AVAILABLE HERE{' '}
                <a className="underline break-all" href="https://www.youtube.com/channel/UCd837ZyyiO5KAPDXibynq_Q/featured" target="_blank" rel="noreferrer noopener">
                  https://www.youtube.com/channel/UCd837ZyyiO5KAPDXibynq_Q/featured
                </a>
              </li>
              <li>
                CHECK SCORE OF VIRTUAL CRICKET ON{' '}
                <a className="underline break-all" href="https://sportcenter.sir.sportradar.com/simulated-reality/cricket" target="_blank" rel="noreferrer noopener">
                  https://sportcenter.sir.sportradar.com/simulated-reality/cricket
                </a>
              </li>
              <li>
                Comparison Market
                <ul>
                  <li>In Comparison Market We Don&apos;t Consider Tie or Equal Runs on Both the Innings While Settling. Second Batting Team Must need to Surpass 1st Batting&apos;s team Total to win otherwise on Equal Score or Below We declare 1st Batting Team as Winner.</li>
                </ul>
              </li>
              <li>
                If match is abandoned or over reduced. This rule is for the following market (ENTIRE IPL 2020)
                <ul>
                  <li>• Total Fours: Average 27 fours will be given if the match is abandoned or over reduced.</li>
                  <li>• Total Sixes: Average 11 sixes will be given if the match is abandoned or over reduced.</li>
                  <li>• Total Caught &amp; Bowled Out: Average 0 Caught &amp; Bowled Out will be given if the match is abandoned or over reduced.</li>
                  <li>• Total Wide: Average 8 wides will be given if the match is abandoned or over reduced.</li>
                  <li>• Total Extra: Average 14 extras will be given if the match is abandoned or over reduced.</li>
                  <li>• Total No Ball: Average 1 no ball will be given if the match is abandoned or over reduced.</li>
                  <li>• Total duck: Average 1 duck will be given if the match is abandoned or over reduced.</li>
                  <li>• Total Fifties: Average 2 fifties will be given if the match is abandoned or over reduced.</li>
                  <li>• Total Century: Average 0 century will be given if the match is abandoned or over reduced.</li>
                  <li>• Total Run Out: Average 1 run out will be given if the match is abandoned or over reduced.</li>
                  <li>• Total Caught out: Average 8 caught out will be given if the match is abandoned or over reduced.</li>
                  <li>• Total Stump Out: Average 0 stump out will be given if the match is abandoned or over reduced.</li>
                  <li>• Total Maiden Over: Average 0 maiden over will be given if the match is abandoned or over reduced.</li>
                  <li>• Total LBW: Average 1 LBW will be given if the match is abandoned or over reduced.</li>
                  <li>• Total Bowled: Average 2 bowled will be given if the match is abandoned or over reduced.</li>
                </ul>
              </li>
              <li>Player Boundaries Fancy: Both Four and six are valid.</li>
              <li>
                BOWLER RUN SESSION RULE:
                <ul>
                  <li>IF BOWLER BOWL 1.1 OVER, THEN VALID (FOR BOWLER 2 OVER RUNS SESSION)</li>
                  <li>IF BOWLER BOWL 2.1 OVER, THEN VALID (FOR BOWLER 3 OVER RUNS SESSION)</li>
                  <li>IF BOWLER BOWL 3.1 OVER, THEN VALID (FOR BOWLER 4 OVER RUNS SESSION)</li>
                  <li>IF BOWLER BOWL 4.1 OVER, THEN VALID (FOR BOWLER 5 OVER RUNS SESSION)</li>
                  <li>IF BOWLER BOWL 9.1 OVER, THEN VALID (FOR BOWLER 10 OVER RUNS SESSION)</li>
                </ul>
              </li>
              <li>
                Total Match Playing Over ADV: We Will Settle this Market after Whole Match gets Completed
                <ul>
                  <li>Criteria: We Will Count Only Round-Off Over For Both the Innings While Settling (For Ex: If 1st Batting team gets all out at 17.3, 18.4 or 19.5 we Will Count Such Overs as 17, 18 and 19 Respectively and if Match gets Ended at 17.2, 18.3 or 19.3 Overs then we will Count that as 17, 18 and 19 Over Respectively, and this Will Remain Same For Both the Innings.</li>
                  <li>In Case Of Rain or if Over gets Reduced then this Market will get Voided.</li>
                </ul>
              </li>
              <li>
                3 WKT OR MORE BY BOWLER IN MATCH ADV:
                <ul>
                  <li>We Will Settle this Market after Whole Match gets Completed.</li>
                  <li>In Case Of Rain or if Over Gets Reduced then this Market Will get Voided.</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>

        <div className="mt-4 max-md:mt-[1.86667vw]">
          <button
            type="button"
            onClick={() => setIsFancyRulesOpen(false)}
            className="block w-full py-1.5 uppercase font-bold text-(--dark) border border-(--xxl-gray) rounded bg-[linear-gradient(-180deg,var(--white)_0%,var(--xs-gray)_89%)] hover:bg-[linear-gradient(-180deg,var(--xs-gray)_0%,var(--white)_89%)] max-md:rounded-[1.6vw] max-md:text-[4vw] max-md:py-[2.6vw]"
          >
            {t('common.ok', 'OK')}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export const PinRefresh = memo(function PinRefresh({ onRefresh }) {
  const baseDiv =
    'text-white font-bold z-[1] min-w-[90px] flex justify-center items-center h-[25px] leading-[20px] relative max-md:px-3 max-md:py-[6px] max-md:h-[7.46667vw] max-md:leading-tight max-md:text-[3.2vw] max-md:min-w-[25.5vw] [&_i_svg]:h-[14px] [&_i_svg]:w-[14px] max-md:[&_i_svg]:h-[3.73333vw] max-md:[&_i_svg]:w-[3.73333vw] mobile:[&_span]:hidden'

  const firstDiv = `${baseDiv} bg-[var(--text-xl-color)] rounded-bl-[10px] max-md:bg-gradient-to-t max-md:from-[var(--xls-navy)] max-md:to-[var(--xts-light-bg)] max-md:w-[25.5vw] max-md:rounded-bl-[3vw] before:content-[''] before:absolute before:left-[-3px] before:w-[19px] before:bg-[var(--text-xl-color)] before:top-[-4px] before:bottom-[1px] before:-z-[1] before:[transform:rotate(-22deg)] before:rounded-bl-[10px] max-md:before:[transform:rotate(-16deg)] max-md:before:bg-gradient-to-t max-md:before:from-[var(--xs-navy)] max-md:before:to-[var(--xts-md-bg)] max-md:before:rounded-bl-[3vw]`

  const secondDiv = `${baseDiv} bg-[var(--text-xl-color)] shadow-[1px_0_0_0_rgba(255,255,255,0.3)_inset] rounded-br-[10px] max-md:bg-gradient-to-t max-md:from-[var(--xls-navy)] max-md:to-[var(--xts-light-bg)] max-md:rounded-br-[3vw] max-md:border-l-[0.53333vw] max-md:border-l-[rgba(22,40,49,0.9)] after:content-[''] after:absolute after:right-[-3px] after:w-[19px] after:bg-[var(--text-xl-color)] after:top-[-4px] after:bottom-[1px] after:-z-[1] after:rounded-br-[10px] after:[transform:rotate(22deg)] max-md:after:[transform:rotate(16deg)] max-md:after:bg-gradient-to-t max-md:after:from-[var(--xs-navy)] max-md:after:to-[var(--xts-md-bg)] max-md:after:rounded-br-[3vw]`

  return (
    <div className="text-center overflow-hidden bg-white mt-px max-md:bg-(--light-bg) max-md:mt-0">
      <div className="inline-flex items-center relative cursor-pointer">
        <div className={firstDiv}>
          <PinIcon />
        </div>
        <div className={secondDiv} onClick={onRefresh} role="button">
          <RefreshIcon />
        </div>
      </div>
    </div>
  )
})

const LiveStream = memo(function LiveStream({
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
    <div className="relative max-w-[500px] mx-auto text-center md:mb-3 md:p-2 pb-0 max-md:max-w-full max-md:overflow-hidden">
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
})

const MatchedLiveBar = memo(function MatchedLiveBar({
  currency,
  totalMatched,
  showLiveButton,
  isLiveStreamOn,
  onToggleLive,
}) {
  const { t } = useTranslation()

  const LIVE_BTN_BASE =
    'relative h-[23px] leading-[19px] rounded-[3px] text-white px-[7px] my-[3px] mx-[5px] text-[13px] ' +
    "before:content-[''] before:inline-block before:align-middle before:mr-[5px] before:h-[15px] before:w-[18px]"
  const LIVE_ON =
    'bg-gradient-to-b from-[var(--md-cloud)] to-[var(--lg-cloud)] ' +
    'before:[background-image:url(/img/live-icons.png)] before:[background-position:-396px_-2453px]'
  const LIVE_OFF =
    'bg-gradient-to-b from-[var(--mds-orange)] to-[var(--lg-orange)] ' +
    'before:[background-image:url(/img/close-live.png)] before:[background-position:center]'

  return (
    <div className="flex">
      <div className="flex items-center text-[13px] [&_span]:font-bold">
        <p className="m-0">{t('common.matched', 'Matched')}</p>
        <span className="ml-1">{currency || 'PBU'}</span>
        <span className="ml-1 mr-2">{fmt(totalMatched)}</span>
      </div>
      {showLiveButton && (
        <button
          type="button"
          className={cx(LIVE_BTN_BASE, isLiveStreamOn ? LIVE_OFF : LIVE_ON)}
          onClick={onToggleLive}
        >
          {t('common.live', 'Live')}
        </button>
      )}
    </div>
  )
})

export function MatchOddsSection({
  matchOdds,
  isMobile,
  isAuthenticated,
  isYellowTheme,
  currency,
  marketSetting,
  isStreamAvailable,
  isLiveStreamOn,
  onToggleLive,
  exposureData,
  active,
  onPick,
  onCancelMatchOdds,
  onSlipChange,
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
    ? 'inline-block relative font-bold mr-0 max-md:!bg-gradient-to-t max-md:!from-[#ffa10c] max-md:!to-[var(--md-primary-yellow)] max-md:border max-md:!border-[var(--coffee)] max-md:!text-[var(--dark)] max-md:px-[3.4vw] max-md:rounded-[4.8vw] max-md:text-[3.46667vw] max-md:leading-[9.06667vw] md:bg-[var(--sm-white)] md:text-[var(--xxl-blue)] md:px-[2px] md:py-[8px_2px_7px_10px] md:py-2 md:pl-[10px] md:pr-[2px] md:text-[13px] md:mr-5 md:after:content-[""] md:after:absolute md:after:[background-image:url(/img/main-s1aea395e8c.png)] md:after:z-[1] md:after:bottom-0 md:after:top-0 md:after:-right-5 md:after:h-[30px] md:after:[background-position:432px_1725px] md:after:w-5'
    : 'inline-block relative font-bold mr-0 max-md:text-white max-md:border max-md:border-[rgba(var(--md-dark-rgb),0.3)] max-md:bg-gradient-to-b max-md:from-[var(--xs-primary)] max-md:to-[var(--xxs-primary)] max-md:px-[3.4vw] max-md:rounded-[4.8vw] max-md:text-[3.46667vw] max-md:leading-[9.06667vw] md:bg-[var(--sm-white)] md:text-[var(--xxl-blue)] md:pl-[10px] md:pr-[2px] md:pb-[7px] md:pt-2 md:text-[13px] md:mr-5 md:after:content-[""] md:after:absolute md:after:[background-image:url(/img/main-s1aea395e8c.png)] md:after:z-[1] md:after:bottom-0 md:after:top-0 md:after:-right-5 md:after:h-[30px] md:after:[background-position:432px_1725px] md:after:w-5'

  return (
    <div className="md:mb-[30px]">
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
                <MatchedLiveBar
                  currency={currency}
                  totalMatched={totalMatched}
                  showLiveButton={isAuthenticated && isStreamAvailable}
                  isLiveStreamOn={isLiveStreamOn}
                  onToggleLive={onToggleLive}
                />
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
                isMarketStatusBlocked(matchOdds.status) ||
                isMarketStatusBlocked(runner.status)

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
                          <BetExposureCell
                            selectionId={runner.selectionId}
                            exposureData={exposureData}
                            marketName="MATCH_ODDS"
                          />
                        </div>
                      </div>
                    </td>
                    {/* BACK columns — Angular: @for back of matchOdd.back; classes blue-xxs/blue-md/blue-xs */}
                    {backCells.map((cell, idx) => {
                      const price = cell?.price
                      const tone = backClasses[idx]
                      const isBestBack =
                        (isMobile && idx === 0) || (!isMobile && idx === 2)

                      const isActive =
                        isBestBack &&
                        active?.selectionId === runner.selectionId &&
                        active?.betType === 'BACK'

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
                  {/* md: inline bet slip below the active runner — Angular parity.
                      Desktop: bet slip lives in the right-side <BetSlip /> panel via Redux. */}
                  {isMobile && active?.selectionId === runner.selectionId && (
                    <tr>
                      <td colSpan={3} className="p-0">
                        <InlineBetSlip
                          betSlipDetails={{
                            ...active,
                            // InlineBetSlip reads `type` / `odds` / `runnerId` /
                            // `runnerName`; mirror our canonical fields onto
                            // those aliases so the slip controls render right.
                            type: active.betType,
                            runnerId: active.selectionId,
                            runnerName: active.selectionName,
                            odds: active.odd,
                            min: active.min ?? marketSetting.min ?? 1,
                            max: active.max ?? marketSetting.max ?? 100,
                            stake: active.stake ?? 0,
                          }}
                          onChange={(updated) => {
                            // Reflect odds / stake edits back into the Redux
                            // slip so the user can change them on mobile, same
                            // as the right-side <BetSlip /> on desktop.
                            onSlipChange?.({
                              ...active,
                              odd: Number(updated.odds ?? active.odd) || 0,
                              size: Number(updated.size ?? active.size) || 0,
                              stake: Number(updated.stake ?? active.stake) || 0,
                            })
                          }}
                          onCancel={onCancelMatchOdds}
                          onPlaceBet={onPlaceBet}
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

  const normalized = useMemo(
    () =>
      runners.map((bm) => ({
        selectionId: bm.sid ?? bm.selectionId,
        runnerName: bm.nat ?? bm.runnerName,
        status: bm.s ?? bm.status ?? 'ACTIVE',

        back: [
          { price: num(bm.b3), size: num(bm.bs3) },
          { price: num(bm.b2), size: num(bm.bs2) },
          { price: num(bm.b1), size: num(bm.bs1) },
        ],

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
        <div className="flex items-center justify-center [&_.icon-wrapper]:flex [&_.icon-wrapper]:items-center [&_.icon-wrapper]:justify-center [&_.icon-wrapper]:max-md:pl-[1.86667vw] md:[&_.icon-wrapper_i]:bg-no-repeat md:[&_.icon-wrapper_i]:[background-image:url('/img/main-s1aea395e8c.png')] md:[&_.icon-wrapper_i]:[background-position:-385px_-833px] md:[&_.icon-wrapper_i]:h-[28px] md:[&_.icon-wrapper_i]:w-[29px] md:[&_.icon-wrapper_i]:mr-[6px] md:[&_.icon-wrapper_svg]:hidden max-md:[&_.icon-wrapper_svg]:block max-md:[&_.icon-wrapper_svg]:w-[6.66667vw] max-md:[&_.icon-wrapper_svg]:h-[6.66667vw]">
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
          <span className="bg-gradient-to-br from-[var(--xts-lightest-navy)] to-[var(--mds-lightest-navy)] inline-block rounded-tr-[12px] relative md:px-2 mr-[1.86667vw] text-white [&_svg]:max-md:w-[4vw] [&_svg]:max-md:h-[4vw]">
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
        <table className="w-full border-collapse bg-[var(--light-xs-yellow)] max-md:bg-[var(--light-xts-yellow)]  [&_td]:border-t [&_td]:border-[var(--tbl-border-color)]">
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
                  <tr className="bg-[var(--light-xs-yellow)] max-md:bg-[var(--light-xts-yellow)] hover:[&_td]:bg-white/40">
                    <td className="px-[10px] pt-[4px] !align-top bg-[var(--light-xs-yellow)] max-md:bg-[var(--light-xts-yellow)] max-md:px-[1.8666666667vw] max-md:py-0 max-md:!align-middle max-md:text-[4vw] min-w-[170px]">
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
                        className="border-collapse relative md:w-full md:max-w-[76%] before:content-[''] before:bg-[linear-gradient(90deg,rgba(130,183,221,0.15)_0%,rgba(130,183,221,0.8)_65%)] before:absolute before:left-0 before:right-0 before:top-0 before:bottom-0 before:w-1/2 before:z-0 after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-1/2 after:bg-[linear-gradient(270deg,rgba(231,170,184,0.15)_5%,rgba(231,170,184,0.8)_60%)] after:z-0 after:top-0 after:z-1 before:z-1 after:w-[50%+1px]"
                      >
                        <tbody className="relative">
                          {isSuspended && (
                            <div className="inset-0 w-full h-full absolute bg-[rgba(36,58,72,0.4)] z-50 text-white/80 font-bold flex items-center justify-center text-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
                              Suspended
                            </div>
                          )}
                          <tr className="bg-[var(--light-xs-yellow)]">
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

                                    "after:content-[''] after:absolute after:inset-[2px] after:rounded-[4px] after:border after:border-white after:bg-[var(--xs-blue)] after:-z-[1] max-md:after:inset-[1vw] first-of-type:after:hidden [&:nth-of-type(2)]:after:hidden",
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
                                    "after:content-[''] after:absolute after:inset-[2px] after:rounded-[4px] after:border after:border-white after:bg-[var(--xs-red)] after:-z-[1] max-md:after:inset-[5px] last-of-type:after:hidden [&:nth-last-of-type(2)]:after:hidden",
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
                  {/* Inline bet slip + strip loader below the active runner —
                      same pattern as fancy / sportsbook. */}
                  {isInlineBookmaker && (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <InlineBetSlip
                          betSlipDetails={active}
                          onChange={onActiveChange}
                          onCancel={() => onActiveChange(null)}
                          onPlaceBet={onPlaceBet}
                          isPlacing={isPlacingActive}
                        />
                        {isPlacingActive && <PlacingBetStrip />}
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

function MatchHeader({ children }) {
  return (
    <div className="flex items-center justify-between bg-[var(--light-navy)] max-md:bg-[var(--text-color)]">
      {children}
    </div>
  )
}

const FancyTabHeader = memo(function FancyTabHeader({
  tabs,
  selectedFancy,
  onSelect,
  isMobile,
  onInfoClick,
}) {
  const { t } = useTranslation()
  const isSportsBookSelected = selectedFancy === MAIN_FANCY.SPORTS_BOOK

  return (
    <div
      className={cx(
        'flex items-center border-b-2 border-[var(--sky-blue-light)] max-md:border-b-[1.06667vw] max-md:border-b-[var(--smd-text-color)]',
        isSportsBookSelected && '!border-b-[var(--orange)]'
      )}
    >
      {tabs.map((tab, i) => {
        const isActive = tab.type === selectedFancy
        const isFirst = i === 0
        const isPremium =
          isSportsBookSelected && tab.type === MAIN_FANCY.SPORTS_BOOK

        const chipBase =
          'inline-flex items-center cursor-pointer relative ml-4 max-md:ml-[4.786vw] first:ml-0'
        const chipActive = isActive ? 'ml-0' : ''

        const hidePin = tab.type === MAIN_FANCY.SPORTS_BOOK

        let innerBg =
          'flex items-center px-[10px] py-[7px] h-[30px] bg-[var(--light-navy)] text-white relative font-bold max-md:px-[1.66667vw] max-md:py-[1.3vw] max-md:h-[7.55vw]'

        if (!isActive) {
          innerBg +=
            " before:content-[''] before:absolute before:top-0 before:bottom-0 before:left-[-6px] before:w-[10px] before:rounded-tl-[4px] before:[transform:skew(-14deg,0deg)] before:bg-[var(--light-navy)] before:z-[1] max-md:before:left-[-1.582vw] max-md:before:w-[3.304vw] max-md:before:rounded-tl-[0.522vw] max-md:before:h-[7.6vw]" +
            " after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-[-6px] after:w-[10px] after:rounded-tr-[4px] after:[transform:skew(14deg,0deg)] after:bg-[var(--light-navy)] after:z-[1] max-md:after:right-[-1.782vw] max-md:after:w-[3.304vw] max-md:after:rounded-tr-[0.522vw] max-md:after:h-[7.6vw]"
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
              <p className="absolute overflow-visible top-[-5px] right-[-15px] h-[14px] z-[99] [filter:drop-shadow(1px_1px_2px_rgba(0,0,0,0.6))] mb-0 max-md:top-[-3.5667vw] max-md:right-[-5vw] before:content-[''] before:absolute before:bottom-[-8px] before:left-[15px] before:w-0 before:h-0 before:border-solid before:border-t-[8px] before:border-r-[7px] before:border-b-0 before:border-l-0 before:border-t-[var(--xsm-red)] before:border-r-transparent max-md:before:border-t-[1.8vw] max-md:before:border-r-[1.8vw] max-md:before:left-[3.5vw] max-md:before:bottom-[-2.3vw]">
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
              {isFirst && (
                <i className="bg-gradient-to-t from-[var(--xs-green-primary)] via-[var(--xs-green-primary)] to-[var(--xs-shadow-primary)] rounded-[3px] max-md:w-[4vw] max-md:h-[4vw] max-md:text-center [&_svg]:max-md:w-[3.8vw] [&_svg]:max-md:h-[3.8vw] [&_svg]:max-md:leading-[3.8vw]">
                  <TimeSvg />
                </i>
              )}
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
              <i
                role="button"
                aria-label="Fancy bet rules"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  onInfoClick?.()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    onInfoClick?.()
                  }
                }}
                className={cx(
                  "inline-flex text-center relative text-white z-[2] px-1 w-[16px] h-[16px] cursor-pointer max-md:w-[4vw] max-md:h-[4.45vw] after:content-[''] after:bg-no-repeat after:absolute after:z-[1] after:bg-center after:left-0 after:top-0 after:bg-contain after:w-[16px] after:h-[16px] after:[background-image:url('/img/svg/info.svg')] max-md:after:w-[5vw] max-md:after:h-[4vw] max-md:after:[background-image:url('/img/svg/questionMarkRounded.svg')] before:content-[''] before:absolute before:rounded-tr-[4px] before:[transform:skew(14deg,0deg)] before:-z-[1] before:left-[-5px] before:w-[28px] before:top-[-7px] before:bottom-[-7px] max-md:before:top-[-1.6vw] max-md:before:bottom-0 max-md:before:w-[7vw] max-md:before:h-[7.6vw] max-md:before:left-[-1vw]",
                  isPremium
                    ? 'before:bg-[linear-gradient(180deg,var(--3sm-orange)_0%,var(--orange)_100%)]'
                    : 'before:bg-[linear-gradient(0deg,var(--xl-lightest-navy)_0%,var(--xts-lightest-navy)_100%)]'
                )}
              />
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
})

const PriorityTabs = memo(function PriorityTabs({
  tabs,
  selectedType,
  onSelectType,
  variant = 'fancy',
}) {
  const isSportBook = variant === 'sport-book'

  const containerCls = cx(
    'overflow-x-auto whitespace-nowrap cursor-pointer [&::-webkit-scrollbar]:hidden'
  )

  const wrapperCls = cx(
    'flex justify-center items-center shadow-[inset_0_1px_0_0_rgba(var(--black-rgb),0.2)] bg-gradient-to-b from-[var(--md-lightest-navy)] from-[15%] to-[var(--lg-lightest-navy)] max-md:!shadow-none max-md:bg-none max-md:bg-[var(--smd-text-color)] max-md:justify-start max-md:py-[0.5vw] max-md:pl-[1.6vw]',
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
              'min-w-[70px] h-[18px] leading-[18px] font-bold md:rounded-[4px] px-[5px] text-center max-md:h-[5.9333333333vw] max-md:min-w-0 max-md:px-[2.6666666667vw] max-md:leading-[6vw] max-md:h-[5.9333333333vw] max-md:border-r max-md:border-r-white/40 hover:[&_a]:underline'
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
})

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
  exposureData,
  onBookClick,
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
          <div className="flex items-center justify-center pr-3 [&_.icon-wrapper]:flex [&_.icon-wrapper]:items-center [&_.icon-wrapper]:justify-center md:[&_.icon-wrapper_i]:bg-no-repeat md:[&_.icon-wrapper_i]:[background-image:url('/img/main-s1aea395e8c.png')] md:[&_.icon-wrapper_i]:[background-position:-385px_-833px] md:[&_.icon-wrapper_i]:h-[28px] md:[&_.icon-wrapper_i]:w-[29px] md:[&_.icon-wrapper_i]:mr-[6px] md:[&_.icon-wrapper_svg]:hidden">
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
          <thead>
            <tr>
              <th className="bg-white px-[10px] py-1 font-bold text-[12px] max-md:text-[var(--lg-white,#fff)] max-md:text-[3.46667vw] max-md:h-[4.954vw] max-md:p-[1.33333vw_1.86667vw]" />
              <th className="bg-white px-[10px] py-1 font-bold text-[12px] max-md:text-[var(--lg-white,#fff)] max-md:text-[3.46667vw] max-md:w-[18.66667vw] max-md:h-[4.954vw] max-md:p-[1.33333vw_1.86667vw]">
                No
              </th>
              <th className="bg-white px-[10px] py-1 font-bold text-[12px] max-md:text-[var(--lg-white,#fff)] max-md:text-[3.46667vw] max-md:w-[18.66667vw] max-md:h-[4.954vw] max-md:p-[1.33333vw_1.86667vw]">
                Yes
              </th>
              {!isMobile && (
                <>
                  <th className="bg-white px-[10px] py-1 font-bold text-[12px]" />
                  <th className="bg-white px-[10px] py-1 font-bold text-[12px] max-[1199px]:hidden" />
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const isSuspended = isMarketStatusBlocked(item.GameStatus)
              const isInline =
                active &&
                active.selectionId === item.SelectionId &&
                !isSuspended
              const statusLabel = titleCase(item.GameStatus || '')

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
                  <tr className="[&_>td]:bg-white hover:bg-[var(--hover-bg)] hover:[&>td]:bg-[var(--hover-bg)] hover:[&_td:last-child]:border-l-[var(--hover-bg)]">
                    <td className="px-[10px] py-[5px] relative min-w-[100px] max-md:min-w-[70px] border-t border-t-[var(--tbl-border-color)] h-[42px] max-md:h-[11.51vw]">
                      {!isMobile && (
                        <div>
                          <span className="block w-full max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap font-bold min-w-[50px]">
                            {item.RunnerName}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center gap-2">
                        <BetExposureCell
                          selectionId={item.SelectionId}
                          exposureData={exposureData}
                          marketName="FANCY"
                        />
                        {Array.isArray(exposureData) &&
                          exposureData.some(
                            (e) => String(e?.id) === String(item.SelectionId)
                          ) && (
                            <button
                              type="button"
                              className="cursor-pointer text-[13px] leading-[1.3] px-1.5 py-[3px] rounded-[4px] bg-[#ffcc51] text-[color:var(--dark)] border border-[#cf9a47] hover:opacity-90 max-md:rounded-[1.33vw] max-md:text-[3.2vw] max-md:p-[1.6vw]"
                              onClick={() =>
                                onBookClick?.({
                                  selectionId: item.SelectionId,
                                  runnerName: item.RunnerName,
                                })
                              }
                            >
                              Book
                            </button>
                          )}
                      </div>
                    </td>
                    <td
                      colSpan={2}
                      className="p-0 relative border-t border-t-[var(--tbl-border-color)] h-[42px] max-md:h-[11.51vw] w-[10.9%] min-w-[100px]"
                    >
                      {isSuspended && (
                        <div className="absolute inset-0 bg-[rgba(36,58,72,0.4)] z-[9] flex items-center justify-center text-white/80 font-bold [text-shadow:0_1px_4px_rgba(0,0,0,0.5)] text-[13px] cursor-default max-md:text-[3.46667vw]">
                          {statusLabel}
                        </div>
                      )}
                      <table className="w-full border-collapse">
                        <tbody>
                          <tr>
                            <td
                              className={cx(
                                PRICE_CELL_BASE,
                                RED_XS,
                                'h-[42px] min-w-[100px] !px-[5px] max-md:!h-[11.51vw]',
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
                                'h-[42px] min-w-[100px] !px-[5px] max-md:!h-[11.51vw]',
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
                        <td className="px-[10px] py-[5px] relative border-white border-t border-t-[var(--tbl-border-color)] h-[42px] max-md:h-[11.51vw] w-[10.9%]">
                          <p className="mb-0 text-[var(--sm-text-color)] min-h-[32px] text-left text-[11px]">
                            Min/Max
                            <span className="block whitespace-nowrap !text-[12px] text-[var(--dark)]">
                              {fmt(item.min || 1)} / {fmt(item.max || 1000)}
                            </span>
                          </p>
                        </td>
                        <td className="w-[10.9%] border-t border-t-[var(--tbl-border-color)]" />
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
                          onPlaceBet={onPlaceBet}
                          isPlacing={isPlacingActive}
                        />
                        {isPlacingActive && <PlacingBetStrip />}
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

const PlacingBetStrip = memo(function PlacingBetStrip({ durationMs = 5000 }) {
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => {
      const e = Date.now() - start
      setElapsedMs(e)
      if (e >= durationMs) clearInterval(id)
    }, 100)
    return () => clearInterval(id)
  }, [durationMs])

  const progress = Math.min((elapsedMs / durationMs) * 100, 100)
  const remainingSec = Math.max((durationMs - elapsedMs) / 1000, 0).toFixed(1)

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative overflow-hidden flex items-center justify-between h-7 px-3 bg-[var(--xl-light-bg)] text-[var(--dark)]"
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 bg-[var(--xs-green-primary)] transition-[width] duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />
      <span className="relative z-[1] text-[12px] font-medium">
        Placing bet please wait...
      </span>
      <span className="relative z-[1] text-[12px] font-medium tabular-nums">
        {remainingSec} sec remaining
      </span>
    </div>
  )
})

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
            <div key={id} className="md:mb-1 mb-0">
              <h2>
                <button
                  type="button"
                  className="pl-0 flex items-center w-full text-left max-md:bg-[var(--text-color)] max-md:px-0 max-md:pl-[1.8666666667vw] max-md:leading-[8.6vw] max-md:border-b max-md:border-b-[var(--sm-text-color)] max-md:text-white"
                  onClick={() => toggle(id)}
                >
                  <i className="md:mr-1 inline-flex items-center justify-center bg-gradient-to-b from-[var(--xl-blue)] to-[var(--xs-black)] h-[25px] w-[25px] text-center leading-[22px] text-[var(--sm-white)] hover:bg-gradient-to-b hover:from-[var(--xs-black)] hover:to-[var(--xl-blue)] hover:text-[var(--xs-shadow-primary)] [&_svg]:h-[16px] [&_svg]:w-[18px] max-md:rounded-full max-md:h-[6.6666666667vw] max-md:w-[6.6666666667vw] max-md:leading-normal max-md:bg-[var(--xs-dark)] max-md:mr-[1.4vw] max-md:[&_svg]:w-[4.6666666667vw] max-md:[&_svg]:h-[4.6666666667vw]">
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
                            <span className="md:inline-block max-md:hidden" />
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
      width="25"
      height="25"
      viewBox="0 0 25 25"
    >
      <path
        fill="rgb(126,151,167)"
        d="M12.5 25C5.596 25 0 19.404 0 12.5S5.596 0 12.5 0 25 5.596 25 12.5 19.404 25 12.5 25zm0-1C18.85 24 24 18.85 24 12.5S18.85 1 12.5 1 1 6.15 1 12.5 6.15 24 12.5 24zm5.09-12.078c1.606.516 2.41 1.13 2.41 2.19 0 .373-.067.616-.2.73-.135.115-.403.173-.804.173H13.57l-.81 7.988h-.536l-.795-7.988H6.003c-.4 0-.67-.065-.803-.194-.133-.128-.2-.364-.2-.708 0-1.06.804-1.674 2.41-2.19.09 0 .18-.03.27-.086.49-.172.802-.444.936-.816L9.82 5.95v-.216c0-.23-.222-.415-.668-.558l-.067-.043h-.067c-.536-.143-.804-.387-.804-.73 0-.402.09-.652.268-.753.18-.1.49-.15.938-.15h6.16c.447 0 .76.05.938.15.178.1.268.35.268.752 0 .344-.268.588-.804.73h-.067l-.067.044c-.446.143-.67.33-.67.558v.215l1.206 5.07c.134.372.446.644.937.816.09.057.18.086.27.086z"
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
