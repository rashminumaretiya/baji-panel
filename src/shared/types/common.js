export const LOCALSTORAGE = Object.freeze({
  USER: 'user',
  ONE_CLICK_BET: 'oneClickBet',
  ONE_CLICK_ATTENTION: 'oneClickAttention',
  DEVICE_ID: 'deviceId',
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

export const CURRENCY_TYPE = Object.freeze({
  USD: 'USD',
  BDT: 'BDT',
  INR: 'INR',
})

export const WITHDRAW_PAYMENT_METHODS = [
  { name: 'bkash', img: '/img/payment/BKash_logo.svg', value: 'BKASH' },
  { name: 'nagad', img: '/img/payment/Nagad.jpeg', value: 'NAGAD' },
  { name: 'rocket', img: '/img/payment/rocket.png', value: 'ROCKET' },
]

export const onlyDigitsRegex = /^[0-9]+(\.[0-9]+)?$/
