import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { emitSocket, listenSocket, onReconnect } from '../core/socket/client.js'
import { SOCKET_EVENTS } from '../core/socket/events.js'
import { getSportName } from '../core/constant/constants.js'

const EMPTY_EXPOSURE_MAP = new Map()

export default function GameDetails() {
  const { sportId, eventId } = useParams()
  const isMobile = useIsMobile()

  const [rawMarketsData, setRawMarketsData] = useState(DEFAULT_MARKET_ODDS)
  const [marketSettings, setMarketSettings] = useState(null)
  const [liveStreamUrl, setLiveStreamUrl] = useState(null)
  const [scoreIframeUrl, setScoreIframeUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
        setRawMarketsData({
          match_odds: payload.match_odds ?? [],
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
    [sportId, eventId]
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
      setRawMarketsData((prev) => mergeOddsData(prev, { match_odds: odds }))
    })
    const offFancyBm = listenSocket(SOCKET_EVENTS.FANCY_BM_ODDS, (odds) => {
      if (!odds) return
      setRawMarketsData((prev) =>
        mergeOddsData(prev, { bookmaker: odds.bookmaker, fancy: odds.fancy })
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
  }, [sportId, eventId])

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

  return (
    <div className="live-odds-wrapper mt-md-1">
      <LiveStream
        liveStreamUrl={liveStreamUrl}
        scoreIframeUrl={scoreIframeUrl}
      />

      {isMobile && (
        <div className="d-flex justify-content-between align-items-center p-1 inplay-live-box">
          <h6 className="mb-0 p-1 fs-14 text-capitalize">
            {getSportName(sportId)}
          </h6>
          {isInplay && (
            <span className="inplay">
              <i className="time" />
              <span className="d-inline-block align-middle fs-14">
                {' '}
                In-Play
              </span>
            </span>
          )}
        </div>
      )}

      <PinRefresh onRefresh={refreshMarkets} />

      <div className="odds-wrapper d-flex flex-column gap-3">
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
