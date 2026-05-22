// Per-runner P/L display under a market row.
// Mirrors Angular `app-bet-exposure`:
// - `exposureData`  → persisted P/L (one entry per selectionId) from
//   `GET bet/post-exposure/${eventId}`. Always shown when present.
// - `preExposure`   → live preview from the active bet slip (computed in
//   `BetSlipForm` for MATCH_ODDS, in LiveOdds for FANCY). Combined with
//   the persisted value and prefixed with an arrow icon. Subscribed
//   directly from Redux inside the cell so that per-keystroke updates
//   re-render only the cells, not the whole page.
//
// Discriminating preview consumption:
// - The cell only consumes `preExposure` when `preExposure.marketName ===
//   marketName`. This prevents a fancy preview from leaking into match-odds
//   cells and vice versa when both kinds of bet slips coexist on the page.
// - For multi-selection markets (MATCH_ODDS / BOOKMAKER / SPORTS_BOOK) the
//   cell *also* requires `preExposure.marketId === marketId`. The sportsbook
//   list renders many independent markets on one page; without this scope
//   the liability delta would leak onto runners in markets the user isn't
//   actually betting on.
// - Multi-selection markets show the profit delta combined with the base
//   (`base + profit` on the matched runner; `base + liability` on the others
//   in the same market).
// - Single-selection markets (FANCY) show the profit delta *standalone* —
//   i.e. the P/L of the new bet alone, not combined with the base. The base
//   exposure is rendered separately as its own value. This matches the
//   baji-exchange-frontend `app-bet-exposure` template behaviour.
//
// Sign convention (matches sbex-user-fe `calculateRunnerExposure`):
//   value >= 0  →  profit  (green, plain number)
//   value <  0  →  liability (red, parenthesised number)
import { useSelector } from 'react-redux'
import { selectPreExposure } from '../../store/slices/betSlipSlice.js'

const numberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatExposure(value) {
  if (value >= 0) return numberFormatter.format(value)
  return `( ${numberFormatter.format(-1 * value)} )`
}

function ImplyIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0 3h4v4H0V3zm4 7V0l6 5-6 5z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  )
}

function ExposureValue({ value, withIcon }) {
  const isProfit = value >= 0
  const colorClass = isProfit
    ? 'text-[color:var(--dark-green)]'
    : 'text-[color:var(--red)]'
  return (
    <span className={`inline-flex items-center gap-[2px] ${colorClass}`}>
      {withIcon && <ImplyIcon className="inline-block" />}
      <span className="m-0">{formatExposure(value)}</span>
    </span>
  )
}

function computePreviewDelta(preExposure, sid, marketName, marketId) {
  if (!preExposure) return null
  if (preExposure.marketName !== marketName) return null
  const isSelected = String(preExposure.selectionId) === sid
  if (marketName === 'FANCY') {
    // Single-selection market — only the matched row gets a preview, and the
    // selectionId already identifies the market uniquely, so no marketId check.
    return isSelected && Number.isFinite(preExposure.profit)
      ? preExposure.profit
      : null
  }
  // Multi-selection market — restrict the preview to runners in the *same*
  // market. Without this, the liability delta would render on every other
  // market's runners (visible in sportsbook lists with many markets per page).
  if (marketId != null && preExposure.marketId != null) {
    if (String(preExposure.marketId) !== String(marketId)) return null
  }
  if (!Number.isFinite(preExposure.liability)) return null
  const delta = isSelected ? preExposure.profit : preExposure.liability
  return Number.isFinite(delta) ? delta : null
}

export default function BetExposureCell({
  selectionId,
  marketId,
  exposureData,
  marketName,
}) {
  const preExposure = useSelector(selectPreExposure)
  const sid = String(selectionId ?? '')

  const baseEntry = Array.isArray(exposureData)
    ? exposureData.find((e) => String(e?.id) === sid)
    : null
  const baseValue = baseEntry ? Number(baseEntry.exposure) : null
  const hasBase = Number.isFinite(baseValue)

  const previewDelta = computePreviewDelta(
    preExposure,
    sid,
    marketName,
    marketId
  )
  // FANCY shows the delta standalone; other markets combine with the base.
  const previewValue =
    previewDelta == null
      ? null
      : marketName === 'FANCY'
        ? previewDelta
        : (hasBase ? baseValue : 0) + previewDelta
  const hasPreview = Number.isFinite(previewValue)

  if (!hasBase && !hasPreview) return null

  return (
    <span className="inline-flex items-center gap-1.5 font-bold leading-none">
      {hasBase && <ExposureValue value={baseValue} />}
      {hasPreview && <ExposureValue value={previewValue} withIcon />}
    </span>
  )
}
