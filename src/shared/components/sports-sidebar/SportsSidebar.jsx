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

// ─── Per-row class builders ────────────────────────────────────────────────
// Translate the cascade of .events li rules from sports-sidebar.scss. Every
// `li` shares the BASE rules; theme variants and state classes layer on top.

const LI_BASE =
  'relative h-[25px] text-[12px] leading-[25px] overflow-hidden px-2.5 border-b ' +
  'hover:bg-white/10'

// Default (dark) theme — white text on transparent dark sidebar.
const LI_DEFAULT = 'text-white border-b-white/15'

// `light-sidebar` (yellow theme) — blue text on light background.
const LI_LIGHT = 'text-[var(--blue)] border-b border-[var(--light-bg)]'

// `mcw-sidebar` (mcw theme) — dark text, soft hover.
const LI_MCW = 'text-[#222222] border-b border-[#eee1c0] hover:!bg-[#ece4b9]'

// State helpers — `.active`, `.selected`, `.sub-title` (sub-title only paints
// background, no other props change).
const STATE_ACTIVE_DEFAULT = '!text-white !bg-[var(--primary)]'
const STATE_ACTIVE_LIGHT =
  '!text-white !bg-gradient-to-b !from-[#546d7d] !to-[var(--text-color)]'
const STATE_ACTIVE_MCW = '!text-[#222222] !bg-[#e5ca3a]'
const STATE_SELECTED = '!bg-[rgba(var(--primary-rgb),0.6)] !text-white'
const STATE_SUB_TITLE = '!bg-white/10'

// `match-odds` ─ left padding for the leading bullet + ::before dot.
const MATCH_ODDS_BASE =
  '!pl-5 before:content-["•"] before:absolute before:left-[5px] before:text-[20px] before:text-[var(--sm-white)]'
const MATCH_ODDS_IN_PLAY = 'before:!text-[var(--xs-green-primary)]'
const MATCH_ODDS_ACTIVE_DEFAULT = '!bg-[rgba(var(--xss-green-primary),0.6)]'
const MATCH_ODDS_ACTIVE_YELLOW = '!bg-[#f2dca7] !text-[var(--dark)]'
const MATCH_ODDS_ACTIVE_MCW = '!bg-[rgba(229,202,58,0.6)] !text-[var(--dark)]'

// `active-sport` — header row at the top of the sidebar.
const ACTIVE_SPORT_DEFAULT = LI_BASE + ' ' + LI_DEFAULT
const ACTIVE_SPORT_YELLOW =
  LI_BASE +
  ' ' +
  LI_LIGHT +
  ' !text-white !bg-gradient-to-b !from-[#546d7d] !to-[var(--text-color)]'
const ACTIVE_SPORT_MCW =
  LI_BASE +
  ' ' +
  LI_MCW +
  ' !text-[#ffd45f] !bg-gradient-to-b !from-[#393939] !to-[#000000] hover:!bg-gradient-to-b hover:!from-[#474747] hover:!to-[#070707]'

function liClass({
  isYellowTheme,
  isMcwCasinoTheme,
  isActive,
  isSubTitle,
  isSelected,
  isMatchOdds,
  isInPlay,
  extra = '',
}) {
  const parts = [LI_BASE]
  if (isYellowTheme) parts.push(LI_LIGHT)
  else if (isMcwCasinoTheme) parts.push(LI_MCW)
  else parts.push(LI_DEFAULT)

  if (isSubTitle) parts.push(STATE_SUB_TITLE)
  if (isSelected) parts.push(STATE_SELECTED)

  if (isMatchOdds) {
    parts.push(MATCH_ODDS_BASE)
    if (isInPlay) parts.push(MATCH_ODDS_IN_PLAY)
    if (isActive) {
      if (isYellowTheme) parts.push(MATCH_ODDS_ACTIVE_YELLOW)
      else if (isMcwCasinoTheme) parts.push(MATCH_ODDS_ACTIVE_MCW)
      else parts.push(MATCH_ODDS_ACTIVE_DEFAULT)
    }
  } else if (isActive) {
    if (isYellowTheme) parts.push(STATE_ACTIVE_LIGHT)
    else if (isMcwCasinoTheme) parts.push(STATE_ACTIVE_MCW)
    else parts.push(STATE_ACTIVE_DEFAULT)
  }

  if (extra) parts.push(extra)
  return parts.filter(Boolean).join(' ')
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

  // `.events` ─ container: capped height + hidden scrollbar.
  const eventsClass =
    'max-h-[calc(100vh-104px)] overflow-y-auto mb-0 pl-0 ' +
    '[&::-webkit-scrollbar]:hidden [scrollbar-width:none]'

  // Header row at the top — fixed style; theme-aware.
  const activeSportClass = isYellowTheme
    ? ACTIVE_SPORT_YELLOW
    : isMcwCasinoTheme
      ? ACTIVE_SPORT_MCW
      : ACTIVE_SPORT_DEFAULT

  return (
    <div>
      <ul className={eventsClass}>
        <li className={activeSportClass}>{t('common.sports')}</li>

        {showRoot &&
          sports.map((bucket) => {
            const sportName = bucket._sport
            const labelKey = readSportLabelKey(sportName)
            return (
              <li
                key={`sport-${bucket._index}`}
                className={liClass({
                  isYellowTheme,
                  isMcwCasinoTheme,
                  extra: 'cursor-pointer',
                })}
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
          const classTokens = (sc.classList ?? '').split(/\s+/).filter(Boolean)
          const isActive = classTokens.includes('active')
          const isSubTitle = classTokens.includes('sub-title')
          return (
            <Fragment key={`sc-${idx}`}>
              <li
                className={liClass({
                  isYellowTheme,
                  isMcwCasinoTheme,
                  isActive,
                  isSubTitle,
                  extra: 'cursor-pointer',
                })}
                onClick={() => sc.click?.()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && sc.click?.()}
              >
                {t(sc.label, sc.fallback ?? sc.label)}
              </li>

              {sc.competitions?.map((c, cidx) => {
                const cTokens = (c.classList ?? '').split(/\s+/).filter(Boolean)
                const cActive = cTokens.includes('active')
                const cSubTitle = cTokens.includes('sub-title')
                return (
                  <li
                    key={`c-${idx}-${cidx}`}
                    className={liClass({
                      isYellowTheme,
                      isMcwCasinoTheme,
                      isActive: cActive,
                      isSubTitle: cSubTitle,
                      extra: 'cursor-pointer',
                    })}
                    onClick={() => getEventsByCompetition(c)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && getEventsByCompetition(c)
                    }
                  >
                    {c?.name || c?.competition?.name}
                  </li>
                )
              })}

              {sc.events?.map((event, eidx) => {
                const onActivate = () =>
                  sc.isEvent
                    ? getMatchOdds(event)
                    : navigateToOddsPage(sc.event)
                const eTokens = (event.classList ?? '').split(/\s+/).filter(Boolean)
                const isMatchOdds = eTokens.includes('match-odds')
                const eActive = eTokens.includes('active')
                return (
                  <li
                    key={`e-${idx}-${eidx}`}
                    className={liClass({
                      isYellowTheme,
                      isMcwCasinoTheme,
                      isActive: eActive,
                      isMatchOdds,
                      isInPlay,
                      extra: 'cursor-pointer',
                    })}
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
  )
}
