import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { http } from '../../core/http/client.js'

const initialState = {
  sportTabs: [],
  racingListShow: {
    isHorseRacingAllowed: false,
    isGreyhoundRacingAllowed: false,
  },
  isLoadingSportTabs: false,
  sportTabsLoadedAt: 0,
}

const SPORT_LIVE_COUNT_TTL_MS = 60_000

export const fetchSportLiveCount = createAsyncThunk(
  'header/fetchSportLiveCount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await http.get('sport/live-count')
      return res.data?.data ?? []
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  },
  {
    condition: (_, { getState }) => {
      const s = getState().header
      if (s.isLoadingSportTabs) return false
      if (
        s.sportTabsLoadedAt &&
        Date.now() - s.sportTabsLoadedAt < SPORT_LIVE_COUNT_TTL_MS
      ) {
        return false
      }
      return true
    },
  }
)

const HORSE_RACING_NAME = 'horse racing'
const GREYHOUND_NAME = 'greyhound racing'

function normalizeSportTab(entry) {
  if (!entry || typeof entry !== 'object') return null
  return {
    id: entry.id != null ? String(entry.id) : '',
    name: entry.name ?? '',
    route: entry.route ?? '',
    label: entry.label ?? entry.name ?? '',
    icon: entry.icon ?? '',
    count: Number(entry.count) || 0,
  }
}

function deriveRacingFlags(tabs) {
  const flags = {
    isHorseRacingAllowed: false,
    isGreyhoundRacingAllowed: false,
  }
  for (const tab of tabs) {
    const name = (tab.name || '').toLowerCase()
    if (name === HORSE_RACING_NAME) flags.isHorseRacingAllowed = true
    if (name === GREYHOUND_NAME) flags.isGreyhoundRacingAllowed = true
  }
  return flags
}

const headerSlice = createSlice({
  name: 'header',
  initialState,
  reducers: {
    setRacingListShow(s, { payload }) {
      s.racingListShow = {
        ...s.racingListShow,
        ...(payload || {}),
      }
    },
    resetSportTabs(s) {
      s.sportTabs = []
      s.sportTabsLoadedAt = 0
      s.racingListShow = {
        isHorseRacingAllowed: false,
        isGreyhoundRacingAllowed: false,
      }
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchSportLiveCount.pending, (s) => {
      s.isLoadingSportTabs = true
    })
    b.addCase(fetchSportLiveCount.fulfilled, (s, { payload }) => {
      s.isLoadingSportTabs = false
      const tabs = (Array.isArray(payload) ? payload : [])
        .map(normalizeSportTab)
        .filter(Boolean)
      s.sportTabs = tabs
      s.racingListShow = deriveRacingFlags(tabs)
      s.sportTabsLoadedAt = Date.now()
    })
    b.addCase(fetchSportLiveCount.rejected, (s) => {
      s.isLoadingSportTabs = false
    })
  },
})

export const { setRacingListShow, resetSportTabs } = headerSlice.actions
export default headerSlice.reducer

export const selectSportTabs = (s) => s.header.sportTabs
export const selectRacingListShow = (s) => s.header.racingListShow
export const selectIsLoadingSportTabs = (s) => s.header.isLoadingSportTabs
export const selectSportTabsLoadedAt = (s) => s.header.sportTabsLoadedAt
