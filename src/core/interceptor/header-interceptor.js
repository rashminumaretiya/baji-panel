// Ported from sbex-user-fe/src/app/core/interceptor/header-interceptor.ts
// Adds 'ngrok-skip-browser-warning' and the Bearer token from Redux auth state.
export function attachHeaderInterceptor(client, getToken) {
  client.interceptors.request.use((config) => {
    config.headers = config.headers || {}
    config.headers['ngrok-skip-browser-warning'] = 'true'
    const token = getToken?.()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  })
}
