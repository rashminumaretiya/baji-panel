export const RACING_SPORTS = new Set(['7', '4339', '10', '65'])

export const PINNABLE_SPORT_IDS = new Set(['1', '4'])

export const GAME_LIST_FILTERS = {
  HIGHLIGHTS: 'highlights',
  COMPETITION: 'competition',
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

export function isRacingSport(sportId) {
  return sportId ? RACING_SPORTS.has(String(sportId)) : false
}
