// Run once at app startup to bind the axios client to the Redux store + i18n.
// Mirrors the Angular provider chain (headerInterceptor + errorInterceptor).
import i18n from '../../i18n/index.js'
import { store } from '../../store/store.js'
import { setUser } from '../../store/slices/authSlice.js'
import { setIsIPBanned, setFullScreenLoader } from '../../store/slices/commonSlice.js'
import { selectToken } from '../../store/slices/authSlice.js'
import { bindHttpInterceptors } from './client.js'

export function bootstrapHttp() {
  bindHttpInterceptors({
    getToken: () => selectToken(store.getState()),
    onClearAuth: () => store.dispatch(setUser(null)),
    onIpBanned: (payload) => store.dispatch(setIsIPBanned(payload)),
    onLoaderOff: () => store.dispatch(setFullScreenLoader(false)),
    translate: (key, dyn) => i18n.t(key, dyn),
  })
}
