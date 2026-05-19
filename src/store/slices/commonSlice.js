// Mirrors sbex-user-fe/src/app/shared/services/common.ts state surface.
import { createSlice } from '@reduxjs/toolkit'
import { environment } from '../../environments/environment.js'
import { PanelTheme } from '../../shared/types/common.js'

const initialState = {
  isMobile: typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(max-width: 767px)').matches
    : false,
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
}

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
} = commonSlice.actions

export default commonSlice.reducer

export const selectIsMobile = (s) => s.common.isMobile
export const selectIsFullScreenLoader = (s) => s.common.isFullScreenLoader
export const selectIsMainScreenLoader = (s) => s.common.isMainScreenLoader
export const selectPanelTheme = (s) => s.common.panelTheme
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
