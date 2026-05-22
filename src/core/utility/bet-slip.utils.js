// Ported from sbex-user-fe/src/app/core/utility/bet-slip.utils.ts (subset).
// Phase 2 TODO: port buildPlaceBetPayload, calculateRunnerExposure, and the
// rest of the file for full bet placement + exposure preview.

const round2 = (n) => Number(n.toFixed(2))

const assertNever = (x) => {
  throw new Error(`Unhandled marketName: ${JSON.stringify(x)}`)
}

const ODDS_LADDER = [
  { min: 1.01, max: 2, step: 0.01 },
  { min: 2, max: 3, step: 0.02 },
  { min: 3, max: 4, step: 0.05 },
  { min: 4, max: 6, step: 0.1 },
  { min: 6, max: 10, step: 0.2 },
  { min: 10, max: 20, step: 0.5 },
  { min: 20, max: 30, step: 1 },
  { min: 30, max: 50, step: 2 },
  { min: 50, max: 100, step: 5 },
  { min: 100, max: 1000, step: 10 },
]

export function getOddsStep(odds) {
  for (const ladder of ODDS_LADDER) {
    if (odds >= ladder.min && odds < ladder.max) return ladder.step
  }
  return 10
}

export function roundToLadder(odds) {
  const step = getOddsStep(odds)
  let base = 1.01
  for (const ladder of ODDS_LADDER) {
    if (odds >= ladder.min && odds < ladder.max) {
      base = ladder.min
      break
    }
  }
  const stepsFromBase = Math.round((odds - base) / step)
  const rounded = base + stepsFromBase * step
  return Math.max(1.01, Math.min(1000, rounded))
}

export function calculateBetProfitLiability(slip) {
  if (!slip || !slip.stake) return { profit: 0, liability: 0 }

  const { stake, odds, type, marketName, size: newSize = 0 } = slip
  let profit = 0
  let liability = 0
  const size = newSize || 0
  switch (marketName) {
    case 'MATCH_ODDS':
    case 'SPORTS_BOOK': {
      profit = odds * stake - stake
      liability = stake
      break
    }
    case 'BOOKMAKER': {
      const pnl = (odds * stake) / 100
      if (type === 'BACK') {
        profit = pnl
        liability = stake
      } else {
        profit = stake
        liability = pnl
      }
      break
    }
    case 'FANCY': {
      const pnl = (size * stake) / 100
      if (type === 'YES') {
        profit = pnl
        liability = stake
      } else {
        profit = stake
        liability = pnl
      }
      break
    }
    default:
      return assertNever(marketName)
  }
  return { profit: round2(profit), liability: round2(liability) }
}

export function validateBetSlip(slip /* , balance */) {
  if (!slip) return { valid: false, message: 'betSlip.validation.noBetDetails' }
  if (slip.odds < 1)
    return { valid: false, message: 'betSlip.validation.oddsMinimum' }
  if (!slip.stake || slip.stake <= 0)
    return { valid: false, message: 'betSlip.validation.stakeMinimum' }
  return { valid: true }
}
