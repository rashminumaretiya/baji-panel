// Place-bet API client.
//
// Endpoint: POST `bet/place` with a flat JSON body:
//   { marketId, selectionId, stake, odd, size, eventId, marketName, betType }
//
// `marketName` discriminates the market kind on the server. Accepted values
// mirror the runtime constants below.

import { http } from '../../core/http/client.js'

export const MARKET_NAME = {
  MATCH_ODDS: 'MATCH_ODDS',
  BOOKMAKER: 'BOOKMAKER',
  FANCY: 'FANCY',
  SPORTS_BOOK: 'SPORTS_BOOK',
}

export function buildBetPayload(slip, context = {}) {
  const marketName = slip.marketName ?? ''
  const payload = {
    marketId: String(slip.marketId ?? context.marketId ?? ''),
    selectionId: String(slip.selectionId ?? slip.runnerId ?? ''),
    stake: Number(slip.stake ?? 0),
    odd: Number(slip.odd ?? slip.odds ?? 0),
    size: Number(slip.size ?? 0),
    eventId: String(slip.eventId ?? context.eventId ?? ''),
    marketName,
    betType: slip.betType ?? slip.type ?? '',
  }
  // FANCY bets require `gtype`
  if (marketName === MARKET_NAME.FANCY) {
    payload.gtype = slip.gtype ?? context.gtype ?? ''
  }
  return payload
}

export async function placeBet(slip, context = {}) {
  const payload = buildBetPayload(slip, context)

  if (!payload.odd || !payload.stake || !payload.marketName) {
    throw new Error('Invalid bet — odds, stake and market name are required.')
  }
  if (!payload.marketId || !payload.selectionId || !payload.eventId) {
    throw new Error(
      'Invalid bet — marketId, selectionId and eventId are required.'
    )
  }

  const { data } = await http.post('bet/place', payload)
  return data
}
