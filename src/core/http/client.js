// Axios client mirroring Angular HttpClient + interceptor chain.
// Bound to the Redux store and i18next at app startup so the interceptors
// can read the current Bearer token and translate error keys.
import axios from 'axios'
import { environment } from '../../environments/environment.js'
import { attachHeaderInterceptor } from '../interceptor/header-interceptor.js'
import { attachErrorInterceptor } from '../interceptor/error-interceptor.js'
import { attachSuccessInterceptor } from '../interceptor/success-interceptor.js'

export const http = axios.create({
  baseURL: environment.apiUrl,
})

export function bindHttpInterceptors({
  getToken,
  onClearAuth,
  onIpBanned,
  onLoaderOff,
  translate,
}) {
  attachHeaderInterceptor(http, getToken)
  attachSuccessInterceptor(http, { translate })
  attachErrorInterceptor(http, {
    onClearAuth,
    onIpBanned,
    onLoaderOff,
    translate,
  })
}
