// Mirrors sbex-user-fe/src/app/features/services/sport.ts + layoutService.getSidebarData().
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { http } from '../../core/http/client.js'

const initialState = {
  sportTabs: [],
  activeSportId: null,
  sidebarSports: [], // List<SportItem> from layoutService.getSidebarData()
  sidebarLoading: false,
}

// Ports layoutService.getSidebarData() — GET /sport/all.
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
)

const sportSlice = createSlice({
  name: 'sport',
  initialState,
  reducers: {
    setSportTabs(s, { payload }) {
      s.sportTabs = payload || []
    },
    setActiveSportId(s, { payload }) {
      s.activeSportId = payload
    },
    setSidebarSports(s, { payload }) {
      s.sidebarSports = payload || []
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchSidebarSports.pending, (s) => {
      s.sidebarLoading = true
    })
    b.addCase(fetchSidebarSports.fulfilled, (s, { payload }) => {
      s.sidebarSports = payload
      s.sidebarLoading = false
    })
    b.addCase(fetchSidebarSports.rejected, (s) => {
      s.sidebarLoading = false
    })
  },
})

export const { setSportTabs, setActiveSportId, setSidebarSports } = sportSlice.actions
export default sportSlice.reducer

export const selectSportTabs = (s) => s.sport.sportTabs
export const selectActiveSportId = (s) => s.sport.activeSportId
export const selectSidebarSports = (s) => s.sport.sidebarSports
export const selectSidebarLoading = (s) => s.sport.sidebarLoading
