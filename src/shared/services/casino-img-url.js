// Ported from sbex-user-fe/src/app/shared/pipes/casino-img-url-pipe.ts.
// Resolves a relative casino game image path to either an override served by
// the casino-info API (per-game image map) or a default-host fallback.
import { environment } from '../../environments/environment.js'

export function resolveCasinoImgUrl(url, casinoGameImages = []) {
  if (!url) return null
  const match = casinoGameImages.find((img) => img?.includes(url))
  if (match) return match
  return `${environment.casinor2Url}default${url}`
}
