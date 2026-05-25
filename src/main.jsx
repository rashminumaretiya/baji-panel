import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from './store/store.js'
import './index.css'
import i18n from './i18n/index.js'
import { autoLoginFromUrlToken } from './store/slices/authSlice.js'
import {
  setFullScreenLoader,
  setupMobileBreakpointListener,
} from './store/slices/commonSlice.js'
import { bootstrapHttp } from './core/http/bootstrap.js'
import { bootstrapSocket } from './core/socket/bootstrap.js'
import {
  applyCachedThemeBodyClass,
  cacheTheme,
} from './shared/services/theme-cache.js'
import App from './App.jsx'

applyCachedThemeBodyClass()
bootstrapHttp()
bootstrapSocket()
setupMobileBreakpointListener(store)

let prevPanelTheme = store.getState().common.panelTheme
let prevSelectedTheme = store.getState().common.selectedTheme
let prevLanguage = store.getState().auth.selectedLanguage
if (prevLanguage && i18n.language !== prevLanguage) {
  i18n.changeLanguage(prevLanguage)
}
store.subscribe(() => {
  const { panelTheme, selectedTheme } = store.getState().common
  if (panelTheme !== prevPanelTheme || selectedTheme !== prevSelectedTheme) {
    cacheTheme({ panelTheme, selectedTheme })
    prevPanelTheme = panelTheme
    prevSelectedTheme = selectedTheme
  }
  const lang = store.getState().auth.selectedLanguage
  if (lang && lang !== prevLanguage) {
    prevLanguage = lang
    if (i18n.language !== lang) i18n.changeLanguage(lang)
  }
})

if (
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('token')
) {
  store.dispatch(setFullScreenLoader(true))
  store
    .dispatch(autoLoginFromUrlToken())
    .finally(() => store.dispatch(setFullScreenLoader(false)))
}

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
)
