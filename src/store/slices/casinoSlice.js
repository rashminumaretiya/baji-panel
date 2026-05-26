// Ported from sbex-user-fe/src/app/features/services/casino.ts.
// Owns activeProviders/blockedGameCodes/casinoGameImages plus the launch flow.
// The ~150k-line game registry is lazy-loaded via `loadCasinoData()` so the
// main bundle stays small; `isCasinoDataLoaded` flips selectors over once
// the import resolves.
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import { http } from '../../core/http/client.js'
import { environment } from '../../environments/environment.js'
import { emitSocket } from '../../core/socket/client.js'
import { SOCKET_EVENTS } from '../../core/socket/events.js'
import { alertService } from '../../shared/services/alert.js'
import {
  IS_AWC_CASINO,
  IS_GSC_CASINO,
  IS_QT_CASINO,
} from '../../core/constant/constants.js'
import { getCachedCasinoData, loadCasinoData } from '../../data/casino/loader.js'
import { selectIsMobile, selectAllowedSbGames } from './commonSlice.js'
import { selectUser } from './authSlice.js'

const CASINO_INFO_TTL_MS = 60_000

const initialState = {
  activeProviders: [],
  blockedGameCodes: [],
  casinoGameImages: [],
  isCasinoBlocked: false,
  casinoAgentBalance: null,
  isLaunching: false,
  isCasinoDataLoaded: false,
  casinoInfoLoading: false,
  casinoInfoLoadedAt: 0,
}

// Lazy-load the casino registry + provider config + SB games. Dispatched on
// /platform mount; deduped via the `condition` so subsequent navigations skip
// the import.
export const ensureCasinoDataLoaded = createAsyncThunk(
  'casino/ensureDataLoaded',
  async () => {
    await loadCasinoData()
  },
  {
    condition: (_, { getState }) => !getState().casino.isCasinoDataLoaded,
  }
)

// GET /casino-info — populates activeProviders / blockedGameCodes / casinoGameImages.
export const fetchCasinoInfo = createAsyncThunk(
  'casino/fetchCasinoInfo',
  async (_, { rejectWithValue }) => {
    try {
      const res = await http.get('casino-info')
      return res.data?.data ?? null
    } catch (err) {
      return rejectWithValue(err?.response?.data || err?.message)
    }
  },
  {
    condition: (_, { getState }) => {
      const s = getState().casino
      if (s.casinoInfoLoading) return false
      if (
        s.casinoInfoLoadedAt &&
        Date.now() - s.casinoInfoLoadedAt < CASINO_INFO_TTL_MS
      ) {
        return false
      }
      return true
    },
  }
)

// GET /user/casino-agent-balance — validates the agent has enough float to
// underwrite the player session before we redirect to the launcher URL.
export const fetchCasinoAgentBalance = createAsyncThunk(
  'casino/fetchCasinoAgentBalance',
  async (_, { rejectWithValue }) => {
    try {
      const res = await http.get('user/casino-agent-balance')
      return res.data?.data ?? null
    } catch (err) {
      return rejectWithValue(err?.response?.data || err?.message)
    }
  }
)

// Mirrors Casino#launchCasinogame: agent-balance gate → provider-specific
// launch endpoint → socket emit → redirect to the returned URL.
// The `condition` skips re-entry while a launch is already in flight so a
// double-click can't fire two balance fetches + two launches in parallel.
export const launchCasinogame = createAsyncThunk(
  'casino/launchCasinogame',
  async (casino, { dispatch, getState, rejectWithValue }) => {
    if (!casino) return rejectWithValue('No game selected')

    const balanceRes = await dispatch(fetchCasinoAgentBalance())
    if (balanceRes.meta.requestStatus !== 'fulfilled') {
      return rejectWithValue('balance check failed')
    }
    const balanceData = balanceRes.payload || {}
    if (!(balanceData.casinoAgentBalance > 0)) {
      alertService.error('errors.CASINO_AGENT_BALANCE_LOW')
      return rejectWithValue('insufficient balance')
    }
    if (balanceData.isCasinoBlocked) {
      alertService.error('errors.CASINO_SUSPENDED')
      return rejectWithValue('casino suspended')
    }

    const isMobile = selectIsMobile(getState())
    const user = selectUser(getState())
    const launchUrl = await runLaunch(casino, isMobile)

    if (!launchUrl) {
      alertService.error('errors.SOMETHING_WENT_WRONG')
      return rejectWithValue('no launch url')
    }

    emitSocket(SOCKET_EVENTS.CASINO_LAUNCHED, {
      userName: user?.profileDetails?.userName,
    })
    if (typeof window !== 'undefined') window.location.href = launchUrl
    return launchUrl
  },
  {
    condition: (_, { getState }) => !getState().casino.isLaunching,
  }
)

async function runLaunch(casino, isMobile) {
  if (casino.sbGameCode) {
    const res = await http.post(`${environment.awcCasinoUrl}sbgames/launch-url`, {
      game: casino.sbGameCode,
      platform: isMobile ? 'MOBILE' : 'DESKTOP',
    })
    return pickLaunchUrl(res)
  }
  if (casino.awcGameCode) {
    const res = await http.post(
      `${environment.awcCasinoUrl}awc-bet-request/login-and-launch-game`,
      {
        gameCode: casino.awcGameCode,
        gameType: casino.gameType,
        isMobileLogin: isMobile,
        language: 'en',
        isLaunchGameTable: casino.merchantName !== 'SEXYBCRT',
        platform: casino.merchantName,
      }
    )
    return res.data?.data?.url ?? null
  }
  if (casino.gscGameCode) {
    const res = await http.get(`${environment.gscCasinoUrl}gsc/v1/launch-url`, {
      params: {
        gameCode: casino.gscGameCode,
        providerCode: casino.providerCode,
        platform: isMobile ? 'MOBILE' : 'WEB',
      },
    })
    return res.data?.data ?? null
  }
  if (casino.qtGameCode) {
    const res = await http.post(
      `${environment.qtechCasinoUrl}qtech/launch-url`,
      { gameId: casino.qtGameCode, device: isMobile ? 'mobile' : 'desktop' }
    )
    return pickLaunchUrl(res)
  }
  return null
}

function pickLaunchUrl(res) {
  const d = res?.data?.data
  if (!d) return null
  return d.launchUrl ?? d.url ?? d
}

const casinoSlice = createSlice({
  name: 'casino',
  initialState,
  reducers: {
    setActiveProviders(s, { payload }) {
      s.activeProviders = Array.isArray(payload) ? payload : []
    },
    setBlockedGameCodes(s, { payload }) {
      s.blockedGameCodes = Array.isArray(payload) ? payload : []
    },
    setCasinoGameImages(s, { payload }) {
      s.casinoGameImages = Array.isArray(payload) ? payload : []
    },
    setIsCasinoBlocked(s, { payload }) {
      s.isCasinoBlocked = !!payload
    },
    setCasinoAgentBalance(s, { payload }) {
      s.casinoAgentBalance = payload ?? null
    },
  },
  extraReducers: (b) => {
    b.addCase(ensureCasinoDataLoaded.fulfilled, (s) => {
      s.isCasinoDataLoaded = true
    })
    b.addCase(fetchCasinoInfo.pending, (s) => {
      s.casinoInfoLoading = true
    })
    b.addCase(fetchCasinoInfo.fulfilled, (s, { payload }) => {
      s.casinoInfoLoading = false
      s.casinoInfoLoadedAt = Date.now()
      if (!payload) return
      const providers = (payload.domainProvider?.providers ?? []).map((p) => ({
        merchantName: p.merchantName,
        activeProvider: p.provider,
      }))
      s.activeProviders = providers
      s.blockedGameCodes = Array.isArray(payload.blockedCasinoCodes)
        ? payload.blockedCasinoCodes
        : []
      s.casinoGameImages = Array.isArray(payload.casinoGameImages)
        ? payload.casinoGameImages
        : []
    })
    b.addCase(fetchCasinoInfo.rejected, (s) => {
      s.casinoInfoLoading = false
    })
    b.addCase(fetchCasinoAgentBalance.fulfilled, (s, { payload }) => {
      s.casinoAgentBalance = payload?.casinoAgentBalance ?? null
      s.isCasinoBlocked = !!payload?.isCasinoBlocked
    })
    b.addCase(launchCasinogame.pending, (s) => {
      s.isLaunching = true
    })
    b.addCase(launchCasinogame.fulfilled, (s) => {
      s.isLaunching = false
    })
    b.addCase(launchCasinogame.rejected, (s) => {
      s.isLaunching = false
    })
  },
})

export const {
  setActiveProviders,
  setBlockedGameCodes,
  setCasinoGameImages,
  setIsCasinoBlocked,
  setCasinoAgentBalance,
} = casinoSlice.actions

export default casinoSlice.reducer

function enabledFallback(providerGames) {
  if (IS_AWC_CASINO && providerGames.AWC) return providerGames.AWC
  if (IS_GSC_CASINO && providerGames.GSC) return providerGames.GSC
  if (IS_QT_CASINO && providerGames.QTECH) return providerGames.QTECH
  return []
}

function isProviderEnabled(provider) {
  return (
    (provider === 'AWC' && IS_AWC_CASINO) ||
    (provider === 'GSC' && IS_GSC_CASINO) ||
    (provider === 'QTECH' && IS_QT_CASINO)
  )
}

function gamesForMerchant(merchant, activeProviderMap, registry) {
  const providerGames = registry[merchant]
  if (!providerGames) return []
  if (activeProviderMap.size === 0) return enabledFallback(providerGames)
  const activeProvider = activeProviderMap.get(merchant)
  if (!activeProvider) return enabledFallback(providerGames)
  if (isProviderEnabled(activeProvider)) {
    return providerGames[activeProvider] ?? []
  }
  return enabledFallback(providerGames)
}

// Raw state selectors.
export const selectActiveProviders = (s) => s.casino.activeProviders
export const selectBlockedGameCodes = (s) => s.casino.blockedGameCodes
export const selectCasinoGameImages = (s) => s.casino.casinoGameImages
export const selectIsCasinoBlocked = (s) => s.casino.isCasinoBlocked
export const selectCasinoAgentBalance = (s) => s.casino.casinoAgentBalance
export const selectIsLaunching = (s) => s.casino.isLaunching
export const selectIsCasinoDataLoaded = (s) => s.casino.isCasinoDataLoaded

export const selectActiveProviderMap = createSelector(
  [selectActiveProviders],
  (list) => new Map(list.map((p) => [p.merchantName, p.activeProvider]))
)

// Mirrors Casino#sbGames — sbAviator/sbLottery are gated by allowedSbGames
// from the domain configuration.
const selectSbGames = createSelector(
  [selectAllowedSbGames, selectIsCasinoDataLoaded],
  (allowed, isLoaded) => {
    if (!isLoaded) return []
    const data = getCachedCasinoData()
    if (!data) return []
    const list = []
    if (allowed.includes('aviator')) list.push(...data.sbAviatorCasinoGames)
    if (allowed.includes('lottery')) list.push(...data.sbLotteryCasinoGames)
    return list
  }
)

// Stage 1: merchant→active-provider mapping + provider-enabled filter.
// Recomputes only when activeProviderMap or the loaded-flag flips, NOT when
// the block list / allowedSbGames mutate.
const selectMerchantGamesFlat = createSelector(
  [selectActiveProviderMap, selectIsCasinoDataLoaded],
  (activeProviderMap, isLoaded) => {
    if (!isLoaded) return []
    const data = getCachedCasinoData()
    if (!data) return []
    const { MERCHANT_PROVIDER_GAMES } = data
    return Object.keys(MERCHANT_PROVIDER_GAMES)
      .flatMap((merchant) =>
        gamesForMerchant(merchant, activeProviderMap, MERCHANT_PROVIDER_GAMES)
      )
      .filter(
        (g) =>
          (IS_AWC_CASINO && g.awcGameCode) ||
          (IS_GSC_CASINO && g.gscGameCode) ||
          (IS_QT_CASINO && g.qtGameCode)
      )
  }
)

// Stage 2: apply blocked-code filter + sb-aviator suppression + decorate.
// Mirrors Casino#allCasinoGames.
export const selectAllCasinoGames = createSelector(
  [
    selectMerchantGamesFlat,
    selectBlockedGameCodes,
    selectAllowedSbGames,
    selectSbGames,
  ],
  (merchantGames, blockedList, allowed, sbGames) => {
    const blocked = new Set(blockedList)
    const useSbAviator = allowed.includes('aviator')

    const regularGames = merchantGames
      .filter(
        (g) =>
          !blocked.has(g.awcGameCode) &&
          !blocked.has(g.gscGameCode) &&
          !blocked.has(g.qtGameCode) &&
          !(
            useSbAviator &&
            g.provider === 'spribe' &&
            g.gameName?.toLowerCase() === 'aviator'
          )
      )
      .map((g) => ({
        ...g,
        effectiveGameType: g.gameName?.toLowerCase().includes('crash')
          ? 'CRASH'
          : g.gameType,
      }))

    const decoratedSb = sbGames.map((g) => ({
      ...g,
      effectiveGameType: g.gameType,
    }))

    return [...decoratedSb, ...regularGames]
  }
)

// Mirrors PlatformList's constructor: group allCasinoGames by lowercased
// `provider`, then decorate each group with PROVIDER_CONFIG.
export const selectCasinoProviders = createSelector(
  [selectAllCasinoGames, selectIsCasinoDataLoaded],
  (games, isLoaded) => {
    if (!isLoaded) return []
    const data = getCachedCasinoData()
    if (!data) return []
    const { PROVIDER_CONFIG, DEFAULT_PROVIDER_CONFIG } = data
    const grouped = new Map()
    for (const game of games) {
      const key = game.provider?.toLowerCase() ?? ''
      const existing = grouped.get(key)
      if (existing) existing.push(game)
      else grouped.set(key, [game])
    }
    return Array.from(grouped.entries()).map(([providerKey, providerGames]) => ({
      provider: providerKey,
      label: providerGames[0].merchantName,
      ...(PROVIDER_CONFIG[providerKey] ?? DEFAULT_PROVIDER_CONFIG),
      games: providerGames,
    }))
  }
)
