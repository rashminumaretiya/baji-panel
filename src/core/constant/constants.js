export const SPORT_IDS = Object.freeze({
  SOCCER: '1',
  TENNIS: '2',
  CRICKET: '4',
  HORSE_RACING: '7',
  GREYHOUND_RACING: '4339',
})

export const SPORT_ROUTE_BY_ID = Object.freeze({
  [SPORT_IDS.SOCCER]: '/soccer',
  [SPORT_IDS.TENNIS]: '/tennis',
  [SPORT_IDS.CRICKET]: '/cricket',
  [SPORT_IDS.HORSE_RACING]: '/horse-racing',
  [SPORT_IDS.GREYHOUND_RACING]: '/greyhound-racing',
})

export const RACING_SPORTS = new Set([SPORT_IDS.HORSE_RACING, SPORT_IDS.GREYHOUND_RACING, '10', '65'])

export const INPLAY_FILTER_SPORTS = [
  { label: 'titles.games.cricket', value: SPORT_IDS.CRICKET },
  { label: 'titles.games.soccer', value: SPORT_IDS.SOCCER },
  { label: 'titles.games.tennis', value: SPORT_IDS.TENNIS },
  { label: 'titles.games.horseRacing', value: SPORT_IDS.HORSE_RACING },
  { label: 'titles.games.greyhoundRacing', value: SPORT_IDS.GREYHOUND_RACING },
]

export const PINNABLE_SPORT_IDS = new Set([SPORT_IDS.SOCCER, SPORT_IDS.CRICKET])

export const GAME_LIST_FILTERS = {
  HIGHLIGHTS: 'highlights',
  COMPETITION: 'competition',
  TIME: 'time',
  MATCHED: 'matched',
}

export const SPORT_TAB_EXCLUDE = new Set(['parlay-market'])

export const SPORTS = [
  { id: '1', name: 'Soccer' },
  { id: '2', name: 'Tennis' },
  { id: '7522', name: 'Basketball' },
  { id: '3', name: 'Golf' },
  { id: '4', name: 'Cricket' },
  { id: '7524', name: 'Ice Hockey' },
  { id: '1477', name: 'Rugby League' },
  { id: '5', name: 'Rugby Union' },
  { id: '6', name: 'Boxing' },
  { id: '7', name: 'Horse Racing' },
  { id: '8', name: 'Motor Sport' },
  { id: '27454571', name: 'Esports' },
  { id: '998917', name: 'Volleyball' },
  { id: '11', name: 'Cycling' },
  { id: '61420', name: 'Australian Rules' },
  { id: '468328', name: 'Handball' },
  { id: '3503', name: 'Darts' },
  { id: '2152880', name: 'Gaelic Games' },
  { id: '26420387', name: 'Mixed Martial Arts' },
  { id: '4339', name: 'Greyhound Racing' },
  { id: '2378961', name: 'Politics' },
  { id: '6422', name: 'Snooker' },
  { id: '7511', name: 'Baseball' },
  { id: '6423', name: 'American Football' },
]

export function getSportName(sportId) {
  return SPORTS.find((s) => s.id === String(sportId))?.name || 'Sport'
}

// URL-friendly slug for a sport (e.g. 'cricket', 'horse-racing').
export function getSportSlug(sportId) {
  const name = SPORTS.find((s) => s.id === String(sportId))?.name
  if (!name) return ''
  return name.toLowerCase().replace(/\s+/g, '-')
}

// Reverse lookup: 'cricket' → '4', 'horse-racing' → '7'.
export function getSportIdFromSlug(slug) {
  if (!slug) return null
  const normalized = String(slug).toLowerCase().replace(/-/g, ' ')
  return (
    SPORTS.find((s) => s.name.toLowerCase() === normalized)?.id || null
  )
}

export function isRacingSport(sportId) {
  return sportId ? RACING_SPORTS.has(String(sportId)) : false
}
