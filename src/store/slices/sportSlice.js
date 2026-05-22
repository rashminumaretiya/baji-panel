import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import { http } from '../../core/http/client.js'
import {
  RACING_SPORTS,
  SPORT_TAB_EXCLUDE,
} from '../../core/constant/constants.js'

const SIDEBAR_SPORTS_TTL_MS = 60_000

const initialState = {
  sportTabs: [],
  tabsStatus: 'idle',
  tabsError: null,
  activeSportId: null,
  sidebarSports: [],
  sidebarLoading: false,
  sidebarLoadedAt: 0,
  gamesById: {},
  pinned: [],
  pinnedStatus: 'idle',
  inplayMap: {},
  inplayStatus: 'idle',
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

export const loadSportTabs = createAsyncThunk(
  'sport/loadSportTabs',
  async () => {
    const res = await http.get('sport/live-count')
    return res.data?.data ?? []
  }
)

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
  async (params = {}) => {
    const res = await http.get('sport/list', { params })
    return res.data?.data ?? {}
  }
)

export const loadPinnedEvents = createAsyncThunk(
  'sport/loadPinnedEvents',
  async () => {
    const res = await http.get('sport/pinned-events')
    return res.data?.data ?? []
  }
)

export const pinEvent = createAsyncThunk(
  'sport/pinEvent',
  async ({ eventId, sportId, alias }, { dispatch }) => {
    const res = await http.post('sport/pin-event', { eventId, sportId, alias })
    dispatch(loadPinnedEvents())
    return res.data?.data
  }
)

export const unpinEvent = createAsyncThunk(
  'sport/unpinEvent',
  async (eventId, { dispatch }) => {
    const res = await http.post('sport/unpin-event', { eventId })
    dispatch(loadPinnedEvents())
    return res.data?.data
  }
)

const sportSlice = createSlice({
  name: 'sport',
  initialState,
  reducers: {
    setSportTabs(s, { payload }) {
      s.sportTabs = payload || []
    },
    setActiveSportId(s, { payload }) {
      s.activeSportId = payload != null ? String(payload) : null
    },
    setSidebarSports(s, { payload }) {
      s.sidebarSports = payload || []
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

    b.addCase(loadSportTabs.pending, (s) => {
      s.tabsStatus = 'loading'
      s.tabsError = null
    })
    b.addCase(loadSportTabs.fulfilled, (s, { payload }) => {
      s.tabsStatus = 'idle'
      s.sportTabs = payload
    })
    b.addCase(loadSportTabs.rejected, (s, { error }) => {
      s.tabsStatus = 'error'
      s.tabsError = error?.message ?? 'Failed to load sports'
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
      s.pinned = payload
    })
    b.addCase(loadPinnedEvents.rejected, (s) => {
      s.pinnedStatus = 'error'
      s.pinned = []
    })
  },
})

export const {
  setSportTabs,
  setActiveSportId,
  setSidebarSports,
  mergeOddsUpdate,
} = sportSlice.actions

export default sportSlice.reducer

export const selectSportTabsRaw = (s) => s.sport.sportTabs
export const selectActiveSportId = (s) => s.sport.activeSportId
export const selectSidebarSports = (s) => s.sport.sidebarSports
export const selectSidebarLoading = (s) => s.sport.sidebarLoading

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

export const selectIsRacingSport = (s) =>
  RACING_SPORTS.has(s.sport.activeSportId ?? '')

export const selectInplayMap = (s) => s.sport.inplayMap
export const selectInplayStatus = (s) => s.sport.inplayStatus

const selectPinned = (s) => s.sport.pinned
export const selectPinnedEventIds = createSelector(
  [selectPinned],
  (pinned) => new Set(pinned.map((p) => p.eventId))
)
