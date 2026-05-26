import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { getSportIdFromSlug, getSportName } from '../core/constant/constants.js'
import { http } from '../core/http/client.js'
import { emitSocket, listenSocket, onReconnect } from '../core/socket/client.js'
import { SOCKET_EVENTS } from '../core/socket/events.js'
import { useIsMobile } from '../hooks/useMediaQuery.js'
import { cx } from '../utils/cx.js'
import {
  selectCurrency,
  selectIsAuthenticated,
  selectIsOneClickBet,
  setLoginWindow,
} from '../store/slices/authSlice.js'
import {
  selectIsPlayLiveStream,
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
  selectNonMatchOddsFancyProgress,
  setFancyProgress,
  clearFancyProgress,
  selectOpenBetRefreshTick,
  selectPlacingSelectionId,
  selectPreExposureMarketName,
  setActiveBetSlip,
  setPreExposure,
} from '../store/slices/betSlipSlice.js'
import BookFancyModal from '../components/GameDetails/BookFancyModal.jsx'
import Modal from '../shared/components/Modal.jsx'
import { alertService, resolveApiMessage } from '../shared/services/alert.js'
import {
  CloseIcon,
  FullscreenIcon,
  PinIcon,
  RefreshIcon,
} from './live-odds/icons.jsx'
import {
  FANCY_TYPES,
  MAIN_FANCY,
  SPORTSBOOK_CATEGORIES,
  isMarketStatusBlocked,
  num,
} from './live-odds/shared.js'
import { MatchOddsSection } from './live-odds/MatchOddsSection.jsx'
import { BookmakerSection } from './live-odds/BookmakerSection.jsx'
import { FancySection, FancyTabHeader } from './live-odds/FancySection.jsx'
import { SportbookSection } from './live-odds/SportbookSection.jsx'

// Re-exported so existing consumers (RacingOdds.jsx) keep their import path.
export { MatchOddsSection } from './live-odds/MatchOddsSection.jsx'

const SPARK_TTL_MS = 750
const PIP_SCROLL_THRESHOLD = 300
const SCROLL_CONTAINER_SELECTOR = '.middle-content'

// Stable empty-map sentinel so the selector returning visibleExposureByMarket
// doesn't allocate a fresh Map per render when the user is logged out.
const EMPTY_EXPOSURE_MAP = new Map()

// ─── Match-odds spark diffing ───────────────────────────────────────────────
// Flags cells whose price changed since the previous socket tick so the
// BACK_SPARK / LAY_SPARK animations fire on those cells.

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

// Patches market-setting records when the admin pushes a settings change
// over the socket. Lookup is per (section, marketId, settingName).
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

export default function LiveOdds() {
  const { t } = useTranslation()
  const { eventId, sport: sportSlug } = useParams()
  const sportId = getSportIdFromSlug(sportSlug)

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isOneClickBet = useSelector(selectIsOneClickBet)
  const oneClickBetStake = useSelector(selectOneClickBetStake)
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const isLiveStreamOn = useSelector(selectIsPlayLiveStream)
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

  const [activeBookmakerRaw, setActiveBookmaker] = useState(null)
  const [activeFancyBetRaw, setActiveFancyBet] = useState(null)
  const [activeSportBookRaw, setActiveSportBook] = useState(null)
  const [bookFancyTarget, setBookFancyTarget] = useState(null)

  const fancyProgressMap = useSelector(
    selectNonMatchOddsFancyProgress,
    shallowEqual
  )
  // When one-click bet is on, no inline place-bet section should be visible —
  // derive the visible values so we don't have to sync local state in an effect.
  const activeBookmaker = isOneClickBet ? null : activeBookmakerRaw
  const activeFancyBet = isOneClickBet ? null : activeFancyBetRaw
  const activeSportBook = isOneClickBet ? null : activeSportBookRaw

  const setFancyProgressFor = useCallback(
    (selectionId, config) =>
      dispatch(setFancyProgress({ selectionId, config })),
    [dispatch]
  )
  const clearFancyProgressFor = useCallback(
    (selectionId) => dispatch(clearFancyProgress(selectionId)),
    [dispatch]
  )

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
        const matchOdds = Array.isArray(payload.match_odds)
          ? payload.match_odds
          : []
        if (!matchOdds.length) {
          alertService.error(
            t('errors.noMarketData', 'No market data available for this game.')
          )
          navigate(-1)
          return
        }
        previousMatchOddsRef.current.clear()
        setMatchOddsList(processMatchOddsList(matchOdds))
        setBookmakerOdds(payload.bookmaker ?? [])
        setFancy(payload.fancy ?? [])
        setPremium(payload.premium ?? payload.sportBook ?? [])
        setMarketSettings(payload.marketSetting ?? null)
        const tvUrl = payload.tv || null
        setLiveStreamUrl(tvUrl)
        setScoreIframeUrl(payload.iframeScore || payload.iframeScoreV2 || null)
        dispatch(setStreamUrlAvailable(!!tvUrl))
        dispatch(setIsPlayLiveStream(!!tvUrl))
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED')
          return
        setError(err)
      } finally {
        dispatch(setMainScreenLoader(false))
      }
    },
    [sportId, eventId, processMatchOddsList, dispatch, navigate, t]
  )

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => loadDefaultOdds(controller.signal))
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

  const visibleExposureByMarket =
    !isAuthenticated || !eventId ? EMPTY_EXPOSURE_MAP : postExposureByMarket

  const fancySelectionId = activeFancyBet?.selectionId
  const fancyMarketId = activeFancyBet?.marketId
  const fancyType = activeFancyBet?.type
  const fancyStake = Number(activeFancyBet?.stake) || 0
  const fancySize = Number(activeFancyBet?.size) || 0
  const sbSelectionId = activeSportBook?.selectionId
  const sbMarketId = activeSportBook?.marketId
  const sbBetType = activeSportBook?.betType ?? activeSportBook?.type
  const sbOdds = Number(activeSportBook?.odds) || 0
  const sbStake = Number(activeSportBook?.stake) || 0
  useEffect(() => {
    if (fancySelectionId && fancyStake > 0 && fancySize > 0) {
      const pnl = Number(((fancySize * fancyStake) / 100).toFixed(2))
      const profit = (fancyType === 'YES' ? 1 : -1) * pnl
      dispatch(
        setPreExposure({
          selectionId: fancySelectionId,
          marketId: fancyMarketId,
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
    fancyMarketId,
    fancyType,
    fancyStake,
    fancySize,
    preExposureMarket,
  ])

  useEffect(() => {
    if (sbSelectionId && sbStake > 0 && sbOdds > 0) {
      const isBack = sbBetType === 'BACK'
      const pnl = Number(((sbOdds * sbStake) / 100).toFixed(2))
      const profit = (isBack ? 1 : -1) * pnl
      const liability = (isBack ? -1 : 1) * sbStake
      dispatch(
        setPreExposure({
          selectionId: sbSelectionId,
          marketId: sbMarketId,
          profit,
          liability,
          betType: sbBetType,
          marketName: 'SPORTS_BOOK',
        })
      )
    } else if (preExposureMarket === 'SPORTS_BOOK') {
      dispatch(setPreExposure(null))
    }
  }, [
    dispatch,
    sbSelectionId,
    sbMarketId,
    sbBetType,
    sbOdds,
    sbStake,
    preExposureMarket,
  ])

  // ── Bookmaker preExposure publication.
  const bmSelectionId = activeBookmaker?.selectionId
  const bmMarketId = activeBookmaker?.marketId
  const bmBetType = activeBookmaker?.betType ?? activeBookmaker?.type
  const bmOdds = Number(activeBookmaker?.odds) || 0
  const bmStake = Number(activeBookmaker?.stake) || 0
  useEffect(() => {
    if (bmSelectionId && bmStake > 0 && bmOdds > 0) {
      const isBack = bmBetType === 'BACK'
      const pnl = Number(((bmOdds * bmStake) / 100).toFixed(2))
      const profit = (isBack ? 1 : -1) * pnl
      const liability = (isBack ? -1 : 1) * bmStake
      dispatch(
        setPreExposure({
          selectionId: bmSelectionId,
          marketId: bmMarketId,
          profit,
          liability,
          betType: bmBetType,
          marketName: 'BOOKMAKER',
        })
      )
    } else if (preExposureMarket === 'BOOKMAKER') {
      dispatch(setPreExposure(null))
    }
  }, [
    dispatch,
    bmSelectionId,
    bmMarketId,
    bmBetType,
    bmOdds,
    bmStake,
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

  const orderedFancyMainTabs = useMemo(() => {
    const active = fancyMainTabs.find((tab) => tab.type === selectedFancy)
    if (!active) return fancyMainTabs
    return [
      active,
      ...fancyMainTabs.filter((tab) => tab.type !== selectedFancy),
    ]
  }, [fancyMainTabs, selectedFancy])

  const [prevFancyMainTabs, setPrevFancyMainTabs] = useState(fancyMainTabs)
  if (prevFancyMainTabs !== fancyMainTabs) {
    setPrevFancyMainTabs(fancyMainTabs)
    if (
      fancyMainTabs.length &&
      !fancyMainTabs.some((tab) => tab.type === selectedFancy)
    ) {
      setSelectedFancy(fancyMainTabs[0].type)
    }
  }

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

  const toggleLiveStream = useCallback(
    () => dispatch(setIsPlayLiveStream(!isLiveStreamOn)),
    [dispatch, isLiveStreamOn]
  )
  const closeLiveStream = useCallback(
    () => dispatch(setIsPlayLiveStream(false)),
    [dispatch]
  )
  const toggleBetLimit = useCallback(() => setBetLimitOpen((v) => !v), [])
  const toggleBookmakerInfo = useCallback(
    () => setBookmakerInfoOpen((v) => !v),
    []
  )

  const cancelMatchOdds = useCallback(
    () => dispatch(setActiveBetSlip(null)),
    [dispatch]
  )

  const updateMatchOddsSlip = useCallback(
    (next) => dispatch(setActiveBetSlip(next)),
    [dispatch]
  )

  // Ref so handlePlaceBet stays stable across socket ticks (it's only read
  // at submit time, not per render).
  const matchOddsListRef = useRef(matchOddsList)
  useEffect(() => {
    matchOddsListRef.current = matchOddsList
  }, [matchOddsList])

  const handlePlaceBet = useCallback(
    (slip) => {
      const list = matchOddsListRef.current
      const context = {
        sport: sportSlug ?? '',
        eventId: String(eventId ?? ''),
        eventTitle: list?.[0]?.eventName || list?.[0]?.eventTitle || '',
        runners: list?.[0]?.runners ?? [],
      }
      return dispatch(placeBet({ slip, context })).unwrap()
    },
    [dispatch, sportSlug, eventId]
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
      const selectionId = slip?.selectionId
      const marketName = slip?.marketName
      const stake = Number(oneClickBetStake)
      setFancyProgressFor(selectionId, {
        progress: true,
        timePeriod: 5000,
        marketName,
      })
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
        .then(() =>
          setFancyProgressFor(selectionId, {
            success: true,
            odd: slip?.odd ?? slip?.odds,
            size: slip?.size,
            timePeriod: 5000,
            marketName,
          })
        )
        .catch((msg) =>
          setFancyProgressFor(selectionId, {
            failed: true,
            errMsg: resolveApiMessage(
              t,
              msg,
              t('errors.placeBetFailed', 'Failed to place bet')
            ),
            timePeriod: 4500,
            marketName,
          })
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
      setFancyProgressFor,
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

    setActiveFancyBet(null)
    setActiveSportBook(null)
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

    setActiveBookmaker(null)
    setActiveSportBook(null)
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
      gtype: 'sportsBook',
      eventId: String(eventId ?? ''),
      selectionId: runner.selectionId,
      runnerId: runner.selectionId,
      runnerName: runner.runnerName,
      betType: 'BACK',
      odds: runner.back[0].price,
      size: null,
      stake: 0,
      min: 1,
      max: 5000,
    }
    if (tryOneClickPlace(slip)) return
    setActiveBookmaker(null)
    setActiveFancyBet(null)
    setActiveSportBook(slip)
  }

  // Predicate every section needs ("is the place-bet API in-flight for this
  // selection?"). Replaces four near-identical inline expressions at the
  // section call sites.
  const isPlacingFor = useCallback(
    (selectionId) =>
      isPlacingBet &&
      String(placingSelectionId) === String(selectionId ?? ''),
    [isPlacingBet, placingSelectionId]
  )

  // Returns the right-side bet slip iff it belongs to this match-odds market;
  // otherwise null. Cleans up the inline ternary on the section's `active` prop.
  const activeMatchOddsFor = (marketId) =>
    activeRightSideBet?.marketName === 'MATCH_ODDS' &&
    activeRightSideBet?.marketId === marketId
      ? activeRightSideBet
      : null

  if (error) {
    return (
      <div className="p-4">
        <p className="mb-2 text-[12px] text-(--red)">
          Failed to load markets: {error?.message || 'Unknown error'}
        </p>
        <button
          type="button"
          className="rounded bg-(--sm-text-color) px-3 py-1 text-[12px] text-white"
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
              <div className="aspect-video w-full max-md:aspect-video" />
            )}
            <div
              className={cx(
                'hover:[&_.close]:opacity-100',
                showPip &&
                  'fixed top-[120px] left-[calc(50%-40px)] z-999 h-auto max-h-[32vw] max-w-[260px] overflow-visible transition-all duration-300 ease-in-out max-md:top-[15.583vw] max-md:right-[1vw] max-md:left-auto max-md:max-w-[54.167vw] max-md:overflow-hidden max-md:rounded-[2vw]'
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
            <div className="mr-0 flex items-center justify-between bg-[linear-gradient(-180deg,var(--xl-blue)_0%,var(--xxl-blue)_82%)] px-3 leading-loose text-white max-md:px-[1.866667vw] max-md:text-[3.7333333333vw]">
              <span className="font-bold capitalize">
                {getSportName(sportId)}
              </span>
              {isInplay && (
                <div className="inline-flex items-center [&_i]:mr-[0.6vw] [&_i]:inline-flex [&_i]:rounded-[0.8vw] [&_i]:bg-linear-to-t [&_i]:from-(--xs-green-primary) [&_i]:via-(--xs-green-primary) [&_i]:to-(--xs-shadow-primary) [&_small]:text-[3.2666666667vw] [&_small]:font-normal">
                  <i aria-hidden="true" />
                  <small>In-Play</small>
                </div>
              )}
            </div>
          )}

          {hasScoreboard && isAuthenticated && (
            <div
              className={cx(
                'bg-[#1e1e1e] pb-0 text-center',
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
              active={activeMatchOddsFor(matchOdds.marketId)}
              onPick={onMatchOddsClick}
              onCancelMatchOdds={cancelMatchOdds}
              onSlipChange={updateMatchOddsSlip}
              onPlaceBet={handlePlaceBet}
              isPlacingActive={isPlacingFor(activeRightSideBet?.selectionId)}
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
              isPlacingActive={isPlacingFor(activeBookmaker?.selectionId)}
              exposureByMarket={visibleExposureByMarket}
              fancyProgressMap={fancyProgressMap}
              onFancyProgressClose={clearFancyProgressFor}
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
                  isPlacingActive={isPlacingFor(activeFancyBet?.selectionId)}
                  exposureData={visibleExposureByMarket.get('0') ?? null}
                  onBookClick={setBookFancyTarget}
                  fancyProgressMap={fancyProgressMap}
                  onFancyProgressClose={clearFancyProgressFor}
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
                  isPlacingActive={isPlacingFor(activeSportBook?.selectionId)}
                  exposureByMarket={visibleExposureByMarket}
                  fancyProgressMap={fancyProgressMap}
                  onFancyProgressClose={clearFancyProgressFor}
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
          <div className="text-[12px] leading-3.75 text-[rgba(var(--dark-blue-rgba),0.9)] max-md:text-[3.46667vw] max-md:leading-[5.86667vw] max-md:break-all max-md:text-[rgba(var(--dark-wheat-rgba),0.8)]">
            <ol className="m-0 list-decimal pl-5 max-md:m-0 max-md:ml-[6.66667vw] max-md:p-0 [&_a]:text-(--blue) [&>li]:mb-1 [&>li>ul]:mt-1 [&>li>ul]:list-none [&>li>ul]:p-0 [&>li>ul]:pl-4">
              <li>
                Once all session/fancy bets are completed and settled there will
                be no reversal even if the Match is Tied or is Abandoned.
              </li>
              <li>
                Advance Session or Player Runs and all Fancy Bets are only valid
                for 20/50 overs full match each side. (Please Note this
                condition is applied only in case of Advance Fancy Bets only).
              </li>
              <li>
                All advance fancy bets market will be suspended 60 mins prior to
                match and will be settled.
              </li>
              <li>
                Under the rules of Session/Fancy Bets if a market gets Suspended
                for any reason whatsoever and does not resume then all previous
                Bets will remain Valid and become HAAR/JEET bets.
              </li>
              <li>
                Incomplete Session/Fancy Bet will be cancelled but Complete
                Session will be settled.
              </li>
              <li>
                In the case of Running Match getting Cancelled/ No Result/
                Abandoned but the session is complete it will still be settled.
                Player runs / fall of wicket will be also settled at the figures
                where match gets stopped due to rain for the inning (D/L),
                cancelled, abandoned, no result.
              </li>
              <li>
                If a player gets Retired Hurt and one ball is completed after
                you place your bets then all the betting till then is and will
                remain valid.
              </li>
              <li>
                Should a Technical Glitch in Software occur, we will not be held
                responsible for any losses.
              </li>
              <li>
                Should there be a power failure or a problem with the Internet
                connection at our end and session/fancy market does not get
                suspended then our decision on the outcome is final.
              </li>
              <li>
                All decisions relating to settlement of wrong market being
                offered will be taken by management. Management will consider
                all actual facts and decision taken will be full in final.
              </li>
              <li>
                Any bets which are deemed of being suspicious, including bets
                which have been placed from the stadium or from a source at the
                stadium maybe voided at anytime. The decision of whether to void
                the particular bet in question or to void the entire market will
                remain at the discretion of Company. The final decision of
                whether bets are suspicious will be taken by Company and that
                decision will be full and final.
              </li>
              <li>
                Any sort of cheating bet, any sort of Matching (Passing of
                funds), Court Siding (Ghaobaazi on commentary), Sharpening,
                Commission making is not allowed in Company. If any company User
                is caught in any of such act then all the funds belonging that
                account would be seized and confiscated. No argument or claim in
                that context would be entertained and the decision made by
                company management will stand as final authority.
              </li>
              <li>
                Fluke hunting/Seeking is prohibited in Company. All the fluke
                bets will be reversed. Cricket commentary is just an additional
                feature and facility for company user but company is not
                responsible for any delay or mistake in commentary.
              </li>
              <li>
                Valid for only 1st inning.
                <ul>
                  <li>
                    • Highest Inning Run: This fancy is valid only for first
                    inning of the match.
                  </li>
                  <li>
                    • Lowest Inning Run: This fancy is valid only for first
                    inning of the match.
                  </li>
                </ul>
              </li>
              <li>
                If any fancy value gets passed, we will settle that market after
                that match gets over. For example: If any market value is
                (22-24) and incase the result is 23 than that market will be
                continued, but if the result is 24 or above then we will settle
                that market. This rule is for the following market.
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
                If any fancy value gets passed, we will settle that market after
                that match gets over. For example: If any market value is
                (22-24) and incase the result is 23 than that market will be
                continued, but if the result is 22 or below then we will settle
                that market. This rule is for the following market.
                <ul>
                  <li>• Lowest Inning Run</li>
                  <li>• Fastest Fifty</li>
                  <li>• Fastest Century</li>
                </ul>
              </li>
              <li>
                If any case wrong rate has been given in fancy, that particular
                bets will be cancelled (Wrong Commentary).
              </li>
              <li>
                In case customer make bets in wrong fancy we are not liable to
                delete, no changes will be made and bets will be considered as
                confirm bet.
              </li>
              <li>
                Dot Ball Market Rules
                <ul>
                  <li>Wides Ball - Not Count</li>
                  <li>No Ball - Not Count</li>
                  <li>Leg Bye - Not Count as A Dot Ball</li>
                  <li>Bye Run - Not Count as A Dot Ball</li>
                  <li>Run Out - On 1st Run Count as A Dot Ball</li>
                  <li>Run Out - On 2nd n 3rd Run Not Count as a Dot Ball</li>
                  <li>
                    Out - Catch Out, Bowled, Stumped n LBW Count as A Dot Ball
                  </li>
                </ul>
              </li>
              <li>
                Bookmaker Rules
                <ul>
                  <li>
                    • Due to any reason any team will be getting advantage or
                    disadvantage we are not concerned.
                  </li>
                  <li>
                    • We will simply compare both teams 25 overs score higher
                    score team will be declared winner in ODI.
                  </li>
                  <li>
                    • We will simply compare both teams 10 overs higher score
                    team will be declared winner in T20 matches.
                  </li>
                </ul>
              </li>
              <li>
                Penalty Runs - Any Penalty Runs Awarded in the Match (In Any
                Running Fancy or ADV Fancy) Will Not be Counted While Settling
                in our Exchange.
              </li>
              <li>
                LIVE STREAMING OF ALL VIRTUAL CRICKET MATCHES IS AVAILABLE HERE{' '}
                <a
                  className="break-all underline"
                  href="https://www.youtube.com/channel/UCd837ZyyiO5KAPDXibynq_Q/featured"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  https://www.youtube.com/channel/UCd837ZyyiO5KAPDXibynq_Q/featured
                </a>
              </li>
              <li>
                CHECK SCORE OF VIRTUAL CRICKET ON{' '}
                <a
                  className="break-all underline"
                  href="https://sportcenter.sir.sportradar.com/simulated-reality/cricket"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  https://sportcenter.sir.sportradar.com/simulated-reality/cricket
                </a>
              </li>
              <li>
                Comparison Market
                <ul>
                  <li>
                    In Comparison Market We Don&apos;t Consider Tie or Equal
                    Runs on Both the Innings While Settling. Second Batting Team
                    Must need to Surpass 1st Batting&apos;s team Total to win
                    otherwise on Equal Score or Below We declare 1st Batting
                    Team as Winner.
                  </li>
                </ul>
              </li>
              <li>
                If match is abandoned or over reduced. This rule is for the
                following market (ENTIRE IPL 2020)
                <ul>
                  <li>
                    • Total Fours: Average 27 fours will be given if the match
                    is abandoned or over reduced.
                  </li>
                  <li>
                    • Total Sixes: Average 11 sixes will be given if the match
                    is abandoned or over reduced.
                  </li>
                  <li>
                    • Total Caught &amp; Bowled Out: Average 0 Caught &amp;
                    Bowled Out will be given if the match is abandoned or over
                    reduced.
                  </li>
                  <li>
                    • Total Wide: Average 8 wides will be given if the match is
                    abandoned or over reduced.
                  </li>
                  <li>
                    • Total Extra: Average 14 extras will be given if the match
                    is abandoned or over reduced.
                  </li>
                  <li>
                    • Total No Ball: Average 1 no ball will be given if the
                    match is abandoned or over reduced.
                  </li>
                  <li>
                    • Total duck: Average 1 duck will be given if the match is
                    abandoned or over reduced.
                  </li>
                  <li>
                    • Total Fifties: Average 2 fifties will be given if the
                    match is abandoned or over reduced.
                  </li>
                  <li>
                    • Total Century: Average 0 century will be given if the
                    match is abandoned or over reduced.
                  </li>
                  <li>
                    • Total Run Out: Average 1 run out will be given if the
                    match is abandoned or over reduced.
                  </li>
                  <li>
                    • Total Caught out: Average 8 caught out will be given if
                    the match is abandoned or over reduced.
                  </li>
                  <li>
                    • Total Stump Out: Average 0 stump out will be given if the
                    match is abandoned or over reduced.
                  </li>
                  <li>
                    • Total Maiden Over: Average 0 maiden over will be given if
                    the match is abandoned or over reduced.
                  </li>
                  <li>
                    • Total LBW: Average 1 LBW will be given if the match is
                    abandoned or over reduced.
                  </li>
                  <li>
                    • Total Bowled: Average 2 bowled will be given if the match
                    is abandoned or over reduced.
                  </li>
                </ul>
              </li>
              <li>Player Boundaries Fancy: Both Four and six are valid.</li>
              <li>
                BOWLER RUN SESSION RULE:
                <ul>
                  <li>
                    IF BOWLER BOWL 1.1 OVER, THEN VALID (FOR BOWLER 2 OVER RUNS
                    SESSION)
                  </li>
                  <li>
                    IF BOWLER BOWL 2.1 OVER, THEN VALID (FOR BOWLER 3 OVER RUNS
                    SESSION)
                  </li>
                  <li>
                    IF BOWLER BOWL 3.1 OVER, THEN VALID (FOR BOWLER 4 OVER RUNS
                    SESSION)
                  </li>
                  <li>
                    IF BOWLER BOWL 4.1 OVER, THEN VALID (FOR BOWLER 5 OVER RUNS
                    SESSION)
                  </li>
                  <li>
                    IF BOWLER BOWL 9.1 OVER, THEN VALID (FOR BOWLER 10 OVER RUNS
                    SESSION)
                  </li>
                </ul>
              </li>
              <li>
                Total Match Playing Over ADV: We Will Settle this Market after
                Whole Match gets Completed
                <ul>
                  <li>
                    Criteria: We Will Count Only Round-Off Over For Both the
                    Innings While Settling (For Ex: If 1st Batting team gets all
                    out at 17.3, 18.4 or 19.5 we Will Count Such Overs as 17, 18
                    and 19 Respectively and if Match gets Ended at 17.2, 18.3 or
                    19.3 Overs then we will Count that as 17, 18 and 19 Over
                    Respectively, and this Will Remain Same For Both the
                    Innings.
                  </li>
                  <li>
                    In Case Of Rain or if Over gets Reduced then this Market
                    will get Voided.
                  </li>
                </ul>
              </li>
              <li>
                3 WKT OR MORE BY BOWLER IN MATCH ADV:
                <ul>
                  <li>
                    We Will Settle this Market after Whole Match gets Completed.
                  </li>
                  <li>
                    In Case Of Rain or if Over Gets Reduced then this Market
                    Will get Voided.
                  </li>
                </ul>
              </li>
            </ol>
          </div>
        </div>

        <div className="mt-4 max-md:mt-[1.86667vw]">
          <button
            type="button"
            onClick={() => setIsFancyRulesOpen(false)}
            className="block w-full rounded border border-(--xxl-gray) bg-[linear-gradient(-180deg,var(--white)_0%,var(--xs-gray)_89%)] py-1.5 font-bold text-(--dark) uppercase hover:bg-[linear-gradient(-180deg,var(--xs-gray)_0%,var(--white)_89%)] max-md:rounded-[1.6vw] max-md:py-[2.6vw] max-md:text-[4vw]"
          >
            {t('common.ok', 'OK')}
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ── Small components used only by LiveOdds itself ──────────────────────────
// PinRefresh is re-exported because RacingOdds.jsx imports it from this file.

export const PinRefresh = memo(function PinRefresh({ onRefresh }) {
  const baseDiv =
    'text-white font-bold z-[1] min-w-[90px] flex justify-center items-center h-[25px] leading-[20px] relative max-md:px-3 max-md:py-[6px] max-md:h-[7.46667vw] max-md:leading-tight max-md:text-[3.2vw] max-md:min-w-[25.5vw] [&_i_svg]:h-[14px] [&_i_svg]:w-[14px] max-md:[&_i_svg]:h-[3.73333vw] max-md:[&_i_svg]:w-[3.73333vw] mobile:[&_span]:hidden'

  const firstDiv = `${baseDiv} bg-(--text-xl-color) rounded-bl-[10px] max-md:bg-gradient-to-t max-md:from-(--xls-navy) max-md:to-(--xts-light-bg) max-md:w-[25.5vw] max-md:rounded-bl-[3vw] before:content-[''] before:absolute before:left-[-3px] before:w-[19px] before:bg-(--text-xl-color) before:top-[-4px] before:bottom-[1px] before:-z-[1] before:[transform:rotate(-22deg)] before:rounded-bl-[10px] max-md:before:[transform:rotate(-16deg)] max-md:before:bg-gradient-to-t max-md:before:from-(--xs-navy) max-md:before:to-(--xts-md-bg) max-md:before:rounded-bl-[3vw]`

  const secondDiv = `${baseDiv} bg-(--text-xl-color) shadow-[1px_0_0_0_rgba(255,255,255,0.3)_inset] rounded-br-[10px] max-md:bg-gradient-to-t max-md:from-(--xls-navy) max-md:to-(--xts-light-bg) max-md:rounded-br-[3vw] max-md:border-l-[0.53333vw] max-md:border-l-[rgba(22,40,49,0.9)] after:content-[''] after:absolute after:right-[-3px] after:w-[19px] after:bg-(--text-xl-color) after:top-[-4px] after:bottom-[1px] after:-z-[1] after:rounded-br-[10px] after:[transform:rotate(22deg)] max-md:after:[transform:rotate(16deg)] max-md:after:bg-gradient-to-t max-md:after:from-(--xs-navy) max-md:after:to-(--xts-md-bg) max-md:after:rounded-br-[3vw]`

  return (
    <div className="mt-px overflow-hidden bg-white text-center max-md:mt-0 max-md:bg-(--light-bg)">
      <div className="relative inline-flex cursor-pointer items-center">
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
    <div className="relative mx-auto max-w-[500px] pb-0 text-center max-md:max-w-full max-md:overflow-hidden md:mb-3 md:p-2">
      <iframe
        ref={iframeRef}
        className={cx(
          'mx-auto block aspect-video h-auto',
          isPip
            ? 'max-w-[260px] max-md:h-[32vw] max-md:max-w-[54.167vw]'
            : 'max-w-[480px] max-md:w-full max-md:max-w-full'
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
              'close z-999 flex h-[35px] w-[50px] cursor-pointer items-center justify-center rounded-md border border-(--xxl-gray) bg-black/50 text-white hover:bg-black/60 max-md:h-[8.33333vw] max-md:w-[8.33333vw] [&_svg]:h-[14px] [&_svg]:w-[14px] max-md:[&_svg]:h-[2.73333vw] max-md:[&_svg]:w-[2.73333vw]',
              isPip &&
                'h-[15px]! w-[15px]! rounded-full! max-md:h-[3.125vw]! max-md:w-[3.125vw]!'
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
          className="absolute right-[18px] bottom-[8px] cursor-pointer max-md:right-[16px]"
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
