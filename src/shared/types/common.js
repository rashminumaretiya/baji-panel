export const LOCALSTORAGE = Object.freeze({
  USER: 'user',
  ONE_CLICK_BET: 'oneClickBet',
  ONE_CLICK_ATTENTION: 'oneClickAttention',
  DEVICE_ID: 'deviceId',
})

export const AuthModalType = Object.freeze({
  LOGIN: 'login',
  SIGNUP: 'signup',
  FORGOT_PASSWORD: 'forgot-password',
  RESET_PASSWORD: 'reset-password',
})

//need to change in future when get dynamic
export const PanelTheme = Object.freeze({
  MCV: 'BAJI',
  BAJI: 'BAJI',
  BETJILI: 'BAJI',
})

//need to change in future when get dynamic
export const THEME_BODY_CLASSES = Object.freeze({
  [PanelTheme.MCV]: '',
  [PanelTheme.BETJILI]: '',
  [PanelTheme.BAJI]: '',
})

export const ALL_THEME_BODY_CLASSES = Object.freeze([
  'mcv-yellow-theme',
  'yellow-theme',
])

export function resolveThemeBodyClass(panelTheme) {
  if (!panelTheme) return THEME_BODY_CLASSES[PanelTheme.BETJILI]
  return THEME_BODY_CLASSES[panelTheme] ?? ''
}
