function normalizeUrl(url) {
  if (!url) return ''
  return url.endsWith('/') ? url : `${url}/`
}

export const environment = {
  production: import.meta.env.PROD,
  apiUrl: normalizeUrl(import.meta.env.VITE_API_URL || ''),
  socketUrl: import.meta.env.VITE_SOCKET_URL || '',
  cloudySignUrl: normalizeUrl(import.meta.env.VITE_CLOUDYSIGN_API_URL || ''),
  casinoUrl: normalizeUrl(import.meta.env.VITE_CASINO_API_URL || ''),
  awcCasinoUrl: normalizeUrl(import.meta.env.VITE_AWC_CASINO_API_URL || ''),
  gscCasinoUrl: normalizeUrl(import.meta.env.VITE_GSC_CASINO_API_URL || ''),
  qtechCasinoUrl: normalizeUrl(import.meta.env.VITE_QTECH_CASINO_API_URL || ''),
  casinor2Url: normalizeUrl(import.meta.env.VITE_CASINO_R2_URL || ''),
  cryptoSecret: import.meta.env.VITE_CRYPTO_SECRET || '',
  cryptoSecretforPayload: import.meta.env.VITE_CRYPTO_PAYLOAD_SECRET || '',
  server: import.meta.env.VITE_SERVER || 'production',
}
