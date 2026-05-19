import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import LiveStream from '../components/GameDetails/LiveStream.jsx'
import PinRefresh from '../components/GameDetails/PinRefresh.jsx'
import MatchOddMarket from '../components/GameDetails/MatchOddMarket.jsx'
import BookmakerMarket from '../components/GameDetails/BookmakerMarket.jsx'
import FancySection from '../components/GameDetails/FancySection.jsx'
import { http } from '../core/http/client.js'
import { useIsMobile } from '../hooks/useMediaQuery.js'
import {
  DEFAULT_MARKET_ODDS,
  computeVisibleMarkets,
  mergeOddsData,
  normalizeMatchOdds,
} from '../core/utility/market.util.js'
import {
  clearSparkFlags,
  diffMatchOddsForSpark,
} from '../core/utility/odds.util.js'
import { emitSocket, listenSocket, onReconnect } from '../core/socket/client.js'
import { SOCKET_EVENTS } from '../core/socket/events.js'
import {
  getSportIdFromSlug,
  getSportName,
} from '../core/constant/constants.js'
import './game-details.scss'

const EMPTY_EXPOSURE_MAP = new Map()
const SPARK_TTL_MS = 750

export default function GameDetails() {
  const { eventId, sport: sportSlug } = useParams()
  const sportId = getSportIdFromSlug(sportSlug)
  const isMobile = useIsMobile()

  const [rawMarketsData, setRawMarketsData] = useState(DEFAULT_MARKET_ODDS)
  const [marketSettings, setMarketSettings] = useState(null)
  const [liveStreamUrl, setLiveStreamUrl] = useState(null)
  const [scoreIframeUrl, setScoreIframeUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Keyed by marketId so spark detection survives across socket pushes for
  // each match-odds market independently.
  const previousMatchOddsRef = useRef(new Map())
  const sparkClearTimerRef = useRef(null)

  const processMatchOddsList = useCallback((incoming) => {
    if (!Array.isArray(incoming)) return []
    const prevMap = previousMatchOddsRef.current
    const out = incoming.map((market) => {
      const prev = prevMap.get(market?.marketId)
      const sparked = diffMatchOddsForSpark(market, prev)
      prevMap.set(market?.marketId, sparked)
      return sparked
    })
    if (sparkClearTimerRef.current) {
      clearTimeout(sparkClearTimerRef.current)
    }
    sparkClearTimerRef.current = setTimeout(() => {
      setRawMarketsData((prev) => ({
        ...prev,
        match_odds: (prev.match_odds || []).map((m) => clearSparkFlags(m)),
      }))
    }, SPARK_TTL_MS)
    return out
  }, [])

  useEffect(() => {
    const sparkTimerRef = sparkClearTimerRef
    const prevOddsRef = previousMatchOddsRef
    return () => {
      if (sparkTimerRef.current) clearTimeout(sparkTimerRef.current)
      prevOddsRef.current.clear()
    }
  }, [])

  const loadDefaultOdds = useCallback(
    async (signal) => {
      if (!sportId || !eventId) return
      setLoading(true)
      setError(null)
      try {
        const response = await http.post(
          'sport/default-odds',
          { sportId, eventId },
          { signal }
        )
        const payload = response?.data?.data ?? response?.data ?? {}
        previousMatchOddsRef.current.clear()
        setRawMarketsData({
          match_odds: processMatchOddsList(payload.match_odds ?? []),
          bookmaker: payload.bookmaker ?? [],
          fancy: payload.fancy ?? [],
          sportBook: payload.sportBook ?? [],
        })
        setMarketSettings(payload.marketSetting ?? null)
        setLiveStreamUrl(payload.tv ?? null)
        setScoreIframeUrl(payload.iframeScore ?? null)
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED')
          return
        setError(err)
      } finally {
        setLoading(false)
      }
    },
    [sportId, eventId, processMatchOddsList]
  )

  useEffect(() => {
    const controller = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDefaultOdds(controller.signal)
    return () => controller.abort()
  }, [loadDefaultOdds])

  useEffect(() => {
    if (!sportId || !eventId) return undefined

    const payload = { sportId, eventId }
    const subscribe = () => {
      emitSocket(SOCKET_EVENTS.MARKET_ODDS, payload)
      emitSocket(SOCKET_EVENTS.FANCY_BM_ODDS, payload)
      emitSocket(SOCKET_EVENTS.PREMIUM_FANCY_ODDS, payload)
    }
    subscribe()

    const offMatchOdds = listenSocket(SOCKET_EVENTS.MARKET_ODDS, (odds) => {
      if (!odds) return
      const processed = processMatchOddsList(
        Array.isArray(odds) ? odds : [odds],
      )
      setRawMarketsData((prev) =>
        mergeOddsData(prev, { match_odds: processed }),
      )
    })
    const offFancyBm = listenSocket(SOCKET_EVENTS.FANCY_BM_ODDS, (odds) => {
      if (!odds) return
      setRawMarketsData((prev) =>
        mergeOddsData(prev, { bookmaker: odds.bookmaker, fancy: odds.fancy }),
      )
    })
    const offPremium = listenSocket(
      SOCKET_EVENTS.PREMIUM_FANCY_ODDS,
      (odds) => {
        if (!odds) return
        setRawMarketsData((prev) => mergeOddsData(prev, { sportBook: odds }))
      }
    )
    const offAdmin = listenSocket(
      SOCKET_EVENTS.ADMIN_SETTINGS_CHANGED,
      (payloadEvt) => {
        if (!payloadEvt || payloadEvt.eventId !== eventId) return
        setMarketSettings((current) => {
          if (!current) return current
          const sections = ['match_odds', 'bookmaker', 'fancy', 'sportBook']
          const next = { ...current }
          let changed = false
          for (const section of sections) {
            const list = current[section]
            if (!Array.isArray(list)) continue
            let sectionChanged = false
            const updated = list.map((entry) => {
              if (entry.marketId !== payloadEvt.marketId) return entry
              sectionChanged = true
              if (payloadEvt.settingName === 'isSuspended') {
                return { ...entry, isSuspended: payloadEvt.isSuspended }
              }
              if (payloadEvt.settingName === 'isAdvanceRestricted') {
                return {
                  ...entry,
                  isAdvanceRestricted: payloadEvt.isAdvanceRestricted,
                }
              }
              if (payloadEvt.settingName === 'pbuLimit') {
                return { ...entry, pbuLimit: payloadEvt.pbuLimit }
              }
              if (payloadEvt.settingName === 'stakeLimit') {
                return { ...entry, stakeLimit: payloadEvt.stakeLimit }
              }
              return entry
            })
            if (sectionChanged) {
              next[section] = updated
              changed = true
            }
          }
          return changed ? next : current
        })
      }
    )
    const offReconnect = onReconnect(subscribe)

    return () => {
      emitSocket(SOCKET_EVENTS.ODDS_LEAVE, payload)
      offMatchOdds?.()
      offFancyBm?.()
      offPremium?.()
      offAdmin?.()
      offReconnect?.()
    }
  }, [sportId, eventId, processMatchOddsList])

  const matchOddsArray = useMemo(
    () => normalizeMatchOdds(rawMarketsData.match_odds),
    [rawMarketsData.match_odds]
  )
  const isInplay = useMemo(
    () => matchOddsArray.some((mo) => mo.inplay),
    [matchOddsArray]
  )

  const visibleMarkets = useMemo(
    () => computeVisibleMarkets(rawMarketsData),
    [rawMarketsData]
  )

  const matchOddsSettingMap = useMemo(() => {
    const map = new Map()
    for (const market of matchOddsArray) {
      const eventMarket = marketSettings?.match_odds?.find(
        (s) => s.marketId === market.marketId
      )
      map.set(market.marketId, {
        min: eventMarket?.stakeLimit?.min ?? 0,
        max: eventMarket?.stakeLimit?.max ?? 0,
        isSuspended: eventMarket?.isSuspended ?? false,
        pbuLimit: eventMarket?.pbuLimit,
        isAdvanceRestricted: eventMarket?.isAdvanceRestricted,
      })
    }
    return map
  }, [matchOddsArray, marketSettings])

  const bookmakerSetting = useMemo(() => {
    const mid = rawMarketsData.bookmaker?.[0]?.mid
    const matched = marketSettings?.bookmaker?.find((s) => s.marketId === mid)
    return {
      min: matched?.stakeLimit?.min ?? 0,
      max: matched?.stakeLimit?.max ?? 0,
      isSuspended: matched?.isSuspended ?? false,
      sportId: Number(sportId ?? 0),
      eventId: Number(eventId ?? 0),
      pbuLimit: matched?.pbuLimit,
      isAdvanceRestricted: matched?.isAdvanceRestricted,
      isInplay,
    }
  }, [rawMarketsData.bookmaker, marketSettings, sportId, eventId, isInplay])

  const fancySetting = useMemo(() => {
    const f = marketSettings?.fancy?.[0]
    return {
      isSuspended: f?.isSuspended ?? false,
      sportId: Number(sportId ?? 0),
      eventId: Number(eventId ?? 0),
      pbuLimit: f?.pbuLimit,
      isAdvanceRestricted: f?.isAdvanceRestricted,
      isInplay,
    }
  }, [marketSettings, sportId, eventId, isInplay])

  const sportbookSetting = useMemo(() => {
    const sb = marketSettings?.sportBook?.[0]
    return {
      isSuspended: sb?.isSuspended ?? false,
      pbuLimit: sb?.pbuLimit,
      isAdvanceRestricted: sb?.isAdvanceRestricted,
      isInplay,
    }
  }, [marketSettings, isInplay])

  const refreshMarkets = useCallback(() => {
    const controller = new AbortController()
    loadDefaultOdds(controller.signal)
  }, [loadDefaultOdds])

  if (loading && !rawMarketsData.match_odds.length) {
    return <div className="p-4 small text-secondary">Loading market data…</div>
  }

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
  const mobileOddsWrapperOn = isMobile && hasLiveStream
  const scoreSectionClass =
    mobileOddsWrapperOn ? 'mobile-odds-wrapper' : undefined

  return (
    <div className="live-odds-wrapper mt-md-1">
      {/* Top-of-page live streaming (mobile) */}
      {isMobile && hasLiveStream && (
        <div className="mobile-live-streaming">
          <LiveStream
            liveStreamUrl={liveStreamUrl}
            scoreIframeUrl={null}
          />
        </div>
      )}

      {/* Score iframe + pin/refresh — mirrors Angular's mobile-odds-wrapper section */}
      <div className={scoreSectionClass}>
        {isMobile && (
          <div className="blue-header score-game-header d-flex justify-content-between">
            <span className="text-capitalize">{getSportName(sportId)}</span>
            {isInplay && (
              <div className="d-inline-flex align-items-center">
                <i className="time-icon time" aria-hidden="true" />
                <small>In-Play</small>
              </div>
            )}
          </div>
        )}

        {hasScoreboard && (
          <LiveStream
            liveStreamUrl={null}
            scoreIframeUrl={scoreIframeUrl}
          />
        )}

        <PinRefresh onRefresh={refreshMarkets} />
      </div>

      <div className="odds-wrapper d-flex flex-column gap-3">
        {/* Desktop live stream lives inside the match-odds section (parity with
            Angular's `@if (!isMobile() && isAuthenticatedUser())` block). */}
        {!isMobile && hasLiveStream && (
          <LiveStream
            liveStreamUrl={liveStreamUrl}
            scoreIframeUrl={null}
          />
        )}

        {visibleMarkets.match_odds &&
          matchOddsArray.map((odds) => (
            <MatchOddMarket
              key={odds.marketId}
              matchOdds={odds}
              marketSetting={
                matchOddsSettingMap.get(odds.marketId) ?? {
                  min: 0,
                  max: 0,
                  isSuspended: false,
                }
              }
              exposureMap={EMPTY_EXPOSURE_MAP}
            />
          ))}

        {visibleMarkets.bookmaker && (
          <BookmakerMarket
            bookmakerData={rawMarketsData.bookmaker}
            marketSetting={bookmakerSetting}
            exposureMap={EMPTY_EXPOSURE_MAP}
          />
        )}

        {(visibleMarkets.fancy || visibleMarkets.sportBook) && (
          <FancySection
            fancy={rawMarketsData.fancy}
            sportBook={rawMarketsData.sportBook}
            fancySetting={fancySetting}
            sportbookSetting={sportbookSetting}
            visibleMarkets={visibleMarkets}
          />
        )}
      </div>
    </div>
  )
}
