// Place-bet API client.
//
// Endpoint: POST `bet/place` with a flat JSON body:
//   { marketId, selectionId, stake, odd, size, eventId, marketName, betType }
//
// `marketName` discriminates the market kind on the server. Accepted values
// mirror the runtime constants below.

import { http } from '../../core/http/client.js'

const MARKET_NAME = {
  MATCH_ODDS: 'MATCH_ODDS',
  BOOKMAKER: 'BOOKMAKER',
  FANCY: 'FANCY',
  SPORTS_BOOK: 'SPORTS_BOOK',
}

function buildBetPayload(slip, context = {}) {
  const marketName = slip.marketName ?? ''
  const size = slip.size == null ? null : Number(slip.size)
  const payload = {
    marketId: String(slip.marketId ?? context.marketId ?? ''),
    selectionId: String(slip.selectionId ?? slip.runnerId ?? ''),
    stake: Number(slip.stake ?? 0),
    odd: Number(slip.odd ?? slip.odds ?? 0),
    size,
    eventId: String(slip.eventId ?? context.eventId ?? ''),
    marketName,
    betType: slip.betType ?? slip.type ?? '',
  }

  if (marketName === MARKET_NAME.FANCY) {
    payload.gtype = slip.gtype ?? ''
  }

  return payload
}

export async function placeBet(slip, context = {}) {
  const payload = buildBetPayload(slip, context)
  const { data } = await http.post('bet/place', payload)
  return data
}
