import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from './store/store.js'
import './index.css'
import i18n from './i18n/index.js'
import {
  autoLoginFromUrlToken,
  fetchUser,
  selectToken,
} from './store/slices/authSlice.js'
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
// Socket handshake competes with the critical JS chain for network/CPU. Defer
// it past first paint — odds_update is live data that's only useful once the
// UI is up, and bindSocketHandlers is idempotent so subscribeEvents calls
// later in the render lifecycle still init the socket lazily if needed.
const deferSocket = () => bootstrapSocket()
if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  window.requestIdleCallback(deferSocket, { timeout: 2000 })
} else {
  setTimeout(deferSocket, 0)
}
setupMobileBreakpointListener(store)
redirectPreviousTab()

// BroadcastChannel doesn't deliver a message to its own sender, so only the
// pre-existing tabs receive 'newTabOpened' and redirect away — the freshly
// opened tab keeps the session.
function redirectPreviousTab() {
  if (typeof BroadcastChannel === 'undefined') return
  const channel = new BroadcastChannel('site-activity')
  channel.onmessage = (event) => {
    if (event.data === 'newTabOpened') {
      window.location.href = 'https://www.google.com/'
    }
  }
  channel.postMessage('newTabOpened')
}

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

if (typeof window !== 'undefined') {
  const urlToken = new URLSearchParams(window.location.search).get('token')
  if (urlToken) {
    // SSO hand-off from baji-react: token in the URL, fetch user with it and
    // persist the token afterwards.
    store.dispatch(setFullScreenLoader(true))
    store
      .dispatch(autoLoginFromUrlToken())
      .finally(() => store.dispatch(setFullScreenLoader(false)))
  } else if (selectToken(store.getState())) {
    // Refresh path: token survived in localStorage; user data is not persisted
    // so refetch it before the UI renders authenticated state.
    store.dispatch(setFullScreenLoader(true))
    store
      .dispatch(fetchUser())
      .finally(() => store.dispatch(setFullScreenLoader(false)))
  }
}

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
)
