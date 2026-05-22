// Mirrors sbex-user-fe/src/app/features/services/auth.ts state surface + login flow.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { http } from '../../core/http/client.js'
import { setCaptcha } from './commonSlice.js'
import { localStorageService } from '../../shared/services/local-storage.js'
import { LOCALSTORAGE } from '../../shared/types/common.js'

const persistedUser = (() => {
  try {
    return localStorageService.getItem(LOCALSTORAGE.USER)
  } catch {
    return null
  }
})()

const persistedOneClickBet = (() => {
  try {
    return !!localStorageService.getItem(LOCALSTORAGE.ONE_CLICK_BET)
  } catch {
    return false
  }
})()

const initialState = {
  user: persistedUser,
  wallet: null,
  isOneClickBet: persistedOneClickBet,
  isRefreshBalance: {},
  isLoginWindow: false,
  stakesData: [],
  selectedLanguage: persistedUser?.language || 'en',
}

// Ports authService.getValidationCode() — POST /auth/captcha.
// Stores the captcha into common.captcha (so Header can render the code).
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
  },
)

// Ports app.ts handleTokenAuthentication() — when the URL carries ?token=...,
// fetch the user via GET /user with an explicit Bearer header, persist as the
// authenticated user, and strip the token from the URL.
export const autoLoginFromUrlToken = createAsyncThunk(
  'auth/autoLoginFromUrlToken',
  async (_, { getState, dispatch, rejectWithValue }) => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (!token) return null

    const currentToken = getState().auth.user?.token
    if (currentToken === token) {
      stripTokenFromUrl()
      return null
    }

    // Clear any stale session, mirror Angular's setIsAuthenticated() (no-arg).
    dispatch(setUser(null))

    try {
      const res = await http.get('user', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const user = { ...(res.data?.data ?? {}), token }
      localStorageService.setItem(LOCALSTORAGE.USER, user)
      stripTokenFromUrl()
      return user
    } catch (err) {
      stripTokenFromUrl()
      return rejectWithValue(err.response?.data || err.message)
    }
  },
)

function stripTokenFromUrl() {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.delete('token')
  window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash)
}

// Ports authService.login() — POST /auth/sign-in with {userName, password, code, captchaId}.
// On success the user is persisted (encrypted) and isAuthenticated becomes true.
export const login = createAsyncThunk(
  'auth/login',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await http.post('auth/sign-in', payload)
      const user = res.data?.data
      if (user) {
        localStorageService.setItem(LOCALSTORAGE.USER, user)
        return user
      }
      return rejectWithValue(res.data)
    } catch (err) {
      // Angular re-fetches captcha on login failure.
      dispatch(getValidationCode())
      return rejectWithValue(err.response?.data || err.message)
    }
  },
)

// Ports authService.logOut() — POST /auth/logout, then clear state regardless
// of the API response (mirrors Angular's behavior: always reset auth on logout).
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await http.post('auth/logout', {})
    } catch {
      // Ignore — proceed to clear local state anyway.
    }
    dispatch(setUser(null))
    return null
  },
)

// Mirrors authService.getBalance() — GET user/balance
export const fetchBalance = createAsyncThunk(
  'auth/fetchBalance',
  async (_, { rejectWithValue }) => {
    try {
      const res = await http.get('user/balance')
      return res.data?.data ?? null
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, { payload }) {
      state.user = payload || null
      if (payload) {
        localStorageService.setItem(LOCALSTORAGE.USER, payload)
        if (payload.language) state.selectedLanguage = payload.language
      } else {
        localStorage.clear()
        state.isOneClickBet = false
      }
    },
    setWallet(state, { payload }) {
      state.wallet = payload
    },
    setIsOneClickBet(state, { payload }) {
      state.isOneClickBet = !!payload
      if (payload) localStorageService.setItem(LOCALSTORAGE.ONE_CLICK_BET, true)
      else localStorageService.removeItem(LOCALSTORAGE.ONE_CLICK_BET)
    },
    setLoginWindow(state, { payload }) {
      state.isLoginWindow = !!payload
    },
    setStakesData(state, { payload }) {
      state.stakesData = payload || []
    },
    setSelectedLanguage(state, { payload }) {
      state.selectedLanguage = payload
    },
    refreshBalance(state) {
      state.isRefreshBalance = {}
    },
  },
  extraReducers: (b) => {
    b.addCase(login.fulfilled, (state, { payload }) => {
      state.user = payload || null
      if (payload?.language) state.selectedLanguage = payload.language
    })
    b.addCase(autoLoginFromUrlToken.fulfilled, (state, { payload }) => {
      if (payload) {
        state.user = payload
        if (payload.language) state.selectedLanguage = payload.language
      }
    })
    b.addCase(fetchBalance.fulfilled, (state, { payload }) => {
      if (!payload) return
      const wallet = payload.wallet ?? payload
      state.wallet = wallet
      if (state.user) {
        state.user = { ...state.user, wallet }
        localStorageService.setItem(LOCALSTORAGE.USER, state.user)
      }
    })
  },
})

export const {
  setUser,
  setWallet,
  setIsOneClickBet,
  setLoginWindow,
  setStakesData,
  setSelectedLanguage,
  refreshBalance,
} = authSlice.actions

export default authSlice.reducer

// Selectors mirroring Angular's computed signals.
export const selectUser = (s) => s.auth.user
export const selectIsAuthenticated = (s) => !!s.auth.user
export const selectToken = (s) => s.auth.user?.token
export const selectCurrency = (s) => s.auth.user?.currency
export const selectWallet = (s) => s.auth.wallet
export const selectIsOneClickBet = (s) => s.auth.isOneClickBet
export const selectIsLoginWindow = (s) => s.auth.isLoginWindow
export const selectSelectedLanguage = (s) => s.auth.selectedLanguage
export const selectIsUserNameWithHash = (s) =>
  s.auth.user?.profileDetails?.userName?.startsWith('#') ?? false
export const selectIsSelfSignUp = (s) => !!s.auth.user?.isSelfSignUp
export const selectStakesData = (s) => s.auth.stakesData
export const selectOneClickBetStakes = (s) => {
  const d = s.auth.stakesData
  return { 1: d[0] || 10, 2: d[1] || 20, 3: d[2] || 50, 4: d[3] || 100 }
}
// isShowHeader: authed OR development server (mirrors Angular).
export const selectIsShowHeader = (s) =>
  !!s.auth.user || s.common?.serverEnv === 'development'
