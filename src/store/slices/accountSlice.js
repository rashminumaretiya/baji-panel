// Mirrors baji-exchange-frontend (production branch) AccountService.
// Only the endpoints used by my assigned pages:
//   Activity Log, Deposit, Deposit History, Withdraw, Withdraw History.
//
// Token is attached automatically by the request interceptor wired in
// core/http/bootstrap.js (reads selectToken from authSlice).
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { http } from '../../core/http/client.js'

function emptyList() {
  return { data: [], totalCount: 0, status: 'idle', error: null }
}

function rejectErr(err) {
  return err.response?.data || err.message
}

function pageFromRes(res) {
  const data = res.data?.data ?? {}
  return {
    data: Array.isArray(data?.data) ? data.data : [],
    totalCount: data?.totalCount ?? 0,
  }
}

// ─── Activity Log ───────────────────────────────────────────────────────
// GET /user/activity-logs
export const fetchActivityLogs = createAsyncThunk(
  'account/fetchActivityLogs',
  async (params, { rejectWithValue }) => {
    try {
      const res = await http.get('user/activity-logs', { params })
      return pageFromRes(res)
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  },
)

// ─── Deposit ────────────────────────────────────────────────────────────
// GET /self-deposit/payment-methods → returns
// { paymentMethods: [{ method_id, payment_method, types: [{type, status, is_available, min, max}] }],
//   privacySettings: {}, quickAmounts: [{amount, _id}] }
export const fetchDepositPaymentMethods = createAsyncThunk(
  'account/fetchDepositPaymentMethods',
  async (_, { rejectWithValue }) => {
    try {
      const res = await http.get('self-deposit/payment-methods')
      return res.data?.data ?? null
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  },
)

// GET /promotion(/list) → only the authed variant when logged in.
export const fetchPromotion = createAsyncThunk(
  'account/fetchPromotion',
  async (_, { getState, rejectWithValue }) => {
    try {
      const path = getState().auth?.user ? 'promotion/list' : 'promotion'
      const res = await http.get(path)
      return res.data?.data?.data ?? res.data?.data ?? []
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  },
)

// GET /self-payment/PBU → currency conversion preview (pbu/base).
export const fetchAmount = createAsyncThunk(
  'account/fetchAmount',
  async (params, { rejectWithValue }) => {
    try {
      const res = await http.get('self-payment/PBU', { params })
      return res.data?.data ?? null
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  },
)

// POST /self-payment/payment → create deposit (Angular: payout()).
export const submitDeposit = createAsyncThunk(
  'account/submitDeposit',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await http.post('self-payment/payment', payload)
      return res.data?.data ?? null
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  },
)

// ─── Deposit History ────────────────────────────────────────────────────
// GET /self-payment
export const fetchDepositHistory = createAsyncThunk(
  'account/fetchDepositHistory',
  async (params, { rejectWithValue }) => {
    try {
      const res = await http.get('self-payment', { params })
      return pageFromRes(res)
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  },
)

// DELETE /self-payment/:id
export const deletePaymentHistory = createAsyncThunk(
  'account/deletePaymentHistory',
  async (id, { rejectWithValue }) => {
    try {
      const res = await http.delete(`self-payment/${id}`)
      return res.data?.data ?? null
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  },
)

// POST /self-payment/complaint/:trxId
export const sendDepositComplaint = createAsyncThunk(
  'account/sendDepositComplaint',
  async ({ trxId, payload }, { rejectWithValue }) => {
    try {
      const res = await http.post(`self-payment/complaint/${trxId}`, payload)
      return res.data?.data ?? null
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  },
)

// ─── Withdraw ───────────────────────────────────────────────────────────
// GET /sw-request/details — api.mcv88.live path (Archive-style).
// baji-exchange-frontend production points at `user/sw-request-details`
// on api.1ten365.live; the path differs per backend.
//
// Note: the request-header interceptor (core/interceptor/header-interceptor.js)
// is supposed to attach the Bearer token automatically. In this codebase that
// path was returning "errors.TOKEN_REQUIRED", so we read the token from state
// and pass it explicitly here — same pattern other Profile pages use
// (BetsComplaints, AccountStatement, BalanceOverview, Profile).
export const fetchWithdrawDetails = createAsyncThunk(
  'account/fetchWithdrawDetails',
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth?.user?.token
    if (!token) return rejectWithValue({ message: 'Not authenticated' })
    try {
      const res = await http.get('sw-request/details', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data?.data ?? null
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  },
)

// POST /sw-request → default gateway on api.mcv88.live (Archive-style path).
// baji-exchange-frontend production uses `user/sw-request` on api.1ten365.live.
// Token attached explicitly (same pattern used by fetchWithdrawDetails and
// other Profile thunks in this codebase).
export const createWithdrawRequest = createAsyncThunk(
  'account/createWithdrawRequest',
  async (payload, { getState, rejectWithValue }) => {
    const token = getState().auth?.user?.token
    if (!token) return rejectWithValue({ message: 'Not authenticated' })
    try {
      const res = await http.post('sw-request', payload, {
        headers: { Authorization: `Bearer ${token}`, hideError: 'true' },
      })
      return res.data?.data ?? null
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  },
)

// POST /catopay/refund → catopay gateway path.
export const createCatopayWithdrawRequest = createAsyncThunk(
  'account/createCatopayWithdrawRequest',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await http.post('catopay/refund', payload, {
        headers: { hideError: 'true' },
      })
      return res.data?.data ?? null
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  },
)

// ─── Withdraw History ───────────────────────────────────────────────────
// GET /user/sw-request
export const fetchWithdrawalHistory = createAsyncThunk(
  'account/fetchWithdrawalHistory',
  async (params, { rejectWithValue }) => {
    try {
      const res = await http.get('user/sw-request', { params })
      return pageFromRes(res)
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  },
)

// ─── Slice ──────────────────────────────────────────────────────────────

const initialState = {
  activityLogs: emptyList(),
  depositHistory: emptyList(),
  withdrawalHistory: emptyList(),

  depositPaymentMethods: { data: null, status: 'idle', error: null },
  promotion: { data: [], status: 'idle', error: null },
  amount: { data: null, status: 'idle', error: null },
  depositSubmit: { data: null, status: 'idle', error: null },

  withdrawDetails: { data: null, status: 'idle', error: null },
  withdrawRequest: { data: null, status: 'idle', error: null },
}

function applyListCases(builder, thunk, key) {
  builder
    .addCase(thunk.pending, (s) => {
      s[key].status = 'loading'
      s[key].error = null
    })
    .addCase(thunk.fulfilled, (s, { payload }) => {
      s[key].status = 'succeeded'
      s[key].data = payload?.data || []
      s[key].totalCount = payload?.totalCount || 0
    })
    .addCase(thunk.rejected, (s, { payload }) => {
      s[key].status = 'failed'
      s[key].error = payload?.message || 'Request failed'
    })
}

function applySingleCases(builder, thunk, key) {
  builder
    .addCase(thunk.pending, (s) => {
      s[key].status = 'loading'
      s[key].error = null
    })
    .addCase(thunk.fulfilled, (s, { payload }) => {
      s[key].status = 'succeeded'
      s[key].data = payload
    })
    .addCase(thunk.rejected, (s, { payload }) => {
      s[key].status = 'failed'
      s[key].error = payload?.message || 'Request failed'
    })
}

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    resetDepositSubmit(s) {
      s.depositSubmit = { data: null, status: 'idle', error: null }
    },
    resetWithdrawRequest(s) {
      s.withdrawRequest = { data: null, status: 'idle', error: null }
    },
  },
  extraReducers: (b) => {
    applyListCases(b, fetchActivityLogs, 'activityLogs')
    applyListCases(b, fetchDepositHistory, 'depositHistory')
    applyListCases(b, fetchWithdrawalHistory, 'withdrawalHistory')

    applySingleCases(b, fetchDepositPaymentMethods, 'depositPaymentMethods')
    applySingleCases(b, fetchAmount, 'amount')
    applySingleCases(b, submitDeposit, 'depositSubmit')
    applySingleCases(b, fetchWithdrawDetails, 'withdrawDetails')

    // Promotion stores the array directly under .data
    b.addCase(fetchPromotion.pending, (s) => {
      s.promotion.status = 'loading'
      s.promotion.error = null
    })
      .addCase(fetchPromotion.fulfilled, (s, { payload }) => {
        s.promotion.status = 'succeeded'
        s.promotion.data = Array.isArray(payload) ? payload : []
      })
      .addCase(fetchPromotion.rejected, (s, { payload }) => {
        s.promotion.status = 'failed'
        s.promotion.error = payload?.message || 'Request failed'
      })

    // Both gateway variants share the same withdrawRequest slot.
    ;[createWithdrawRequest, createCatopayWithdrawRequest].forEach((thunk) => {
      b.addCase(thunk.pending, (s) => {
        s.withdrawRequest.status = 'loading'
        s.withdrawRequest.error = null
      })
        .addCase(thunk.fulfilled, (s, { payload }) => {
          s.withdrawRequest.status = 'succeeded'
          s.withdrawRequest.data = payload
        })
        .addCase(thunk.rejected, (s, { payload }) => {
          s.withdrawRequest.status = 'failed'
          s.withdrawRequest.error = payload?.message || 'Request failed'
        })
    })
  },
})

export const { resetDepositSubmit, resetWithdrawRequest } = accountSlice.actions
export default accountSlice.reducer

// ─── Selectors ──────────────────────────────────────────────────────────
export const selectActivityLogs = (s) => s.account.activityLogs
export const selectDepositHistory = (s) => s.account.depositHistory
export const selectWithdrawalHistory = (s) => s.account.withdrawalHistory
export const selectDepositPaymentMethods = (s) => s.account.depositPaymentMethods
export const selectPromotion = (s) => s.account.promotion
export const selectAmount = (s) => s.account.amount
export const selectDepositSubmit = (s) => s.account.depositSubmit
export const selectWithdrawDetails = (s) => s.account.withdrawDetails
export const selectWithdrawRequest = (s) => s.account.withdrawRequest
