import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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

import './live-odds.scss'

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
        <p className="small text-danger mb-2">
          Failed to load markets: {error?.message || 'Unknown error'}
        </p>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
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
    <div className="live-odds-wrapper-container">
      <div
        className={cx(
          'live-odds-wrapper mt-md-1',
          isYellowTheme && 'yellow-theme'
        )}
      >
        {isMobile && showStream && (
          <>
            {showPip && <div className="mobile-live-streaming pip-spacer" />}
            <div className={cx('mobile-live-streaming', showPip && 'tv-url')}>
              <LiveStream
                url={liveStreamUrl}
                iframeRef={iframeRef}
                onClose={closeLiveStream}
                onFullscreen={toggleFullscreen}
                hideClose={isMobile}
              />
            </div>
          </>
        )}

        <div className={cx(isMobile && showStream && 'mobile-odds-wrapper')}>
          {isMobile && (
            <div className="blue-header score-game-header d-flex justify-content-between align-items-center px-3">
              <span className="text-capitalize">{getSportName(sportId)}</span>
              {isInplay && (
                <div className="d-inline-flex align-items-center">
                  <i className="time-icon" aria-hidden="true" />
                  <small>In-Play</small>
                </div>
              )}
            </div>
          )}

          {hasScoreboard && isAuthenticated && (
            <div
              className={cx(
                'score-iframe-wrapper text-center pb-0',
                isMobile && 'mobile-score-iframe-wrapper'
              )}
            >
              <iframe
                className="score-iframe d-block"
                src={scoreIframeUrl}
                width="100%"
                height="100%"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;"
                allowFullScreen
                title="Scoreboard"
              />
            </div>
          )}

          <PinRefresh onRefresh={refreshMarkets} />
        </div>
        <div className="odds-wrapper">
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
            <div className="fancy-bet-wrapper mt-4">
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
  return (
    <div className="text-center overflow-hidden pin-refresh-section-wrapper">
      <div className="d-inline-flex align-items-center pin-refresh-section cursor-pointer">
        <div>
          <PinIcon />
          <span>Pin</span>
        </div>
        <div onClick={onRefresh} role="button">
          <RefreshIcon />
          <span>Refresh</span>
        </div>
      </div>
    </div>
  )
}

function LiveStream({ url, iframeRef, onClose, onFullscreen, hideClose }) {
  if (!url) return null
  return (
    <div className="live-streaming-wrapper text-center mb-md-3 p-md-2 pb-0">
      <iframe
        ref={iframeRef}
        className="live-streaming"
        src={url}
        width="100%"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;"
        allowFullScreen
        title="Live stream"
      />
      {!hideClose && (
        <div className="close-icon-wrapper">
          <i
            className="cursor-pointer close"
            onClick={onClose}
            role="button"
            aria-label="Close"
          >
            <CloseIcon />
          </i>
        </div>
      )}
      <div>
        <i
          className="cursor-pointer fullscreen"
          onClick={onFullscreen}
          role="button"
          aria-label="Fullscreen"
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
  if (!matchOdds) return null
  const totalMatched = num(matchOdds.totalMatched)
  const minMaxStr = `${fmt(marketSetting.min || 1)} / ${fmt(marketSetting.max || 100)}`

  return (
    <div className="match-odds-wrapper">
      <div className="row g-0 mx-0 gr-2 justify-content-between align-items-center flex-wrap position-relative">
        <div className="col-12">
          <div className="market-type d-flex justify-content-between position-relative">
            <div>
              <span
                className={cx(
                  'match-odds-tab',
                  isYellowTheme && 'yellow-match-odds-tab'
                )}
              >
                Match Odds
              </span>
              {!isMobile && (
                <span className={matchOdds.inplay ? 'inplay' : 'not-inplay'}>
                  <i className="time" />
                  <span className="d-inline-block ms-1 align-middle">
                    {matchOdds.inplay
                      ? 'In-Play'
                      : fmtDate(matchOdds.marketStartTime)}
                  </span>
                </span>
              )}
            </div>
            {!isMobile && (
              <>
                <div className="d-flex text-black min-max-odds">
                  <p className="mb-0">Min/ Max</p>
                  <p className="mb-0 ms-1">
                    <small>{minMaxStr}</small>
                  </p>
                </div>
                <div className="d-flex">
                  <div className="matched d-flex">
                    <p className="m-0">Matched</p>
                    <span className="ms-1">{currency || 'PBU'}</span>
                    <span className="ms-1 me-2">{fmt(totalMatched)}</span>
                  </div>
                  {isAuthenticated && isStreamAvailable && (
                    <div>
                      <button
                        type="button"
                        className={cx(
                          'btn btn-live',
                          !isLiveStreamOn && 'btn-live-close'
                        )}
                        onClick={onToggleLive}
                      >
                        Live
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

      <div className="match-odds table-responsive">
        <table className="match-odds-table w-100">
          <thead>
            <tr>
              {isMobile ? (
                <>
                  <th className="text-start w-nowrap">
                    <div className="mb-data">
                      <div className="bet-limit">
                        <InfoIcon onClick={onToggleBetLimit} />
                        {betLimitOpen && (
                          <div className="fancy_info-popup max">
                            <div>
                              <p>Max</p>
                              <span>{fmt(marketSetting.max || 100)}</span>
                            </div>
                            <i
                              className="close-icon"
                              onClick={onToggleBetLimit}
                              role="button"
                            >
                              <CloseIcon />
                            </i>
                          </div>
                        )}
                      </div>
                      <i className="a-depth" />
                      <div className="content">
                        <p className="mb-0">Matched</p>
                        <span>{currency || 'PBU'}</span>{' '}
                        <span>{fmt(totalMatched)}</span>
                      </div>
                    </div>
                  </th>
                  <th>Back</th>
                  <th>Lay</th>
                </>
              ) : (
                <>
                  <th className="text-start w-nowrap refer_only ps-1">
                    {matchOdds.numberOfRunners ??
                      matchOdds.runners?.length ??
                      0}{' '}
                    Selection
                  </th>
                  <th colSpan={3} className="text-start">
                    101%
                  </th>
                  <th colSpan={3} className="text-end">
                    99.6%
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {(matchOdds.runners ?? []).map((runner) => {
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
                ? ['blue-xs']
                : ['blue-xxs', 'blue-md', 'blue-xs']
              const layClasses = isMobile
                ? ['red-xs']
                : ['red-xs', 'red-md', 'red-xxs']

              return (
                <Fragment key={runner.selectionId}>
                  <tr>
                    <td className="runner w-nowrap">
                      <div className="d-flex flex-column">
                        <p className="mb-1 runner-name">
                          <i className="chart" />
                          {runner.runnerName || runner.runner}
                        </p>
                        <div className="d-flex align-items-center">
                          {/* bet-exposure slot (Angular: <app-bet-exposure />) */}
                        </div>
                      </div>
                    </td>
                    {/* BACK columns — Angular: @for back of matchOdd.back; classes blue-xxs/blue-md/blue-xs */}
                    {backCells.map((cell, idx) => {
                      const price = cell?.price
                      const klass = backClasses[idx]
                      // Active highlight follows Angular: only the best-back cell (blue-xs)
                      // shows the active state when this runner has an active BACK bet.
                      const isActive =
                        klass === 'blue-xs' &&
                        active?.selectionId === runner.selectionId &&
                        active?.betType === 'BACK'
                      return (
                        <td
                          key={`b-${idx}`}
                          className={cx(
                            'price',
                            klass,
                            cell?.isChanged && 'back-spark',
                            bgLine(price) && 'bg-line',
                            isActive && 'active'
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
                      const klass = layClasses[idx]
                      const isActive =
                        klass === 'red-xs' &&
                        active?.selectionId === runner.selectionId &&
                        active?.betType === 'LAY'
                      return (
                        <td
                          key={`l-${idx}`}
                          className={cx(
                            'suspend-hover price',
                            klass,
                            cell?.isChanged && 'lay-spark',
                            bgLine(price) && 'bg-line',
                            isActive && 'active'
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
                      <td colSpan={3} className="p-0 inline-betslip-host">
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

  return (
    <div className="bookmaker-wrapper">
      <div className="match-header">
        <div className="d-flex align-items-center justify-content-center">
          <span className="icon-wrapper">
            <i>
              <PinSvg />
            </i>
          </span>
          <span className="head d-inline-block">
            Bookmaker Market
            <small>| Zero Commission</small>
          </span>
        </div>

        {!isMobile ? (
          <div className="d-flex align-items-center justify-content-center min-max-details">
            <span className="chip">Min</span>
            <span className="d-inline-block ms-1 text-white">
              {fmt(setting.min || 1)}
            </span>
            <span className="chip ms-2 d-inline-block">Max</span>
            <span className="d-inline-block ms-1 text-white">
              {fmt(setting.max || 10000)}
            </span>
          </div>
        ) : (
          <span className="warning-wrapper position-relative px-md-2">
            <i onClick={onToggleInfo} role="button" aria-label="Info">
              <WarningSvg />
            </i>
            {infoOpen && (
              <div className="fancy_info-popup">
                <div className="flex-fill d-flex flex-column">
                  <p>Min / Max</p>
                  <span>
                    {fmt(setting.min || 1)} / {fmt(setting.max || 1000)}
                  </span>
                </div>
                <i
                  className="close-icon"
                  onClick={onToggleInfo}
                  role="button"
                  aria-label="Close"
                >
                  <CloseIcon />
                </i>
              </div>
            )}
          </span>
        )}
      </div>

      <div className="bookmaker-market mb-4">
        <table className="bookmaker-table w-100">
          <thead>
            <tr>
              <th />
              <th colSpan={isMobile ? 1 : 2} />
              {!isMobile && (
                <>
                  <th />
                  <th />
                  <th />
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {normalized.map((bookmaker) => {
              // The "Suspended" overlay only shows for real status blocks
              // (SUSPENDED / BALL RUNNING) or an admin-level setting suspend.
              // The Angular price-over-odd check (BOOKMAKER_ODD = 99) gets in the way
              // for legitimate bookmaker odds in the 100–250 range that the feed
              // delivers as ACTIVE — so individual cells stay fully clickable here.
              const isStatusBlocked = isBookmakerStatusBlocked(bookmaker.status)
              const isSuspended = setting.isSuspended || isStatusBlocked
              const isInlineBookmaker =
                active?.selectionId === bookmaker.selectionId && !isSuspended
              const statusLabel = titleCase(
                setting.isSuspended ? 'Suspended' : bookmaker.status || ''
              )

              return (
                <Fragment key={bookmaker.selectionId}>
                  <tr>
                    <td className="runner-name-td">
                      <div className="d-flex flex-column">
                        <span className="runner-name">
                          {bookmaker.runnerName}
                        </span>
                        <div className="d-flex align-items-center">
                          {/* bet-exposure slot (Angular: <app-bet-exposure />) */}
                        </div>
                      </div>
                    </td>
                    <td
                      colSpan={isMobile ? 1 : 5}
                      className="p-0 bookmaker-full-td"
                    >
                      <table className="status-table" align="right">
                        <tbody>
                          <tr>
                            {/* BACK — iterates bookmaker.back; mobile shows only $index === 2 */}
                            {bookmaker.back.map((backCell, i) => {
                              if (isMobile && i !== 2) return null
                              const klass = cx(
                                i === 2 && 'blue-xs',
                                i === 1 && 'blue-md',
                                i === 0 && 'blue-xxs',
                                isInlineBookmaker &&
                                  active?.betType === 'BACK' &&
                                  'active'
                              )
                              return (
                                <td
                                  key={`back-${i}`}
                                  className={cx('price', klass)}
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
                              const klass = cx(
                                i === 0 && 'red-xs',
                                i === 1 && 'red-md',
                                i === 2 && 'red-xxs',
                                isInlineBookmaker &&
                                  active?.betType === 'LAY' &&
                                  'active'
                              )
                              return (
                                <td
                                  key={`lay-${i}`}
                                  className={cx('price', klass)}
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
                              <td colSpan={6} className="suspend-hover-class">
                                <div className="game-status">{statusLabel}</div>
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

function FancyTabHeader({ tabs, selectedFancy, onSelect, isMobile }) {
  return (
    <div
      className={cx(
        'fancy-bet-header',
        selectedFancy === MAIN_FANCY.SPORTS_BOOK && 'orange'
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.type === selectedFancy
        return (
          <div
            key={tab.type}
            className={cx(
              'fancy-bet-chip cursor-pointer position-relative',
              isActive && 'active',
              selectedFancy === MAIN_FANCY.SPORTS_BOOK &&
                tab.type === MAIN_FANCY.SPORTS_BOOK &&
                'premium'
            )}
            onClick={() => onSelect(tab.type)}
            role="button"
          >
            {tab.type === MAIN_FANCY.SPORTS_BOOK && !isActive && (
              <p className="live-chip">
                <span className="number">New</span>
              </p>
            )}
            <div
              className={cx(
                'd-flex align-items-center inner-bg',
                tab.type === MAIN_FANCY.SPORTS_BOOK && 'premium'
              )}
            >
              {isMobile && tab.type !== MAIN_FANCY.SPORTS_BOOK && (
                <i className="pin-icon">
                  <PinSvg />
                </i>
              )}
              <i className="time-icon">
                <TimeSvg />
              </i>
              <span className="d-inline-block align-middle">{tab.title}</span>
            </div>
            {isActive && <i className="que-icon" />}
          </div>
        )
      })}
      {selectedFancy === MAIN_FANCY.SPORTS_BOOK && (
        <p className="text-black mb-0 min-chips">
          <i>
            <WarningSvg />
          </i>
          <span>Min</span>
        </p>
      )}
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
  if (!items.length) {
    return (
      <div className="text-center p-3 text-secondary small bg-white">
        No fancy markets
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
      <div className="fancy-priority-container">
        <div className="tabs-wrapper fancy">
          <ul className="ps-0 mb-0">
            {availableTabs.map((tab) => (
              <li
                key={tab.type}
                className={cx(
                  'text-center',
                  selectedType === tab.type && 'active'
                )}
                onClick={() => onSelectType(tab.type)}
              >
                <a>{tab.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {!isMobile && (
        <div className="match-header pe-3">
          <div className="d-flex align-items-center justify-content-center">
            <span className="icon-wrapper">
              <i>
                <PinSvg />
              </i>
            </span>
            <span className="head d-inline-block ms-2">Fancy Bet</span>
          </div>
        </div>
      )}

      <div className="fancy-bet overflow-auto">
        <table className="fancy-bet-table w-100">
          <thead>
            <tr>
              <th />
              <th>No</th>
              <th>Yes</th>
              {!isMobile && (
                <>
                  <th />
                  <th className="lg-none" />
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
                    <tr className="mobile-fancy-runner">
                      <td colSpan={3}>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="mobile-runner-name">
                            {item.RunnerName}
                          </span>
                          <span className="warning-wrapper px-md-2 position-relative">
                            <i
                              onClick={() =>
                                setFancyInfoIndex(fancyInfoIndex === i ? -1 : i)
                              }
                              role="button"
                              aria-label="Info"
                            >
                              <WarningSvg />
                            </i>
                            {fancyInfoIndex === i && (
                              <div className="fancy_info-popup">
                                <div className="flex-fill d-flex flex-column">
                                  <p>Min / Max</p>
                                  <span>
                                    {fmt(item.min || 1)} /{' '}
                                    {fmt(item.max || 1000)}
                                  </span>
                                </div>
                                <i
                                  className="close-icon"
                                  onClick={() => setFancyInfoIndex(-1)}
                                  role="button"
                                  aria-label="Close"
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
                  <tr>
                    <td>
                      {!isMobile && (
                        <div>
                          <span className="runner-name">{item.RunnerName}</span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between">
                        {/* bet-exposure slot (Angular: <app-bet-exposure />) */}
                        {/* Book button slot — rendered when an exposure entry matches this selection */}
                      </div>
                    </td>
                    <td
                      colSpan={2}
                      className={cx(
                        'p-0',
                        item.GameStatus && 'game-status-active'
                      )}
                    >
                      {item.GameStatus && (
                        <div className="game-status">
                          {item.GameStatus === 'SUSPENDED'
                            ? 'Suspended'
                            : item.GameStatus}
                        </div>
                      )}
                      <table className="status-table">
                        <tbody>
                          <tr>
                            <td
                              className={cx(
                                'red-xs price',
                                isInline && active?.betType === 'NO' && 'active'
                              )}
                              onClick={() =>
                                onFancyClickWrapper(onPick, item, 'NO')
                              }
                            >
                              <p className="m-0">{item.LayPrice1 || ''}</p>
                              <small>
                                {!isSuspended && item.LaySize1
                                  ? item.LaySize1
                                  : ''}
                              </small>
                            </td>
                            <td
                              className={cx(
                                'blue-xs price',
                                isInline &&
                                  active?.betType === 'YES' &&
                                  'active'
                              )}
                              onClick={() =>
                                onFancyClickWrapper(onPick, item, 'YES')
                              }
                            >
                              <p className="m-0">{item.BackPrice1 || ''}</p>
                              <small>
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
                        <td>
                          <p className="mb-0 min-max">
                            Min/Max
                            <span className="min-max-value">
                              {fmt(item.min || 1)} / {fmt(item.max || 1000)}
                            </span>
                          </p>
                        </td>
                        <td className="lg-none" />
                      </>
                    )}
                  </tr>
                  {isInline && (
                    <tr>
                      <td
                        colSpan={isMobile ? 3 : 5}
                        className="p-0 inline-betslip-host"
                      >
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

function onFancyClickWrapper(onPick, item, type) {
  onPick(item, type)
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
      <div className="text-center p-3 text-secondary small bg-white">
        No sportsbook markets
      </div>
    )
  }

  return (
    <>
      <div className="fancy-priority-container">
        <div className="tabs-wrapper sport-book">
          <ul className="ps-0 mb-0">
            {SPORTSBOOK_TABS.map((tab) => (
              <li
                key={tab.type}
                className={cx(selectedCategory === tab.type && 'active')}
                onClick={() => onSelectCategory(tab.type)}
              >
                <a>{tab.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="sport-book-main accordion">
        {markets.map((market, i) => {
          if (!market.runners?.length) return null
          const id = market.marketId || `mkt-${i}`
          const isCollapsed =
            collapsed[id] === undefined ? i > 5 : collapsed[id]
          return (
            <div key={id} className="accordion-item mb-md-1 mb-0">
              <h2 className="accordion-header">
                <button
                  type="button"
                  className={cx('accordion-button', isCollapsed && 'collapsed')}
                  onClick={() => toggle(id)}
                >
                  <i className="icon-wrapper me-md-1">
                    <PinSvg />
                  </i>
                  <span>{market.market}</span>
                </button>
              </h2>
              {!isCollapsed && (
                <div className="sport-book-row d-flex flex-wrap">
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
                            'sport-book-list',
                            isSuspended && 'suspended'
                          )}
                          onClick={() => !isSuspended && onPick(market, runner)}
                          role="button"
                        >
                          <p className="m-0 runner-name">
                            <span className="fw-bold">
                              {titleCase(runner.runnerName)}
                            </span>
                            {/* bet-exposure slot */}
                          </p>
                          <div className="d-flex align-items-center runner-data">
                            <span
                              className={cx(
                                'green-xs ball-running position-relative cursor-pointer',
                                isActive && 'active'
                              )}
                            >
                              {isSuspended && (
                                <div className="suspended-row">Suspended</div>
                              )}
                              <b>{runner.back?.[0]?.price || ''}</b>
                            </span>
                            <span className="empty d-none d-md-inline-block" />
                          </div>
                        </div>
                        {isActive && (
                          <div className="inline-betslip-host w-100">
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
    >
      <g fill="none" fill-rule="evenodd" transform="">
        <circle
          cx="12.5"
          cy="12.5"
          fill="#7e97a7"
          fill-rule="evenodd"
          r="12.5"
        ></circle>
        <circle cx="12.5" cy="12.5" r="12" stroke="#7e97a7"></circle>
        <path
          d="m8 14h6v2h-6v3l-4-4 4-4zm9 0v-3h-6v-2h6v-3l4 4z"
          fill="#e0e6e6"
          fill-rule="nonzero"
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
