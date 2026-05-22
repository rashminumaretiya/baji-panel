// Odds helpers focused on the live-project parity features that overlay on
// the React project's existing Betfair-shaped data (each runner has an `ex`
// object with `availableToBack[]` / `availableToLay[]`):
//
//   - Diff successive socket pushes to flag changed prices for the
//     back-spark / lay-spark CSS animations.
//   - Clear the flags after the animation period so we don't keep flashing.
//
// These helpers are pure: they accept a normalised match-odds market and a
// previous snapshot, and return a new market with each back/lay slot tagged
// `isChanged: true` when its price moved.

export const GameStatus = Object.freeze({
  OPEN: 'OPEN',
  SUSPENDED: 'SUSPENDED',
  CLOSED: 'CLOSED',
  INACTIVE: 'INACTIVE',
})

function pickAvailable(ex, key) {
  return Array.isArray(ex?.[key]) ? ex[key] : []
}

function diffOddsArray(currentArr, previousArr) {
  if (!Array.isArray(currentArr)) return currentArr
  return currentArr.map((cell, i) => {
    const prevPrice = Number(previousArr?.[i]?.price ?? 0)
    const nextPrice = Number(cell?.price ?? 0)
    return {
      ...cell,
      isChanged: previousArr ? prevPrice !== nextPrice : false,
    }
  })
}

function clearArray(arr) {
  if (!Array.isArray(arr)) return arr
  return arr.map((cell) => ({ ...cell, isChanged: false }))
}

export function diffMatchOddsForSpark(current, previous) {
  if (!current || typeof current !== 'object') return current
  const prevRunners = Array.isArray(previous?.runners) ? previous.runners : []
  const prevMap = new Map(prevRunners.map((r) => [r.selectionId, r]))

  const runners = (Array.isArray(current.runners) ? current.runners : []).map(
    (runner) => {
      const prev = prevMap.get(runner.selectionId)
      const back = pickAvailable(runner.ex, 'availableToBack')
      const lay = pickAvailable(runner.ex, 'availableToLay')
      const prevBack = pickAvailable(prev?.ex, 'availableToBack')
      const prevLay = pickAvailable(prev?.ex, 'availableToLay')
      return {
        ...runner,
        ex: {
          ...runner.ex,
          availableToBack: diffOddsArray(back, prevBack),
          availableToLay: diffOddsArray(lay, prevLay),
        },
      }
    }
  )
  return { ...current, runners }
}

export function clearSparkFlags(market) {
  if (!market || typeof market !== 'object') return market
  const runners = Array.isArray(market.runners) ? market.runners : []
  return {
    ...market,
    runners: runners.map((r) => ({
      ...r,
      ex: {
        ...r.ex,
        availableToBack: clearArray(r.ex?.availableToBack),
        availableToLay: clearArray(r.ex?.availableToLay),
      },
    })),
  }
}
