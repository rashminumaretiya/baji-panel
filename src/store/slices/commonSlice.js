import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { http } from '../../core/http/client.js'
import { environment } from '../../environments/environment.js'
import { PanelTheme } from '../../shared/types/common.js'
import {
  getCachedPanelTheme,
  getCachedSelectedTheme,
} from '../../shared/services/theme-cache.js'

const DEFAULT_FAVICON = '/favicon.ico'
const DEFAULT_CURRENCY = 'PBU'
const DEFAULT_LANGUAGE = 'en'
const NINE_WICKETS_LOGO = '/img/9wickets-logo.png'
const NINE_WICKETS_HOSTS = ['babu365', 'velkiex247']

function shouldUseNineWicketsLogo() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return NINE_WICKETS_HOSTS.some((h) => host.includes(h))
}

// Resolve the logo URL from the API payload:
//   - 9wickets host override always wins (legacy domain-specific branding).
//   - Backend may send a plain string or `{ light, dark }`.
//   - When nothing usable is supplied (`{ light: null, dark: null }`),
//     return `null` — the <Header /> hides the <img> entirely in that case.
function pickLogo(apiLogo, theme = 'light') {
  if (shouldUseNineWicketsLogo()) return NINE_WICKETS_LOGO
  if (typeof apiLogo === 'string') return apiLogo || null
  if (apiLogo && typeof apiLogo === 'object') {
    return apiLogo[theme] || apiLogo.light || apiLogo.dark || null
  }
  return null
}

function pickFavicon(apiFavicon) {
  if (!apiFavicon) return DEFAULT_FAVICON
  if (typeof apiFavicon === 'string') return apiFavicon
  return apiFavicon.url || DEFAULT_FAVICON
}

function normalizeNews(item) {
  if (!item) return null
  const { expiredAt = null, message = '', _id, ...rest } = item
  return { ...rest, _id, expiredAt, message: String(message ?? '') }
}

export const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

function readIsMobileViewport() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

export function setupMobileBreakpointListener(store) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}

  const media = window.matchMedia(MOBILE_MEDIA_QUERY)
  const sync = () => store.dispatch(setIsMobile(media.matches))

  sync()
  media.addEventListener('change', sync)
  return () => media.removeEventListener('change', sync)
}

const initialState = {
  isMobile: readIsMobileViewport(),
  isFullScreenLoader: false,
  isMainScreenLoader: false,
  authModalType: null,
  captcha: null,
  captchaRefresh: 0,
  selectedTheme: getCachedSelectedTheme(),
  isShowSabaSportBook: true,
  isShowE1Sport: true,
  isMaintenance: null,
  isIPBanned: null,
  isStreamUrlAvailable: false,
  isPlayLiveStream: false,
  promoCode: '',
  keyword: '',
  currentSiteName: '',
  panelTheme: getCachedPanelTheme() ?? PanelTheme.BAJI,
  serverEnv: environment.server,
  logo: null,
  favicon: DEFAULT_FAVICON,
  domainCurrency: DEFAULT_CURRENCY,
  availableCurrencies: [],
  defaultLanguage: DEFAULT_LANGUAGE,
  news: null,
  globalNews: null,
  isSelfSignupAllowed: false,
  isCasinoSuspend: false,
  redirectUrl: '',
  isAffiliateSystemAvailable: false,
  affiliateUrl: '',
  appDownloadLink: '',
  isDepositOnePage: false,
  registrationBonus: null,
  userLoginAllowDomains: [],
  allowedSbGames: [],
  isDomainConfigLoaded: false,
  isDomainConfigLoading: false,
}

export const fetchDomainConfiguration = createAsyncThunk(
  'common/fetchDomainConfiguration',
  async (_, { rejectWithValue }) => {
    try {
      const res = await http.get('auth/domain-configuration')
      return res.data?.data ?? {}
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  },
  {
    condition: (_, { getState }) => {
      const s = getState().common
      if (s.isDomainConfigLoading) return false
      if (s.isDomainConfigLoaded) return false
      return true
    },
  }
)

const commonSlice = createSlice({
  name: 'common',
  initialState,
  reducers: {
    setIsMobile(s, { payload }) {
      s.isMobile = !!payload
    },
    setFullScreenLoader(s, { payload }) {
      s.isFullScreenLoader = !!payload
    },
    setMainScreenLoader(s, { payload }) {
      s.isMainScreenLoader = !!payload
    },
    setCaptcha(s, { payload }) {
      s.captcha = payload
    },
    setIsIPBanned(s, { payload }) {
      s.isIPBanned = payload
    },
    setStreamUrlAvailable(s, { payload }) {
      s.isStreamUrlAvailable = !!payload
    },
    setIsPlayLiveStream(s, { payload }) {
      s.isPlayLiveStream = !!payload
    },
    setCurrentSiteName(s, { payload }) {
      s.currentSiteName = payload || ''
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchDomainConfiguration.pending, (s) => {
      s.isDomainConfigLoading = true
    })
    b.addCase(fetchDomainConfiguration.rejected, (s) => {
      s.isDomainConfigLoading = false
    })
    b.addCase(fetchDomainConfiguration.fulfilled, (s, { payload }) => {
      const d = payload || {}

      s.logo = pickLogo(d.logo, s.selectedTheme)
      s.favicon = pickFavicon(d.favicon)
      s.domainCurrency = d.defaultCurrency || DEFAULT_CURRENCY
      s.availableCurrencies = Array.isArray(d.currency) ? d.currency : []
      s.news = normalizeNews(d.broadcastMessage)
      s.globalNews = normalizeNews(d.globalBroadcastMessage)
      s.panelTheme = d.panelTheme || s.panelTheme || PanelTheme.BAJI
      if (d.defaultLanguage) s.defaultLanguage = d.defaultLanguage
      s.isSelfSignupAllowed = !!d.isSelfSignupAllowed
      s.isCasinoSuspend = !!d.isCasinoSuspend
      s.redirectUrl = d.redirectUrl || ''
      s.isAffiliateSystemAvailable = !!d.isAffiliateSystemAvailable
      s.affiliateUrl = d.affiliateUrl || ''
      s.appDownloadLink = d.appDownloadLink || ''
      s.isDepositOnePage = !!d.isDepositOnePage
      s.registrationBonus = d.registrationBonus || null
      s.userLoginAllowDomains = Array.isArray(d.userLoginAllowDomains)
        ? d.userLoginAllowDomains
        : []
      s.allowedSbGames = Array.isArray(d.allowedSbGames) ? d.allowedSbGames : []

      s.isDomainConfigLoaded = true
      s.isDomainConfigLoading = false
    })
  },
})

export const {
  setIsMobile,
  setFullScreenLoader,
  setMainScreenLoader,
  setCaptcha,
  setIsIPBanned,
  setStreamUrlAvailable,
  setIsPlayLiveStream,
  setCurrentSiteName,
} = commonSlice.actions

export default commonSlice.reducer

export const selectIsMobile = (s) => s.common.isMobile
export const selectIsFullScreenLoader = (s) => s.common.isFullScreenLoader
export const selectIsMainScreenLoader = (s) => s.common.isMainScreenLoader
export const selectCaptcha = (s) => s.common.captcha
export const selectIsStreamUrlAvailable = (s) => s.common.isStreamUrlAvailable
export const selectPanelTheme = (s) => s.common.panelTheme
export const selectIsYellowTheme = (s) => {
  const t = s.common.panelTheme
  return t === null || t === PanelTheme.BETJILI
}
export const selectIsMcvYellowTheme = (s) =>
  s.common.panelTheme === PanelTheme.MCV
export const selectIsPlayLiveStream = (s) => s.common.isPlayLiveStream
export const selectCurrentSiteName = (s) => s.common.currentSiteName
export const selectLogo = (s) => s.common.logo
export const selectFavicon = (s) => s.common.favicon
export const selectNews = (s) => s.common.news
export const selectGlobalNews = (s) => s.common.globalNews
export const selectIsDepositOnePage = (s) => s.common.isDepositOnePage
export const selectRegistrationBonus = (s) => s.common.registrationBonus
export const selectUserLoginAllowDomains = (s) => s.common.userLoginAllowDomains
export const selectAllowedSbGames = (s) => s.common.allowedSbGames
export const selectIsDomainConfigLoaded = (s) => s.common.isDomainConfigLoaded
