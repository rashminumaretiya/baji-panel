function mergeExchange(prev, next) {
  if (!prev) return next
  if (!next) return prev

  const back = next.availableToBack ?? prev.availableToBack
  const lay = next.availableToLay ?? prev.availableToLay
  const vol = next.tradedVolume ?? prev.tradedVolume

  if (back === prev.availableToBack && lay === prev.availableToLay && vol === prev.tradedVolume) {
    return prev
  }
  return { availableToBack: back, availableToLay: lay, tradedVolume: vol }
}

export function normalizeMatchOdds(raw) {
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

function mergeSingleMatchOdds(prev, next) {
  if (!prev || !prev.runners?.length) return next
  if (!next || !next.runners?.length) return prev

  const prevRunnerMap = new Map(prev.runners.map((r) => [r.selectionId, r]))
  let anyChanged = false

  const mergedRunners = next.runners.map((nextRunner) => {
    const prevRunner = prevRunnerMap.get(nextRunner.selectionId)
    if (!prevRunner) {
      anyChanged = true
      return nextRunner
    }

    const status = nextRunner.status ?? prevRunner.status
    const lastPriceTraded = nextRunner.lastPriceTraded ?? prevRunner.lastPriceTraded
    const totalMatched = nextRunner.totalMatched ?? prevRunner.totalMatched
    const ex = mergeExchange(prevRunner.ex, nextRunner.ex) ?? prevRunner.ex

    if (
      status === prevRunner.status &&
      lastPriceTraded === prevRunner.lastPriceTraded &&
      totalMatched === prevRunner.totalMatched &&
      ex === prevRunner.ex
    ) {
      return prevRunner
    }
    anyChanged = true
    return { ...prevRunner, status, lastPriceTraded, totalMatched, ex }
  })

  if (!anyChanged && next.status === prev.status && next.totalMatched === prev.totalMatched) {
    return prev
  }
  return { ...prev, ...next, runners: mergedRunners }
}

export function mergeMatchOdds(prev, next) {
  const prevArr = normalizeMatchOdds(prev)
  const nextArr = normalizeMatchOdds(next)
  if (!nextArr.length) return prevArr
  if (!prevArr.length) return nextArr

  const nextMap = new Map(nextArr.map((m) => [m.marketId, m]))
  let anyChanged = false

  const mergedExisting = prevArr.map((prevItem) => {
    const nextItem = nextMap.get(prevItem.marketId)
    if (!nextItem) return prevItem
    const result = mergeSingleMatchOdds(prevItem, nextItem)
    if (result !== prevItem) anyChanged = true
    return result
  })

  const prevIds = new Set(prevArr.map((m) => m.marketId))
  const newMarkets = nextArr.filter((m) => !prevIds.has(m.marketId))
  if (newMarkets.length) anyChanged = true

  return anyChanged ? [...mergedExisting, ...newMarkets] : prevArr
}

export function mergeBookmaker(prev, next) {
  if (!next?.length) return prev
  if (!prev?.length) return next

  const prevMap = new Map(prev.map((b) => [b.mid, b]))
  let anyChanged = false

  const merged = next.map((nextBM) => {
    const prevBM = prevMap.get(nextBM.mid)
    if (!prevBM) {
      anyChanged = true
      return nextBM
    }
    const isSame = Object.keys(nextBM).every((k) => nextBM[k] === prevBM[k])
    if (isSame) return prevBM
    anyChanged = true
    return { ...prevBM, ...nextBM }
  })
  return anyChanged ? merged : prev
}

export function mergeFancy(prev, next) {
  if (!next?.length) return prev
  if (!prev?.length) return next

  const prevMap = new Map(prev.map((f) => [f.SelectionId, f]))
  let anyChanged = false

  const merged = next.map((nextFancy) => {
    const prevFancy = prevMap.get(nextFancy.SelectionId)
    if (!prevFancy) {
      anyChanged = true
      return nextFancy
    }
    const isSame = Object.keys(nextFancy).every((k) => nextFancy[k] === prevFancy[k])
    if (isSame) return prevFancy
    anyChanged = true
    return { ...prevFancy, ...nextFancy }
  })
  return anyChanged ? merged : prev
}

export function mergeOddsData(prev, patch) {
  const match_odds =
    patch.match_odds !== undefined
      ? mergeMatchOdds(prev.match_odds, patch.match_odds)
      : prev.match_odds
  const bookmaker =
    patch.bookmaker !== undefined
      ? mergeBookmaker(prev.bookmaker, patch.bookmaker)
      : prev.bookmaker
  const fancy = patch.fancy !== undefined ? mergeFancy(prev.fancy, patch.fancy) : prev.fancy
  const sportBook = patch.sportBook ?? prev.sportBook

  if (
    match_odds === prev.match_odds &&
    bookmaker === prev.bookmaker &&
    fancy === prev.fancy &&
    sportBook === prev.sportBook
  ) {
    return prev
  }
  return { match_odds, bookmaker, fancy, sportBook }
}

export const DEFAULT_MARKET_ODDS = {
  match_odds: [],
  bookmaker: [],
  fancy: [],
  sportBook: [],
  marketSetting: {},
}

export function computeVisibleMarkets(data) {
  const odds = normalizeMatchOdds(data?.match_odds)
  const sb = data?.sportBook
  return {
    match_odds: odds.some((mo) => Array.isArray(mo?.runners) && mo.runners.length > 0),
    bookmaker: Array.isArray(data?.bookmaker) && data.bookmaker.length > 0,
    fancy: Array.isArray(data?.fancy) && data.fancy.length > 0,
    sportBook: Array.isArray(sb) ? sb.length > 0 : !!sb && Object.keys(sb).length > 0,
  }
}
