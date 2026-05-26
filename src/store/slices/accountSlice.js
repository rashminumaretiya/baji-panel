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
  }
)

// GET /self-payment/payment-mode → two-page (gateway-redirect) flow.
// Used when domain config returns isDepositOnePage = false. Shape:
//   { gateways, deposit: { minimumAmount, maximumAmount, quickAmounts },
//     isMadeFirstDeposit, activePaymentMethods: [{ methodId, name, logo, types }] }
export const fetchPaymentMode = createAsyncThunk(
  'account/fetchPaymentMode',
  async (_, { rejectWithValue }) => {
    try {
      const res = await http.get('self-payment/payment-mode')
      return res.data?.data ?? null
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  }
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
  }
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
  }
)

// ─── Deposit (one-page flow, sbex-user-fe parity) ───────────────────────
// Two new endpoints used when domain config returns isDepositOnePage = true:
//   POST /self-deposit/                 → create one-page deposit
//   POST /self-deposit/verify-payment   → confirm trx-id + sender number
// The one-page branch never redirects to a gateway; instead the response
// includes { transactionId, receiver_number } that drives the verify card.
export const submitSelfDeposit = createAsyncThunk(
  'account/submitSelfDeposit',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await http.post('self-deposit/', payload)
      return res.data ?? null
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  }
)

export const verifySelfDeposit = createAsyncThunk(
  'account/verifySelfDeposit',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await http.post('self-deposit/verify-payment', payload)
      return res.data ?? null
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  }
)

// ─── Deposit History ────────────────────────────────────────────────────
// Row transformer — mirrors sbex-user-fe deposit-history.ts:79-91 (toRow):
// hoists the nested transactionId and computes per-row action visibility
// flags from `status`. The Payment Method column reads `gateway` directly,
// so we don't need a bank-image lookup here.
function mapDepositHistoryRows(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map((row) => {
    const status = String(row?.status || '').toLowerCase()
    return {
      ...row,
      transactionId: row?.transaction?.transactionId ?? null,
      isShowComplaint: status === 'pending' && !row?.submittedDone,
      isShowRepayment: status === 'initiated',
    }
  })
}

// GET /self-payment
export const fetchDepositHistory = createAsyncThunk(
  'account/fetchDepositHistory',
  async (params, { rejectWithValue }) => {
    try {
      const res = await http.get('self-payment', { params })
      const page = pageFromRes(res)
      return { ...page, data: mapDepositHistoryRows(page.data) }
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  }
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
  }
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
  }
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
  }
)

// ─── Withdraw History ───────────────────────────────────────────────────
// Mirrors baji-exchange-frontend withdraw-history.component.ts → getWithdrawHistory:
// stamps a payment-method `<img>` HTML string, hoists nested transaction id,
// formats remainingAmount, and prepares the "View Note" link cell.
const WITHDRAW_PAYMENT_IMAGES = {
  bkash: '/img/payment/BKash_logo.svg',
  rocket: '/img/payment/rocket.webp',
  nagad: '/img/payment/Nagad.webp',
  cellfin: '/img/payment/Cellfin.webp',
  upay: '/img/payment/Upay.webp',
}

function mapWithdrawHistoryRows(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map((row) => {
    const method = String(row?.paymentType || '').toLowerCase()
    const img = WITHDRAW_PAYMENT_IMAGES[method] || ''
    return {
      ...row,
      paymentType: img
        ? `<img class="payment-img" src="${img}" alt="payment_image">`
        : '',
      remainingAmount:
        typeof row?.remainingAmount === 'number'
          ? row.remainingAmount.toFixed(2)
          : row?.remainingAmount,
      transactionId: row?.transaction?.transaction_id,
      reasonTemp: row?.reason ? `<a class="rejected-reason">View Note</a>` : '',
    }
  })
}

// GET /sw-request — api.mcv88.live path (Archive-style).
// baji-exchange-frontend production uses `user/sw-request` on api.1ten365.live.
// Token attached explicitly (same pattern used by fetchWithdrawDetails).
export const fetchWithdrawalHistory = createAsyncThunk(
  'account/fetchWithdrawalHistory',
  async (params, { getState, rejectWithValue }) => {
    const token = getState().auth?.user?.token
    if (!token) return rejectWithValue({ message: 'Not authenticated' })
    try {
      const res = await http.get('sw-request', {
        params,
        headers: { Authorization: `Bearer ${token}` },
      })
      const page = pageFromRes(res)
      return { ...page, data: mapWithdrawHistoryRows(page.data) }
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  }
)

// ─── Upline Contacts (Archive parity: AccountService.getAdminContactInfo)
// GET /user/admin-contact-info → { whatsapp:{commonContact}, gmail, facebook,
// messenger, telegram, ... }. We reshape into [{ label, link }] where `label`
// is the iconMap key (see src/components/icons.jsx) and `link` is the
// destination URL (wa.me / mailto / raw).
export const fetchUplineContacts = createAsyncThunk(
  'account/fetchUplineContacts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await http.get('user/admin-contact-info')
      const data = res.data?.data ?? {}
      const reshaped = {
        whatsapp: data.whatsapp
          ? `https://wa.me/${data.whatsapp.commonContact ?? ''}`
          : '',
        gmail: data.gmail ? `mailto:${data.gmail}` : '',
        facebook: data.facebook || '',
        messenger: data.messenger || '',
        telegram: data.telegram || '',
      }
      return Object.entries(reshaped).map(([label, link]) => ({ label, link }))
    } catch (err) {
      return rejectWithValue(rejectErr(err))
    }
  },
  {
    // Dedupe across layouts: every layout dispatches on auth but the request
    // only fires once per session (CLAUDE.md: prefer `condition` over call-site
    // guards). Pass `{ force: true }` to re-fetch (e.g. after re-login).
    condition: (_, { getState }) => {
      const status = getState().account?.uplineContacts?.status
      return status !== 'loading' && status !== 'succeeded'
    },
  }
)

// ─── Slice ──────────────────────────────────────────────────────────────

const initialState = {
  depositHistory: emptyList(),
  withdrawalHistory: emptyList(),

  depositPaymentMethods: { data: null, status: 'idle', error: null },
  paymentMode: { data: null, status: 'idle', error: null },
  promotion: { data: [], status: 'idle', error: null },
  amount: { data: null, status: 'idle', error: null },
  depositSubmit: { data: null, status: 'idle', error: null },
  selfDepositSubmit: { data: null, status: 'idle', error: null },
  selfDepositVerify: { data: null, status: 'idle', error: null },

  withdrawDetails: { data: null, status: 'idle', error: null },
  withdrawRequest: { data: null, status: 'idle', error: null },

  uplineContacts: { data: [], status: 'idle', error: null },
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
      s.selfDepositSubmit = { data: null, status: 'idle', error: null }
      s.selfDepositVerify = { data: null, status: 'idle', error: null }
    },
    resetWithdrawRequest(s) {
      s.withdrawRequest = { data: null, status: 'idle', error: null }
    },
  },
  extraReducers: (b) => {
    applyListCases(b, fetchDepositHistory, 'depositHistory')
    applyListCases(b, fetchWithdrawalHistory, 'withdrawalHistory')

    applySingleCases(b, fetchDepositPaymentMethods, 'depositPaymentMethods')
    applySingleCases(b, fetchPaymentMode, 'paymentMode')
    applySingleCases(b, submitDeposit, 'depositSubmit')
    applySingleCases(b, submitSelfDeposit, 'selfDepositSubmit')
    applySingleCases(b, verifySelfDeposit, 'selfDepositVerify')
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

    // Upline contacts: store the reshaped [{ label, link }] array under .data.
    b.addCase(fetchUplineContacts.pending, (s) => {
      s.uplineContacts.status = 'loading'
      s.uplineContacts.error = null
    })
      .addCase(fetchUplineContacts.fulfilled, (s, { payload }) => {
        s.uplineContacts.status = 'succeeded'
        s.uplineContacts.data = Array.isArray(payload) ? payload : []
      })
      .addCase(fetchUplineContacts.rejected, (s, { payload }) => {
        s.uplineContacts.status = 'failed'
        s.uplineContacts.error = payload?.message || 'Request failed'
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
export const selectDepositHistory = (s) => s.account.depositHistory
export const selectWithdrawalHistory = (s) => s.account.withdrawalHistory
export const selectDepositPaymentMethods = (s) =>
  s.account.depositPaymentMethods
export const selectPaymentMode = (s) => s.account.paymentMode
export const selectPromotion = (s) => s.account.promotion
export const selectDepositSubmit = (s) => s.account.depositSubmit
export const selectSelfDepositSubmit = (s) => s.account.selfDepositSubmit
export const selectSelfDepositVerify = (s) => s.account.selfDepositVerify
export const selectWithdrawDetails = (s) => s.account.withdrawDetails
export const selectWithdrawRequest = (s) => s.account.withdrawRequest
export const selectUplineContacts = (s) => s.account.uplineContacts.data
