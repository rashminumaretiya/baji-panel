// Mirrors sbex-user-fe/src/app/shared/services/bet-slip.ts (state surface only).
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { http } from '../../core/http/client.js'
import { placeBet as placeBetApi } from '../../shared/services/place-bet.js'
import { fetchBalance } from './authSlice.js'

const BACK_TYPES = new Set(['BACK', 'YES', 'Back', 'Yes'])
const LAY_TYPES = new Set(['LAY', 'NO', 'Lay', 'No'])

function deriveSelection(b) {
  if (Array.isArray(b.selection)) {
    return {
      name: b.selection
        .map((e) => e?.name)
        .filter(Boolean)
        .join(' | '),
      id: '',
    }
  }
  return {
    name: b.selectionName ?? b.selection?.name ?? '',
    id: String(b.selectionId ?? b.selection?.id ?? ''),
  }
}

function normalizeOpenBets(list) {
  if (!Array.isArray(list)) return []
  return list.map((wrapper) => {
    const wrapperEventType =
      wrapper.eventType ?? wrapper.marketName ?? wrapper.gtype ?? ''
    const normalizedBets = (wrapper.bets ?? []).map((b) => ({
      ...b,
      selection: deriveSelection(b),
      event: { type: b.gtype ?? wrapperEventType },
      profitLoss: b.profitLoss ?? b.profit ?? 0,
    }))
    return {
      ...wrapper,
      event: {
        type: wrapperEventType,
        name: wrapper.eventTitle ?? wrapper.event?.name ?? '',
        id: String(wrapper.eventId ?? wrapper.event?.id ?? ''),
      },
      bets: {
        back: normalizedBets.filter((b) => BACK_TYPES.has(b.betType)),
        lay: normalizedBets.filter((b) => LAY_TYPES.has(b.betType)),
      },
    }
  })
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
  }
)

export const placeBet = createAsyncThunk(
  'betSlip/placeBet',
  async ({ slip, context } = {}, { dispatch, rejectWithValue }) => {
    try {
      const data = await placeBetApi(slip, context ?? {})
      dispatch(fetchBalance())
      return { data, slip }
    } catch (err) {
      const body = err?.response?.data
      if (body && (body.key || body.message)) return rejectWithValue(body)
      return rejectWithValue({ message: err?.message || 'Failed to place bet' })
    }
  }
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
        payload?.slip?.selectionId ?? payload?.slip?.runnerId ?? ''
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

export const {
  setActiveBetSlip,
  setOpenBets,
  openBetRefresh,
  setOneClickBetStake,
} = betSlipSlice.actions
export default betSlipSlice.reducer

export const selectActiveBetSlip = (s) => s.betSlip.activeBetSlip
export const selectOpenBets = (s) => s.betSlip.openBets
export const selectOpenBetRefreshTick = (s) => s.betSlip.openBetRefreshTick
export const selectIsPlacingBet = (s) => s.betSlip.isPlacingBet
export const selectPlacingSelectionId = (s) => s.betSlip.placingSelectionId
export const selectOneClickBetStake = (s) => s.betSlip.oneClickBetStake
