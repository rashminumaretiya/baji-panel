import { alertService, resolveApiMessage } from '../../shared/services/alert.js'

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete'])
const SILENT_SUCCESS_URLS = [
  'bet/place',
  'sport/default-odds',
  'sport/live-count',
  'auth/captcha',
  'auth/sign-in',
  'auth/logout',
]

export function attachSuccessInterceptor(client, { translate } = {}) {
  client.interceptors.response.use((response) => {
    const config = response?.config ?? {}
    const method = (config.method ?? '').toLowerCase()
    if (!MUTATING_METHODS.has(method)) return response

    if (config.meta?.silent || config.meta?.silentSuccess) return response
    const url = config.url ?? ''
    if (SILENT_SUCCESS_URLS.some((p) => url.includes(p))) return response

    const body = response?.data
    const key = body?.key
    if (typeof key !== 'string' || !key.startsWith('success.')) return response
    if (/(_FETCHED|_LOADED|_GET)$/i.test(key)) return response

    const message = resolveApiMessage(translate ?? null, body, body?.message)
    if (message) alertService.success(message)

    return response
  })
}
