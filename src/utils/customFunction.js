// ─── formatAmount ───────────────────────────────────────────────────────
// Money/amount formatter used by BetExposureCell, BetSlip, and OpenBets.
// Below 1e22 → en-US comma-grouped string with 2 decimals (`1,234.50`).
// At or above 1e22 → scientific notation (`1.50E+22`) so very large bets do
// not overflow narrow cells.
const baseFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const SCIENTIFIC_THRESHOLD = 1e22

export function formatAmount(value) {
  const n = value ?? 0
  if (!Number.isFinite(n)) return baseFormatter.format(0)
  if (Math.abs(n) >= SCIENTIFIC_THRESHOLD) {
    return n.toExponential(2).replace('e', 'E')
  }
  return baseFormatter.format(n)
}
