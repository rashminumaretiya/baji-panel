// Mirrors sbex-user-fe/src/app/shared/services/bet-slip.ts (state surface only).
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  activeBetSlip: null,
  openBets: [],
  openBetRefreshTick: 0,
  oneClickBetStake: null,
}

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
})

export const { setActiveBetSlip, setOpenBets, openBetRefresh, setOneClickBetStake } =
  betSlipSlice.actions
export default betSlipSlice.reducer

export const selectActiveBetSlip = (s) => s.betSlip.activeBetSlip
export const selectOpenBets = (s) => s.betSlip.openBets
