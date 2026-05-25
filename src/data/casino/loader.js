// Lazy loader for the ~150k-line casino game registry. Dynamic imports
// keep the data out of the main bundle — Vite chunks the registry + the
// four data files together so a non-platform user never downloads them.
//
// Cache shape mirrors the module exports we used to import statically; once
// the promise resolves the slice flips `isCasinoDataLoaded` and selectors
// read straight from `cache` (still synchronous — fast for repeat reads).

let cache = null
let loadingPromise = null

export async function loadCasinoData() {
  if (cache) return cache
  if (loadingPromise) return loadingPromise
  loadingPromise = (async () => {
    try {
      const [registryMod, sbMod, configMod] = await Promise.all([
        import('./registry.js'),
        import('./sbCasinoGames.js'),
        import('./providerConfig.js'),
      ])
      cache = {
        MERCHANT_PROVIDER_GAMES: registryMod.MERCHANT_PROVIDER_GAMES,
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
