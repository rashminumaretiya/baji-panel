// Place-bet API client — mirrors `bet-slip.service.ts > userPlaceBet` from
// baji-exchange-frontend. Builds the per-market payload, encrypts it, and POSTs
// to `${apiUrl}user/bet/` with the body shape `{ bet: <ciphertext> }`.

import { http } from '../../core/http/client.js'
import { encryptPayload } from './local-storage.js'

const MARKET_NAME = {
  MATCH_ODDS: 'MATCH_ODDS',
  BOOKMAKER: 'BOOKMAKER',
  FANCY: 'FANCY',
  SPORTS_BOOK: 'SPORTS_BOOK',
}

function teamSelections(runners) {
  const [team1, team2, draw] = (runners ?? []).map((r) => ({
    id: String(r?.selectionId ?? ''),
    name: r?.runnerName ?? r?.runner ?? '',
  }))
  return {
    team1SelectionId: team1?.id ?? '',
    team2SelectionId: team2?.id ?? '',
    drawSelectionId: draw?.id ?? '',
    team1SelectionName: team1?.name ?? '',
    team2SelectionName: team2?.name ?? '',
    drawSelectionName: draw?.name ?? '',
  }
}

/**
 * Build the encrypted-bet payload for a given market. Inputs:
 *   slip       — the active selection (odds, stake, marketName, selectionId, …)
 *   context    — { sport, eventId, eventTitle, runners?, marketId? } from the page
 */
export function buildBetPayload(slip, context = {}) {
  const odd = Number(slip.odd ?? slip.odds ?? 0)
  const stake = Number(slip.stake ?? 0)
  const betType = slip.betType ?? slip.type
  const marketName = slip.marketName
  const base = {
    odd,
    stake,
    betType,
    marketName,
    selectionId: String(slip.selectionId ?? slip.runnerId ?? ''),
    selectionName: slip.selectionName ?? slip.runnerName ?? '',
    marketId: String(slip.marketId ?? context.marketId ?? ''),
    eventId: String(slip.eventId ?? context.eventId ?? ''),
    eventTitle: slip.eventTitle ?? context.eventTitle ?? '',
    sport: context.sport ?? '',
  }

  switch (marketName) {
    case MARKET_NAME.MATCH_ODDS:
    case MARKET_NAME.BOOKMAKER:
      return { ...base, ...teamSelections(context.runners) }

    case MARKET_NAME.FANCY:
      return {
        ...base,
        size: Number(slip.size ?? 0),
        gtype: slip.gtype ?? '',
        ...teamSelections(context.runners),
      }

    case MARKET_NAME.SPORTS_BOOK:
      return {
        ...base,
        gtype: 'sportsBook',
        selectedRunnerName: slip.selectionName ?? slip.runnerName ?? '',
        runners: (context.runners ?? []).map((r) => ({
          selectionId: String(r?.selectionId ?? ''),
          runnerName: r?.runnerName ?? '',
        })),
      }

    default:
      return base
  }
}

export async function placeBet(slip, context = {}) {
  const payload = buildBetPayload(slip, context)

  // Server-side input validation: must have odd + stake + market.
  if (!payload.odd || !payload.stake || !payload.marketName) {
    throw new Error('Invalid bet — odds, stake and market name are required.')
  }

  const bet = encryptPayload(payload)
  const { data } = await http.post('user/bet/', { bet })
  return data
}
