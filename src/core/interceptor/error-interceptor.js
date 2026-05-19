// Ported from sbex-user-fe/src/app/core/interceptor/error-interceptor.ts
// Wires the response error handler. Pass in store + i18n + navigate so it can
// behave like the Angular interceptor (clear auth + redirect on 401/499,
// trigger IP-ban state on 481, skip global toast for bet-place errors).
import { alertService } from '../../shared/services/alert.js'

const IGNORE_KEYS = new Set(['errors.UNAUTHENTICATED', 'errors.TOKEN_REQUIRED'])

function fallbackKey(status) {
  if (status >= 500) return 'errors.SERVER_ERROR'
  if (status === 404) return 'errors.NOT_FOUND'
  if (status === 0) return 'errors.UNABLE_TO_HANDLE_REQUEST'
  return ''
}

export function attachErrorInterceptor(client, { onClearAuth, onIpBanned, onLoaderOff, translate }) {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.config?.url?.includes('/i18n/')) return Promise.reject(error)

      onLoaderOff?.()
      const status = error.response?.status ?? 0
      const err = error.response?.data ?? {}

      if (status === 481) {
        onIpBanned?.({ isIPBanned: true, ip: err?.data?.ip })
        return Promise.reject(error)
      }

      if (error.config?.url?.includes('bet/place')) {
        return Promise.reject(error)
      }

      const baseMsg = err?.key
        ? (translate ? translate(err.key, err.dynamicValue ?? {}) : err.message || err.key)
        : err?.message || ''
      const finalMsg = err?.key && baseMsg === err.key ? err?.message || 'errors.SOMETHING_WENT_WRONG' : baseMsg

      if (!finalMsg) return Promise.reject(error)

      if ([401, 499].includes(status)) {
        if (!err?.key || !IGNORE_KEYS.has(err.key)) alertService.error(finalMsg)
        onClearAuth?.()
        return Promise.reject(error)
      }

      alertService.error(finalMsg || fallbackKey(status))
      return Promise.reject(error)
    },
  )
}
