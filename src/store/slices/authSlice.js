import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import { http } from '../../core/http/client.js'
import { fetchDomainConfiguration, setCaptcha } from './commonSlice.js'
import { localStorageService } from '../../shared/services/local-storage.js'
import { LOCALSTORAGE } from '../../shared/types/common.js'

function readPersistedToken() {
  try {
    return localStorageService.getItem(LOCALSTORAGE.TOKEN) || null
  } catch {
    return null
  }
}

function writePersistedToken(token) {
  if (token) localStorageService.setItem(LOCALSTORAGE.TOKEN, token)
  else localStorageService.removeItem(LOCALSTORAGE.TOKEN)
}

const persistedToken = readPersistedToken()

const persistedOneClickBet = (() => {
  try {
    return !!localStorageService.getItem(LOCALSTORAGE.ONE_CLICK_BET)
  } catch {
    return false
  }
})()

const initialState = {
  token: persistedToken,
  user: null,
  wallet: null,
  isOneClickBet: persistedOneClickBet,
  isRefreshBalance: {},
  isLoginWindow: false,
  stakesData: [],
  selectedLanguage: 'en',
}

export const getValidationCode = createAsyncThunk(
  'auth/getValidationCode',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await http.post('auth/captcha', {})
      const captcha = res.data?.data ?? null
      dispatch(setCaptcha(captcha))
      return captcha
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

// Refresh-path hydration: token comes from localStorage, user data is fetched
// fresh from the API on every page load. Returns the user payload (without
// token — the token lives in state.auth.token).
export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.token
    if (!token) return null
    try {
      const res = await http.get('user', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data?.data ?? null
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const autoLoginFromUrlToken = createAsyncThunk(
  'auth/autoLoginFromUrlToken',
  async (_, { getState, dispatch, rejectWithValue }) => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (!token) return null

    const currentToken = getState().auth.token
    if (currentToken === token) {
      stripTokenFromUrl()
      return null
    }

    dispatch(clearAuth())

    try {
      const res = await http.get('user', {
        headers: { Authorization: `Bearer ${token}` },
      })
      stripTokenFromUrl()
      return { token, user: res.data?.data ?? null }
    } catch (err) {
      stripTokenFromUrl()
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

function stripTokenFromUrl() {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.delete('token')
  window.history.replaceState(
    {},
    '',
    url.pathname + (url.search ? url.search : '') + url.hash
  )
}

export const login = createAsyncThunk(
  'auth/login',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await http.post('auth/sign-in', payload)
      const data = res.data?.data
      if (data) return data
      return rejectWithValue(res.data)
    } catch (err) {
      dispatch(getValidationCode())
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await http.post('auth/logout', {})
    } catch {
      /* ignore */
    }
    dispatch(clearAuth())
    return null
  }
)

export const fetchBalance = createAsyncThunk(
  'auth/fetchBalance',
  async (_, { rejectWithValue }) => {
    try {
      const res = await http.get('user/balance')
      return res.data?.data ?? null
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const loadStakes = createAsyncThunk(
  'auth/loadStakes',
  async (_, { getState, rejectWithValue }) => {
    if (!getState().auth.token) return []
    try {
      const res = await http.get('user/stake')
      return Array.isArray(res.data?.data) ? res.data.data : []
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const updateStakes = createAsyncThunk(
  'auth/updateStakes',
  async (stake, { getState, rejectWithValue }) => {
    if (!getState().auth.token) return null
    try {
      const res = await http.put('user/stake', { stake })
      return {
        key: res.data?.key,
        data: Array.isArray(res.data?.data) ? res.data.data : [],
      }
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, { payload }) {
      state.user = payload || null
      if (payload?.language) state.selectedLanguage = payload.language
    },
    setToken(state, { payload }) {
      state.token = payload || null
      writePersistedToken(payload || null)
    },
    clearAuth(state) {
      state.token = null
      state.user = null
      state.wallet = null
      state.isOneClickBet = false
      localStorage.clear()
    },
    setIsOneClickBet(state, { payload }) {
      state.isOneClickBet = !!payload
      if (payload) localStorageService.setItem(LOCALSTORAGE.ONE_CLICK_BET, true)
      else localStorageService.removeItem(LOCALSTORAGE.ONE_CLICK_BET)
    },
    setLoginWindow(state, { payload }) {
      state.isLoginWindow = !!payload
    },
  },
  extraReducers: (b) => {
    b.addCase(login.fulfilled, (state, { payload }) => {
      if (!payload) return
      const { token, ...user } = payload
      if (token) {
        state.token = token
        writePersistedToken(token)
      }
      state.user = user || null
      if (user?.language) state.selectedLanguage = user.language
    })
    b.addCase(fetchUser.fulfilled, (state, { payload }) => {
      if (!payload) return
      state.user = payload
      if (payload.language) state.selectedLanguage = payload.language
    })
    b.addCase(autoLoginFromUrlToken.fulfilled, (state, { payload }) => {
      if (!payload) return
      state.token = payload.token
      writePersistedToken(payload.token)
      state.user = payload.user || null
      if (payload.user?.language) state.selectedLanguage = payload.user.language
    })
    b.addCase(fetchBalance.fulfilled, (state, { payload }) => {
      if (!payload) return
      state.wallet = payload.wallet ?? payload
    })
    b.addCase(loadStakes.fulfilled, (state, { payload }) => {
      state.stakesData = Array.isArray(payload) ? payload : []
    })
    b.addCase(updateStakes.fulfilled, (state, { payload }) => {
      if (payload?.data?.length) state.stakesData = payload.data
    })
    b.addCase(fetchDomainConfiguration.fulfilled, (state, { payload }) => {
      const lang = payload?.defaultLanguage
      if (lang && !state.user) state.selectedLanguage = lang
    })
  },
})

export const {
  setUser,
  setToken,
  clearAuth,
  setIsOneClickBet,
  setLoginWindow,
} = authSlice.actions

export default authSlice.reducer

export const selectToken = (s) => s.auth.token
export const selectUser = (s) => s.auth.user
export const selectIsAuthenticated = (s) => !!s.auth.token
export const selectCurrency = (s) => s.auth.user?.currency
export const selectWallet = (s) => s.auth.wallet

export const selectIsOneClickBet = (s) => s.auth.isOneClickBet
export const selectIsLoginWindow = (s) => s.auth.isLoginWindow
export const selectStakesData = (s) => s.auth.stakesData
export const selectOneClickBetStakes = createSelector(
  [selectStakesData],
  (d) => ({ 1: d[0] || 10, 2: d[1] || 20, 3: d[2] || 50, 4: d[3] || 100 })
)
