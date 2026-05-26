import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import { http } from '../../core/http/client.js'
import { SPORT_TAB_EXCLUDE } from '../../core/constant/constants.js'
import { fetchSportLiveCount } from './headerSlice.js'

const SIDEBAR_SPORTS_TTL_MS = 60_000
const PINNED_TTL_MS = 30_000
const INPLAY_MAP_TTL_MS = 30_000

const initialState = {
  sportTabs: [],
  activeSportId: null,
  sidebarSports: [],
  sidebarLoading: false,
  sidebarLoadedAt: 0,
  gamesById: {},
  pinned: [],
  pinnedStatus: 'idle',
  pinnedLoadedAt: 0,
  inplayMap: {},
  inplayStatus: 'idle',
  inplayLoadedAt: 0,
}

export const fetchSidebarSports = createAsyncThunk(
  'sport/fetchSidebarSports',
  async (_, { rejectWithValue }) => {
    try {
      const res = await http.get('sport/all')
      return res.data?.data ?? []
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  },
  {
    condition: (_, { getState }) => {
      const s = getState().sport
      if (s.sidebarLoading) return false
      if (
        s.sidebarLoadedAt &&
        Date.now() - s.sidebarLoadedAt < SIDEBAR_SPORTS_TTL_MS
      ) {
        return false
      }
      return true
    },
  }
)

// NOTE: `sport/live-count` is fetched once by `headerSlice.fetchSportLiveCount`
// (which has a 60s TTL guard). This slice mirrors the resulting tabs into
// `sport.sportTabs` via the cross-slice extraReducer below — there is no
// dedicated `loadSportTabs` thunk any more, so Home / InPlay should dispatch
// `fetchSportLiveCount` directly.
export { fetchSportLiveCount }

export const loadGamesForSport = createAsyncThunk(
  'sport/loadGamesForSport',
  async (sportId) => {
    const res = await http.get('sport/list', { params: { sportId } })
    return { sportId: String(sportId), items: res.data?.data ?? [] }
  },
  {
    condition: (sportId, { getState }) => {
      if (!sportId) return false
      const entry = getState().sport.gamesById[String(sportId)]
      if (entry?.status === 'loading') return false
      if (entry?.fetchedAt && Date.now() - entry.fetchedAt < 5000) return false
      return true
    },
  }
)

export const loadInplayMap = createAsyncThunk(
  'sport/loadInplayMap',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await http.get('sport/list', { params })
      return res.data?.data ?? {}
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  },
  {
    condition: (_, { getState }) => {
      const s = getState().sport
      if (s.inplayStatus === 'loading') return false
      if (
        s.inplayLoadedAt &&
        Date.now() - s.inplayLoadedAt < INPLAY_MAP_TTL_MS
      ) {
        return false
      }
      return true
    },
  }
)

// Pass { force: true } to bypass the TTL — used by pinEvent/unpinEvent to
// refresh the list immediately after a mutation.
export const loadPinnedEvents = createAsyncThunk(
  'sport/loadPinnedEvents',
  async () => {
    const res = await http.get('sport/pinned-events')
    return res.data?.data ?? []
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true
      const s = getState().sport
      if (s.pinnedStatus === 'loading') return false
      if (s.pinnedLoadedAt && Date.now() - s.pinnedLoadedAt < PINNED_TTL_MS) {
        return false
      }
      return true
    },
  }
)

export const pinEvent = createAsyncThunk(
  'sport/pinEvent',
  async ({ eventId, sportId, alias }, { dispatch }) => {
    const res = await http.post('sport/pin-event', { eventId, sportId, alias })
    dispatch(loadPinnedEvents({ force: true }))
    return res.data?.data
  }
)

export const unpinEvent = createAsyncThunk(
  'sport/unpinEvent',
  async (eventId, { dispatch }) => {
    const res = await http.post('sport/unpin-event', { eventId })
    dispatch(loadPinnedEvents({ force: true }))
    return res.data?.data
  }
)

const sportSlice = createSlice({
  name: 'sport',
  initialState,
  reducers: {
    setActiveSportId(s, { payload }) {
      s.activeSportId = payload != null ? String(payload) : null
    },
    mergeOddsUpdate(state, { payload }) {
      const { eventId, sportId, odds, isInPlay } = payload ?? {}
      if (!sportId || !eventId) return
      const sid = String(sportId)
      const bucket = state.gamesById[sid]
      if (!bucket?.items) return
      const idx = bucket.items.findIndex((g) => g.event?.id === eventId)
      if (idx === -1) return
      const next = { ...bucket.items[idx] }
      if (odds) next.odds_1x2 = odds
      if (isInPlay != null) next.isInPlay = isInPlay
      bucket.items[idx] = next
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchSidebarSports.pending, (s) => {
      s.sidebarLoading = true
    })
    b.addCase(fetchSidebarSports.fulfilled, (s, { payload }) => {
      s.sidebarSports = payload
      s.sidebarLoading = false
      s.sidebarLoadedAt = Date.now()
    })
    b.addCase(fetchSidebarSports.rejected, (s) => {
      s.sidebarLoading = false
    })

    b.addCase(fetchSportLiveCount.fulfilled, (s, { payload }) => {
      s.sportTabs = Array.isArray(payload) ? payload : []
    })

    b.addCase(loadGamesForSport.pending, (s, { meta }) => {
      const id = String(meta.arg)
      s.gamesById[id] = {
        ...(s.gamesById[id] || { items: [] }),
        status: 'loading',
        error: null,
      }
    })
    b.addCase(loadGamesForSport.fulfilled, (s, { payload }) => {
      const { sportId, items } = payload
      s.gamesById[sportId] = {
        items,
        status: 'idle',
        error: null,
        fetchedAt: Date.now(),
      }
    })
    b.addCase(loadGamesForSport.rejected, (s, { meta, error }) => {
      const id = String(meta.arg)
      s.gamesById[id] = {
        ...(s.gamesById[id] || { items: [] }),
        status: 'error',
        error: error?.message ?? 'Failed to load games',
      }
    })

    b.addCase(loadInplayMap.pending, (s) => {
      s.inplayStatus = 'loading'
    })
    b.addCase(loadInplayMap.fulfilled, (s, { payload }) => {
      s.inplayStatus = 'idle'
      s.inplayMap = payload && typeof payload === 'object' ? payload : {}
      s.inplayLoadedAt = Date.now()
    })
    b.addCase(loadInplayMap.rejected, (s) => {
      s.inplayStatus = 'error'
      s.inplayMap = {}
    })

    b.addCase(loadPinnedEvents.pending, (s) => {
      s.pinnedStatus = 'loading'
    })
    b.addCase(loadPinnedEvents.fulfilled, (s, { payload }) => {
      s.pinnedStatus = 'idle'
      s.pinnedLoadedAt = Date.now()
      s.pinned = payload
    })
    b.addCase(loadPinnedEvents.rejected, (s) => {
      s.pinnedStatus = 'error'
      s.pinned = []
    })
  },
})

export const { setActiveSportId, mergeOddsUpdate } = sportSlice.actions

export default sportSlice.reducer

const selectSportTabsRaw = (s) => s.sport.sportTabs
export const selectActiveSportId = (s) => s.sport.activeSportId
export const selectSidebarSports = (s) => s.sport.sidebarSports

export const selectSportTabs = createSelector([selectSportTabsRaw], (tabs) =>
  tabs.filter((t) => !SPORT_TAB_EXCLUDE.has(t.route))
)

export const selectActiveSportConfig = createSelector(
  [selectSportTabsRaw, selectActiveSportId],
  (tabs, id) => tabs.find((t) => String(t.id) === id)
)

const selectGamesById = (s) => s.sport.gamesById
export const selectGamesForActiveSport = createSelector(
  [selectGamesById, selectActiveSportId],
  (byId, id) => (id ? (byId[id]?.items ?? []) : [])
)
export const selectGamesStatusForActiveSport = createSelector(
  [selectGamesById, selectActiveSportId],
  (byId, id) => (id ? (byId[id]?.status ?? 'idle') : 'idle')
)

export const selectInplayMap = (s) => s.sport.inplayMap
export const selectInplayStatus = (s) => s.sport.inplayStatus

const selectPinned = (s) => s.sport.pinned
export const selectPinnedEventIds = createSelector(
  [selectPinned],
  (pinned) => new Set(pinned.map((p) => p.eventId))
)
