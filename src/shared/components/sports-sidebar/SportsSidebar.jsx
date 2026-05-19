import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  fetchSidebarSports,
  selectSidebarSports,
} from '../../../store/slices/sportSlice.js'
import {
  selectIsMcvYellowTheme,
  selectIsYellowTheme,
} from '../../../store/slices/commonSlice.js'
import { selectRacingListShow } from '../../../store/slices/headerSlice.js'
import './sports-sidebar.scss'

// Map sport names (as returned in event.sport) to i18n keys.
const SPORT_LABEL_KEYS = {
  Soccer: 'titles.games.soccer',
  Cricket: 'titles.games.cricket',
  Tennis: 'titles.games.tennis',
  'E-Soccer': 'titles.games.esoccer',
  ESoccer: 'titles.games.esoccer',
  Kabaddi: 'titles.games.kabaddi',
  Election: 'titles.games.election',
  'Horse Racing': 'titles.games.horseRacing',
  'Greyhound Racing': 'titles.games.greyhoundRacing',
  Fancybet: 'titles.games.fancybet',
}

function cx(...cs) {
  return cs.filter(Boolean).join(' ')
}

// The /sport/all payload has no sport name at the top level — derive it from
// the first event inside the bucket (every event in a bucket shares one sport).
function readBucketSport(bucket) {
  if (!bucket || typeof bucket !== 'object') return ''
  if (typeof bucket.sport === 'string' && bucket.sport) return bucket.sport
  if (typeof bucket.name === 'string' && bucket.name) return bucket.name
  if (typeof bucket.label === 'string' && bucket.label) return bucket.label
  const competitions = Array.isArray(bucket.competitions)
    ? bucket.competitions
    : []
  for (const comp of competitions) {
    const events = Array.isArray(comp?.events) ? comp.events : []
    for (const evt of events) {
      if (typeof evt?.sport === 'string' && evt.sport) return evt.sport
    }
  }
  return ''
}

function readSportLabelKey(sportName) {
  return SPORT_LABEL_KEYS[sportName] || ''
}

export default function SportsSidebar() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const allSports = useSelector(selectSidebarSports)
  const isYellowTheme = useSelector(selectIsYellowTheme)
  const isMcwCasinoTheme = useSelector(selectIsMcvYellowTheme)
  const racingListShow = useSelector(selectRacingListShow)

  const [sportsCompetition, setSportsCompetition] = useState([])

  useEffect(() => {
    if (!allSports?.length) dispatch(fetchSidebarSports())
  }, [dispatch, allSports?.length])

  // Decorate each API bucket with its derived sport name + a stable index.
  const buckets = useMemo(() => {
    if (!Array.isArray(allSports)) return []
    return allSports.map((bucket, index) => ({
      ...bucket,
      _index: index,
      _sport: readBucketSport(bucket),
    }))
  }, [allSports])

  // Filtered root list — hides racing buckets when the racing flags are off.
  const sports = useMemo(() => {
    return buckets.filter((b) => {
      const sport = b._sport
      if (sport === 'Horse Racing' && !racingListShow?.isHorseRacingAllowed) {
        return false
      }
      if (
        sport === 'Greyhound Racing' &&
        !racingListShow?.isGreyhoundRacingAllowed
      ) {
        return false
      }
      return true
    })
  }, [buckets, racingListShow])

  const showRoot = sportsCompetition.length === 0

  function setDefaultSports() {
    setSportsCompetition([])
  }

  function getEventsBySport(bucketIndex) {
    const bucket = buckets[bucketIndex]
    if (!bucket) return
    const sportName = bucket._sport
    const labelKey = readSportLabelKey(sportName)
    setSportsCompetition([
      { label: 'All Sports', click: setDefaultSports },
      {
        label: labelKey || sportName || 'Sport',
        fallback: sportName || 'Sport',
        classList: 'title active',
        click: () => getEventsBySport(bucketIndex),
      },
      {
        label: 'Common',
        classList: 'sub-title',
        competitions: bucket.competitions ?? [],
      },
    ])
  }

  function getEventsByCompetition(c) {
    setSportsCompetition((prev) => {
      const next = [...prev]
      if (next[1]) next[1] = { ...next[1], classList: 'title' }
      next[2] = {
        label: c?.name || c?.competition?.name || '',
        classList: 'active',
        events: c?.events ?? [],
        isEvent: true,
      }
      return next
    })
  }

  function getMatchOdds(event) {
    setSportsCompetition((prev) => {
      const next = [...prev]
      next[2] = {
        label: event?.name || '',
        classList: 'active',
        event,
        events: [{ name: 'Match Odds', classList: 'match-odds' }],
      }
      return next
    })
  }

  function navigateToOddsPage(event) {
    setSportsCompetition((prev) => {
      const next = [...prev]
      if (next[2]?.events?.[0]) {
        next[2] = {
          ...next[2],
          events: [{ ...next[2].events[0], classList: 'match-odds active' }],
        }
      }
      return next
    })
    if (!event?.id) return
    const sportSlug = (event.sport ?? '').toLowerCase()
    navigate(`/odds/${event.id}/${sportSlug}`)
  }

  const wrapperClass = cx(
    'sidebar-wrapper',
    isYellowTheme && 'yellow-theme',
    isMcwCasinoTheme && 'mcw-theme'
  )
  const eventsClass = cx(
    'events mb-0 ps-0',
    isYellowTheme && 'light-sidebar',
    isMcwCasinoTheme && 'mcw-sidebar'
  )

  return (
    <div className="app-sports-sidebar">
      <div className={wrapperClass}>
        <ul className={eventsClass}>
          <li className="active-sport">{t('common.sports')}</li>

          {showRoot &&
            sports.map((bucket) => {
              const sportName = bucket._sport
              const labelKey = readSportLabelKey(sportName)
              return (
                <li
                  key={`sport-${bucket._index}`}
                  className="cursor-pointer"
                  onClick={() => getEventsBySport(bucket._index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && getEventsBySport(bucket._index)
                  }
                >
                  {t(labelKey, sportName || 'Sport')}
                </li>
              )
            })}

          {sportsCompetition.map((sc, idx) => {
            const isInPlay = !!sc?.event?.isInPlay
            return (
              <Fragment key={`sc-${idx}`}>
                <li
                  className={cx('cursor-pointer', sc.classList)}
                  onClick={() => sc.click?.()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && sc.click?.()}
                >
                  {t(sc.label, sc.fallback ?? sc.label)}
                </li>

                {sc.competitions?.map((c, cidx) => (
                  <li
                    key={`c-${idx}-${cidx}`}
                    className={cx('cursor-pointer', c.classList)}
                    onClick={() => getEventsByCompetition(c)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && getEventsByCompetition(c)
                    }
                  >
                    {c?.name || c?.competition?.name}
                  </li>
                ))}

                {sc.events?.map((event, eidx) => {
                  const onActivate = () =>
                    sc.isEvent
                      ? getMatchOdds(event)
                      : navigateToOddsPage(sc.event)
                  return (
                    <li
                      key={`e-${idx}-${eidx}`}
                      className={cx(
                        'cursor-pointer',
                        event.classList,
                        isInPlay && 'in-play'
                      )}
                      onClick={onActivate}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && onActivate()}
                    >
                      {event.name}
                    </li>
                  )
                })}
              </Fragment>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
