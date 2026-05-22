import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { http } from '../core/http/client.js'
import { emitSocket, listenSocket, onReconnect } from '../core/socket/client.js'
import { SOCKET_EVENTS } from '../core/socket/events.js'
import {
  getSportIdFromSlug,
  isRacingSport,
} from '../core/constant/constants.js'
import { useIsMobile } from '../hooks/useMediaQuery.js'
import {
  selectCurrency,
  selectIsAuthenticated,
  selectIsOneClickBet,
  setLoginWindow,
} from '../store/slices/authSlice.js'
import {
  selectIsYellowTheme,
  setMainScreenLoader,
} from '../store/slices/commonSlice.js'
import {
  placeBet,
  selectActiveBetSlip,
  selectIsPlacingBet,
  selectOneClickBetStake,
  selectOpenBetRefreshTick,
  selectPlacingSelectionId,
  setActiveBetSlip,
} from '../store/slices/betSlipSlice.js'
import { alertService } from '../shared/services/alert.js'
import { MatchOddsSection, PinRefresh } from './LiveOdds.jsx'

// Treat empty {} / null / undefined / no-runners response as "no market data".
function isEmptyMatchOdds(md) {
  return (
    !md ||
    (typeof md === 'object' && !Object.keys(md).length) ||
    !md.runners?.length
  )
}

function normalizeMatchOdds(raw) {
  if (!raw) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  if (typeof raw === 'object' && !Object.keys(raw).length) return null
  return raw
}

export default function RacingOdds() {
  const { t } = useTranslation()
  const { eventId, marketId, sport: sportSlug } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const isMobile = useIsMobile()

  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isOneClickBet = useSelector(selectIsOneClickBet)
  const oneClickBetStake = useSelector(selectOneClickBetStake)
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const currency = useSelector(selectCurrency)
  const activeBetSlip = useSelector(selectActiveBetSlip)
  const isPlacingBet = useSelector(selectIsPlacingBet)
  const placingSelectionId = useSelector(selectPlacingSelectionId)
  const openBetRefreshTick = useSelector(selectOpenBetRefreshTick)

  const sportId = useMemo(() => getSportIdFromSlug(sportSlug), [sportSlug])
  const sportIsRacing = useMemo(
    () => isRacingSport(sportId) || isRacingSport(sportSlug),
    [sportId, sportSlug]
  )

  const [matchOdds, setMatchOdds] = useState(null)
  const [marketSetting, setMarketSetting] = useState({ isRacing: true })

  const [racingExposure, setRacingExposure] = useState([])
  useEffect(() => {
    if (!isAuthenticated || !eventId || !marketId) return undefined
    let cancelled = false
    http
      .get(`bet/post-exposure/${eventId}`)
      .then(({ data }) => {
        if (cancelled) return
        const entries = Array.isArray(data?.data) ? data.data : []
        const entry = entries.find(
          (e) => String(e?.marketId) === String(marketId)
        )
        setRacingExposure(
          Array.isArray(entry?.selections) ? entry.selections : []
        )
      })
      .catch(() => {
        if (cancelled) return
        setRacingExposure([])
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, eventId, marketId, openBetRefreshTick])

  // Gated read — avoids leaking the previous event's exposure when the user
  // navigates away / logs out, without an in-effect setState.
  const visibleRacingExposure = useMemo(() => {
    if (!isAuthenticated || !eventId || !marketId) return []
    return racingExposure
  }, [isAuthenticated, eventId, marketId, racingExposure])

  // ── Load default odds (POST sport/default-odds with marketId).
  const loadDefaultOdds = useCallback(
    async (signal) => {
      if (!sportId || !eventId || !marketId) return
      dispatch(setMainScreenLoader(true))
      try {
        const res = await http.post(
          'sport/default-odds',
          { sportId, eventId, marketId },
          { signal }
        )
        const data = res?.data?.data ?? res?.data ?? {}
        const md = normalizeMatchOdds(data.match_odds)
        if (isEmptyMatchOdds(md)) {
          alertService.error(t('errors.noMarketData', 'No market data'))
          navigate(-1)
          return
        }
        setMatchOdds(md)
        setMarketSetting({ ...(data.marketSetting ?? {}), isRacing: true })
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED')
          return
        alertService.error(
          err?.response?.data?.message ||
            t('errors.somethingWrong', 'Something went wrong')
        )
      } finally {
        dispatch(setMainScreenLoader(false))
      }
    },
    [sportId, eventId, marketId, dispatch, navigate, t]
  )

  // Initial load
  useEffect(() => {
    const controller = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDefaultOdds(controller.signal)
    return () => controller.abort()
  }, [loadDefaultOdds])

  // ── Socket subscribe/listen for MARKET_ODDS (racing payload = {sportId, marketId}).
  useEffect(() => {
    if (!sportId || !marketId) return undefined
    const payload = { sportId, marketId }
    emitSocket(SOCKET_EVENTS.MARKET_ODDS, payload)
    const unlisten = listenSocket(SOCKET_EVENTS.MARKET_ODDS, (odds) => {
      const next = normalizeMatchOdds(odds)
      if (!next) return
      setMatchOdds((prev) => ({ ...(prev ?? {}), ...next }))
    })
    const offReconnect = onReconnect(() => {
      emitSocket(SOCKET_EVENTS.MARKET_ODDS, payload)
    })
    return () => {
      emitSocket(SOCKET_EVENTS.ODDS_LEAVE, payload)
      unlisten?.()
      offReconnect?.()
    }
  }, [sportId, marketId])

  // ── Visibility change → re-emit to rejoin server room.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && sportId && marketId) {
        emitSocket(SOCKET_EVENTS.MARKET_ODDS, { sportId, marketId })
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [sportId, marketId])

  // ── Refresh markets (re-fetch default odds) — driven by the Refresh chip below.
  const refresh = useCallback(() => {
    const controller = new AbortController()
    void loadDefaultOdds(controller.signal)
  }, [loadDefaultOdds])

  // ── onMatchOddClick: mirrors Archive racing flow.
  // - Suspended / no price → no-op (handled by MatchOddMarket bgLine)
  // - Not logged in → show login modal
  // - One-click bet ON → place bet immediately with the one-click stake
  // - Otherwise → open the right-side BetSlip (desktop) / inline (mobile)
  const onPick = useCallback(
    (runner, odd, betType) => {
      if (!odd?.price) return
      if (!isAuthenticated) {
        dispatch(setLoginWindow(true))
        return
      }

      const slip = {
        marketId: runner._marketId || marketId,
        // Technical identifier — must match `BetExposureCell`'s `marketName`
        // prop so the live preExposure preview shows under the right runner.
        marketName: 'MATCH_ODDS',
        marketDisplayName: runner._marketName || 'Match Odds',
        eventTitle: runner._eventTitle || '',
        eventId: matchOdds?.eventId || eventId,
        sportId,
        selectionId: runner.selectionId,
        runnerId: runner.selectionId,
        selectionName: runner.runnerName || runner.runner,
        betType,
        odd: odd.price,
        size: odd.size,
        stake: '',
      }

      if (isOneClickBet) {
        const stake = Number(oneClickBetStake)
        if (!stake || Number.isNaN(stake)) {
          alertService.error(
            t('errors.invalidStake', 'Set a one-click stake first')
          )
          return
        }
        dispatch(
          placeBet({
            slip: { ...slip, stake },
            context: {
              sport: sportSlug ?? '',
              eventId: String(eventId ?? ''),
              eventTitle: matchOdds?.eventName ?? '',
              runners: matchOdds?.runners ?? [],
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
        return
      }

      dispatch(setActiveBetSlip(slip))
    },
    [
      isAuthenticated,
      isOneClickBet,
      oneClickBetStake,
      marketId,
      matchOdds,
      eventId,
      sportId,
      sportSlug,
      dispatch,
      t,
    ]
  )

  const handlePlaceBet = useCallback(
    async (slip, onDone) => {
      try {
        await dispatch(
          placeBet({
            slip,
            context: {
              sport: sportSlug ?? '',
              eventId: String(eventId ?? ''),
              eventTitle: matchOdds?.eventName ?? '',
              runners: matchOdds?.runners ?? [],
            },
          })
        ).unwrap()
        alertService.success(t('common.betPlaced', 'Bet placed'))
        onDone?.()
      } catch (msg) {
        alertService.error(
          typeof msg === 'string'
            ? msg
            : t('errors.placeBetFailed', 'Failed to place bet')
        )
      }
    },
    [dispatch, sportSlug, eventId, matchOdds, t]
  )

  const onCancelMatchOdds = useCallback(
    () => dispatch(setActiveBetSlip(null)),
    [dispatch]
  )

  // Only highlight the active back/lay cell if it belongs to THIS market.
  const activeForThisMarket =
    activeBetSlip?.marketName === 'Match Odds' &&
    String(activeBetSlip?.marketId) === String(matchOdds?.marketId || marketId)
      ? activeBetSlip
      : null

  const isPlacingActive =
    isPlacingBet &&
    String(placingSelectionId) === String(activeBetSlip?.selectionId ?? '')

  if (!sportIsRacing) {
    return (
      <div className="p-4 text-center text-(--dark)">
        <button
          type="button"
          onClick={() => navigate(`/odds/${eventId}/${sportSlug}`)}
          className="text-(--primary) underline"
        >
          {t('common.openEvent', 'Open event page')}
        </button>
      </div>
    )
  }

  if (!matchOdds) return null

  return (
    <div>
      <PinRefresh onRefresh={refresh} />

      <MatchOddsSection
        matchOdds={matchOdds}
        isMobile={isMobile}
        isAuthenticated={isAuthenticated}
        isYellowTheme={isYellowTheme}
        currency={currency}
        marketSetting={marketSetting}
        exposureData={visibleRacingExposure}
        active={activeForThisMarket}
        onPick={onPick}
        onCancelMatchOdds={onCancelMatchOdds}
        onPlaceBet={handlePlaceBet}
        isPlacingActive={isPlacingActive}
      />
    </div>
  )
}
