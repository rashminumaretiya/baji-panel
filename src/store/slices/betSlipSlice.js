// Mirrors sbex-user-fe/src/app/shared/services/bet-slip.ts (state surface only).
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { http } from '../../core/http/client.js'
import { placeBet as placeBetApi } from '../../shared/services/place-bet.js'
import { fetchBalance } from './authSlice.js'

// Mirrors Angular's open-bets transformation in
// `open-bets.component.ts > getOpenBetsList()` — split each event's flat `bets`
// array into back/lay buckets, joining sport-book multi-runner selections.
function normalizeOpenBets(list) {
  if (!Array.isArray(list)) return []
  return list.map((bet) => ({
    ...bet,
    bets: {
      back: (bet.bets ?? [])
        .filter((b) => b.betType === 'Back' || b.betType === 'Yes')
        .map((b) =>
          Array.isArray(b.selection)
            ? {
                ...b,
                selection: {
                  name: b.selection.map((e) => e?.name).join(' | '),
                  id: '',
                },
              }
            : b,
        ),
      lay: (bet.bets ?? []).filter(
        (b) => b.betType === 'Lay' || b.betType === 'No',
      ),
    },
  }))
}

const initialState = {
  activeBetSlip: null,
  openBets: [],
  openBetRefreshTick: 0,
  oneClickBetStake: null,
  // Loading + last-result state for the place-bet API call.
  // `placingSelectionId` lets per-row inline slips render their own "Placing…"
  // without other slips flashing the same state.
  isPlacingBet: false,
  placingSelectionId: null,
}

// Fetch open bets — optional `eventId` param scopes the result to one event
// (used on /odds/:eventId/:sport). Omit the param on home / list pages to
// fetch all open bets across events.
export const fetchOpenBets = createAsyncThunk(
  'betSlip/fetchOpenBets',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await http.get('bet/open-bets', { params })
      return normalizeOpenBets(data?.data ?? [])
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err?.message)
    }
  },
)

// Place-bet thunk: encrypts the payload, POSTs to `user/bet/`, refreshes the
// wallet balance, and clears the right-side slip on success. Inline slip cleanup
// (the `activeBookmaker` / `activeFancyBet` / `activeSportBook` state in LiveOdds)
// happens in the dispatcher's `.then(...)` chain since that state isn't in Redux.
export const placeBet = createAsyncThunk(
  'betSlip/placeBet',
  async ({ slip, context } = {}, { dispatch, rejectWithValue }) => {
    try {
      const data = await placeBetApi(slip, context ?? {})
      // Refresh wallet immediately so the user sees the deducted stake.
      dispatch(fetchBalance())
      return { data, slip }
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to place bet',
      )
    }
  },
)

const betSlipSlice = createSlice({
  name: 'betSlip',
  initialState,
  reducers: {
    setActiveBetSlip(s, { payload }) {
      s.activeBetSlip = payload
    },
    setOpenBets(s, { payload }) {
      s.openBets = payload || []
    },
    openBetRefresh(s) {
      s.openBetRefreshTick += 1
    },
    setOneClickBetStake(s, { payload }) {
      s.oneClickBetStake = payload
    },
  },
  extraReducers: (b) => {
    b.addCase(placeBet.pending, (s, { meta }) => {
      s.isPlacingBet = true
      s.placingSelectionId =
        meta?.arg?.slip?.selectionId ?? meta?.arg?.slip?.runnerId ?? null
    })
    b.addCase(placeBet.fulfilled, (s, { payload }) => {
      s.isPlacingBet = false
      s.placingSelectionId = null
      // Only auto-close the right-side slip when it was placing this same selection.
      const placedId = String(
        payload?.slip?.selectionId ?? payload?.slip?.runnerId ?? '',
      )
      const activeId = String(s.activeBetSlip?.selectionId ?? '')
      if (placedId && placedId === activeId) {
        s.activeBetSlip = null
      }
      s.openBetRefreshTick += 1
    })
    b.addCase(placeBet.rejected, (s) => {
      s.isPlacingBet = false
      s.placingSelectionId = null
    })
    b.addCase(fetchOpenBets.fulfilled, (s, { payload }) => {
      s.openBets = payload ?? []
    })
  },
})

export const { setActiveBetSlip, setOpenBets, openBetRefresh, setOneClickBetStake } =
  betSlipSlice.actions
export default betSlipSlice.reducer

export const selectActiveBetSlip = (s) => s.betSlip.activeBetSlip
export const selectOpenBets = (s) => s.betSlip.openBets
export const selectOpenBetRefreshTick = (s) => s.betSlip.openBetRefreshTick
export const selectIsPlacingBet = (s) => s.betSlip.isPlacingBet
export const selectPlacingSelectionId = (s) => s.betSlip.placingSelectionId
