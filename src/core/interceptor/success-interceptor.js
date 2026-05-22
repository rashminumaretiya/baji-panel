import { alertService, resolveApiMessage } from '../../shared/services/alert.js'

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete'])

// Endpoints to never auto-toast on success. Two categories:
//   1. UI shows its own confirmation (`bet/place` → inline FancyWarning).
//   2. Read-via-POST fetches — the server returns `success.*_FETCHED` keys
//      that are technically "successful" but toasting them is noise.
const SILENT_SUCCESS_URLS = [
  'bet/place',
  'sport/default-odds',
  'sport/live-count',
]

export function attachSuccessInterceptor(client, { translate } = {}) {
  client.interceptors.response.use((response) => {
    const config = response?.config ?? {}
    const method = (config.method ?? '').toLowerCase()
    if (!MUTATING_METHODS.has(method)) return response
    // Per-call opt-out — see header notes for usage.
    if (config.meta?.silent || config.meta?.silentSuccess) return response
    const url = config.url ?? ''
    if (SILENT_SUCCESS_URLS.some((p) => url.includes(p))) return response

    const body = response?.data
    const key = body?.key
    if (typeof key !== 'string' || !key.startsWith('success.')) return response

    // Skip read-style keys (`success.X_FETCHED` / `_LOADED` / `_GET`) even on
    // mutation methods. These come from endpoints that POST a body just to
    // shape the query (e.g. `sport/default-odds`) — toasting them is noise.
    if (/(_FETCHED|_LOADED|_GET)$/i.test(key)) return response

    const message = resolveApiMessage(translate ?? null, body, body?.message)
    if (message) alertService.success(message)

    return response
  })
}
