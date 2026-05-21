import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice.js'
import betSlipReducer from './slices/betSlipSlice.js'
import commonReducer from './slices/commonSlice.js'
import layoutReducer from './slices/layoutSlice.js'
import sportReducer from './slices/sportSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    betSlip: betSlipReducer,
    common: commonReducer,
    layout: layoutReducer,
    sport: sportReducer,
  },
})
