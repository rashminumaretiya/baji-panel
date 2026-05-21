import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { http } from '../../core/http/client.js'
import { environment } from '../../environments/environment.js'
import { PanelTheme } from '../../shared/types/common.js'

const DEFAULT_LOGO = '/img/logo.png'
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

function pickLogo(apiLogo, theme = 'light') {
  if (shouldUseNineWicketsLogo()) return NINE_WICKETS_LOGO
  if (typeof apiLogo === 'string') return apiLogo || DEFAULT_LOGO
  if (apiLogo && typeof apiLogo === 'object') {
    return apiLogo[theme] || apiLogo.light || apiLogo.dark || DEFAULT_LOGO
  }
  return DEFAULT_LOGO
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

export function readIsMobileViewport() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

/** Keeps `common.isMobile` in sync when the viewport crosses the mobile breakpoint. */
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
  selectedTheme: 'light',
  isShowSabaSportBook: true,
  isShowE1Sport: true,
  isMaintenance: null,
  isIPBanned: null,
  isStreamUrlAvailable: false,
  isPlayLiveStream: false,
  promoCode: '',
  keyword: '',
  currentSiteName: '',
  panelTheme: null,
  serverEnv: environment.server,
  logo: DEFAULT_LOGO,
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
  },
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
    setAuthModalType(s, { payload }) {
      s.authModalType = payload
    },
    setCaptcha(s, { payload }) {
      s.captcha = payload
    },
    triggerCaptchaRefresh(s) {
      s.captchaRefresh += 1
    },
    setSelectedTheme(s, { payload }) {
      s.selectedTheme = payload
    },
    setIsMaintenance(s, { payload }) {
      s.isMaintenance = payload
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
    setPromoCode(s, { payload }) {
      s.promoCode = payload || ''
    },
    setKeyword(s, { payload }) {
      s.keyword = payload || ''
    },
    setCurrentSiteName(s, { payload }) {
      s.currentSiteName = payload || ''
    },
    setPanelTheme(s, { payload }) {
      s.panelTheme = payload
    },
    setLogo(s, { payload }) {
      s.logo = payload || DEFAULT_LOGO
    },
    setFavicon(s, { payload }) {
      s.favicon = payload || DEFAULT_FAVICON
    },
    setDomainCurrency(s, { payload }) {
      s.domainCurrency = payload || DEFAULT_CURRENCY
    },
    setNews(s, { payload }) {
      s.news = normalizeNews(payload)
    },
    setGlobalNews(s, { payload }) {
      s.globalNews = normalizeNews(payload)
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

      if (d.panelTheme) s.panelTheme = d.panelTheme
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

      s.isDomainConfigLoaded = true
      s.isDomainConfigLoading = false
    })
  },
})

export const {
  setIsMobile,
  setFullScreenLoader,
  setMainScreenLoader,
  setAuthModalType,
  setCaptcha,
  triggerCaptchaRefresh,
  setSelectedTheme,
  setIsMaintenance,
  setIsIPBanned,
  setStreamUrlAvailable,
  setIsPlayLiveStream,
  setPromoCode,
  setKeyword,
  setCurrentSiteName,
  setPanelTheme,
  setLogo,
  setFavicon,
  setDomainCurrency,
  setNews,
  setGlobalNews,
} = commonSlice.actions

export default commonSlice.reducer

export const selectIsMobile = (s) => s.common.isMobile
export const selectIsFullScreenLoader = (s) => s.common.isFullScreenLoader
export const selectIsMainScreenLoader = (s) => s.common.isMainScreenLoader
export const selectPanelTheme = (s) => s.common.panelTheme
export const selectSelectedTheme = (s) => s.common.selectedTheme
export const selectIsYellowTheme = (s) => {
  const t = s.common.panelTheme
  return t === null || t === PanelTheme.BETJILI
}
export const selectIsMcvYellowTheme = (s) => s.common.panelTheme === PanelTheme.MCV
export const selectIsIPBanned = (s) => s.common.isIPBanned
export const selectIsShowSabaSportBook = (s) => s.common.isShowSabaSportBook
export const selectIsShowE1Sport = (s) => s.common.isShowE1Sport
export const selectIsStreamUrlAvailable = (s) => s.common.isStreamUrlAvailable
export const selectIsPlayLiveStream = (s) => s.common.isPlayLiveStream
export const selectCaptcha = (s) => s.common.captcha
export const selectAuthModalType = (s) => s.common.authModalType
export const selectIsMaintenance = (s) => s.common.isMaintenance
export const selectCurrentSiteName = (s) => s.common.currentSiteName
export const selectKeyword = (s) => s.common.keyword
export const selectPromoCode = (s) => s.common.promoCode
export const selectLogo = (s) => s.common.logo
export const selectFavicon = (s) => s.common.favicon
export const selectDomainCurrency = (s) => s.common.domainCurrency
export const selectAvailableCurrencies = (s) => s.common.availableCurrencies
export const selectDefaultLanguage = (s) => s.common.defaultLanguage
export const selectNews = (s) => s.common.news
export const selectGlobalNews = (s) => s.common.globalNews
export const selectIsSelfSignupAllowed = (s) => s.common.isSelfSignupAllowed
export const selectIsCasinoSuspend = (s) => s.common.isCasinoSuspend
export const selectRedirectUrl = (s) => s.common.redirectUrl
export const selectIsAffiliateSystemAvailable = (s) =>
  s.common.isAffiliateSystemAvailable
export const selectAffiliateUrl = (s) => s.common.affiliateUrl
export const selectAppDownloadLink = (s) => s.common.appDownloadLink
export const selectIsDepositOnePage = (s) => s.common.isDepositOnePage
export const selectRegistrationBonus = (s) => s.common.registrationBonus
export const selectUserLoginAllowDomains = (s) => s.common.userLoginAllowDomains
export const selectIsDomainConfigLoaded = (s) => s.common.isDomainConfigLoaded
