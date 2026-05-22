import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchSportLiveCount,
  loadGamesForSport,
  setActiveSportId,
  selectActiveSportConfig,
  selectActiveSportId,
  selectGamesForActiveSport,
  selectGamesStatusForActiveSport,
  selectSportTabs,
} from '../store/slices/sportSlice.js'
import { useEventSubscription } from './useSocket.js'
import { RACING_SPORTS, SPORT_IDS } from '../core/constant/constants.js'

const SPORT_BANNER = {
  [SPORT_IDS.SOCCER]: '/img/soccer-img.jpg',
  [SPORT_IDS.TENNIS]: '/img/tennis-img.jpg',
  [SPORT_IDS.CRICKET]: '/img/cricket-img.jpg',
  [SPORT_IDS.HORSE_RACING]: '/img/horse_racing_landing.webp',
  [SPORT_IDS.GREYHOUND_RACING]: '/img/greyhound_landing.webp',
}

const GAMES_FETCH_DEBOUNCE_MS = 150

export default function useHomePageData() {
  const dispatch = useDispatch()
  const tabs = useSelector(selectSportTabs)
  const activeSportId = useSelector(selectActiveSportId)
  const activeSport = useSelector(selectActiveSportConfig)
  const games = useSelector(selectGamesForActiveSport)
  const gamesStatus = useSelector(selectGamesStatusForActiveSport)

  const visibleEventIds = useMemo(
    () => games.map((g) => g.event?.id).filter(Boolean),
    [games]
  )
  useEventSubscription(visibleEventIds)

  useEffect(() => {
    dispatch(fetchSportLiveCount())
  }, [dispatch])

  useEffect(() => {
    if (!activeSportId && tabs.length) {
      dispatch(setActiveSportId(tabs[0].id))
    }
  }, [activeSportId, tabs, dispatch])

  useEffect(() => {
    if (!activeSportId) return undefined
    const id = setTimeout(() => {
      dispatch(loadGamesForSport(activeSportId))
    }, GAMES_FETCH_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [activeSportId, dispatch])

  const selectTab = useCallback(
    (id) => dispatch(setActiveSportId(id)),
    [dispatch]
  )

  return {
    tabs,
    activeSportId,
    activeSport,
    games,
    isLoading: gamesStatus === 'loading',
    isRacing: RACING_SPORTS.has(activeSportId ?? ''),
    sportBanner: SPORT_BANNER[activeSportId] ?? null,
    selectTab,
  }
}
