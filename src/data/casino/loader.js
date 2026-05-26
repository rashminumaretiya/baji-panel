// Lazy loader for the casino game registry. Each provider's data file
// (~50k-99k lines apiece) is fetched in its own chunk; the IS_*_CASINO
// build-time flags in core/constant/constants.js gate which providers are
// imported at all, so an AWC-only deploy never downloads QTECH or GSC data.
//
// Cache shape mirrors the module exports we used to import statically; once
// the promise resolves the slice flips `isCasinoDataLoaded` and selectors
// read straight from `cache` (still synchronous — fast for repeat reads).
import {
  IS_AWC_CASINO,
  IS_GSC_CASINO,
  IS_QT_CASINO,
} from '../../core/constant/constants.js'

let cache = null
let loadingPromise = null

export async function loadCasinoData() {
  if (cache) return cache
  if (loadingPromise) return loadingPromise
  loadingPromise = (async () => {
    try {
      const [registryMod, sbMod, configMod, awcMod, gscMod, qtechMod] =
        await Promise.all([
          import('./registry.js'),
          import('./sbCasinoGames.js'),
          import('./providerConfig.js'),
          IS_AWC_CASINO ? import('./awcCasinoGames.js') : Promise.resolve(null),
          IS_GSC_CASINO ? import('./gscCasinoGames.js') : Promise.resolve(null),
          IS_QT_CASINO ? import('./qtCasinoGames.js') : Promise.resolve(null),
        ])
      cache = {
        MERCHANT_PROVIDER_GAMES: registryMod.buildMerchantProviderGames({
          AWC: awcMod ?? {},
          GSC: gscMod ?? {},
          QTECH: qtechMod ?? {},
        }),
        sbAviatorCasinoGames: sbMod.sbAviatorCasinoGames,
        sbLotteryCasinoGames: sbMod.sbLotteryCasinoGames,
        PROVIDER_CONFIG: configMod.PROVIDER_CONFIG,
        DEFAULT_PROVIDER_CONFIG: configMod.DEFAULT_PROVIDER_CONFIG,
      }
      return cache
    } catch (err) {
      // Clear the in-flight promise so the next dispatch retries instead of
      // returning the rejected promise forever.
      loadingPromise = null
      throw err
    }
  })()
  return loadingPromise
}

export function getCachedCasinoData() {
  return cache
}
