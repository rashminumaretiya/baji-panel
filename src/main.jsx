import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from './store/store.js'
import 'bootstrap/dist/css/bootstrap.min.css'
import './style.scss'
import './i18n/index.js'

import { autoLoginFromUrlToken } from './store/slices/authSlice.js'
import { setFullScreenLoader } from './store/slices/commonSlice.js'
import App from './App.jsx'



// SSO: if the URL carries ?token=..., auto-login that user (mirrors app.ts).
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('token')) {
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
