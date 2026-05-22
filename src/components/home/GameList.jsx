import { memo, useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Accordion from '../../shared/components/primitives/Accordion.jsx'
import {
  GAME_LIST_FILTERS,
  RACING_SPORTS,
  SPORT_IDS,
  getSportSlug,
} from '../../core/constant/constants.js'
import { useIsMobile } from '../../hooks/useMediaQuery.js'
import NoData from '../../shared/NoData.jsx'
import { selectIsAuthenticated } from '../../store/slices/authSlice.js'
import SvgIcon from '../SvgIcon.jsx'

const EMPTY_GAMES = Object.freeze([])
const ODDS_SPARK_DURATION_MS = 800

function formatNumber(n) {
  if (n == null) return ''
  return new Intl.NumberFormat('en-US').format(n)
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (x) => String(x).padStart(2, '0')
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const sameDay = (a, b) => a.toDateString() === b.toDateString()
  const time12 = () => {
    let h = d.getHours()
    const m = pad(d.getMinutes())
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${pad(h)}:${m} ${ampm}`
  }
  if (sameDay(d, now)) return time12()
  if (sameDay(d, tomorrow)) return `Tomorrow ${time12()}`
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function activateOnKey(handler) {
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handler(e)
    }
  }
}

// ─── Chip class builders (ports of .wrapper / .current-chip / .text-chip) ──
// Each chip variant condenses a colour scheme onto the same base layout. On
// mobile (.icon-row context) the original SCSS layered extra width/padding;
// since desktop and mobile breakpoints are mutually exclusive we fold those
// overrides directly into the base via `max-md:` utilities.
// `.wrapper` ─ rounded pill, 16px tall on desktop / 4vw tall + 4.53vw wide
// (padded) on mobile inside .icon-row.
const WRAPPER_BASE =
  'inline-flex items-center justify-center rounded-[3px] h-4 ' +
  'max-md:rounded-[0.8vw] max-md:h-[4vw] max-md:w-[4.53vw] max-md:p-0.5 max-md:text-white'
const WRAPPER_ORANGE = 'bg-[var(--orange-darkest)]'
const WRAPPER_BLUE_DARK = 'bg-[var(--blue-dark)] [&_i]:inline-flex'

// `.current-chip` ─ taller compound chip with an alarm icon.
const CURRENT_CHIP_BASE =
  'inline-flex rounded-[4px] overflow-hidden items-center h-4 ' +
  'max-md:rounded-[0.8vw] max-md:h-[4vw] max-md:w-8'
const CURRENT_CHIP_LIGHTEST = 'bg-[var(--lightest-neavy)]'
const CURRENT_CHIP_BLUE_DARK = 'bg-[var(--blue-dark)]'

const ALARM_ICON_CLASS =
  'w-4 h-full inline-flex items-center justify-center text-white bg-[#60ba1e] ' +
  'max-md:w-[4vw] max-md:h-[4vw] ' +
  '[&_svg]:w-[11px] [&_svg]:h-[11px] [&_svg]:block'

const TEXT_CHIP_CLASS =
  'h-full inline-flex items-center justify-center w-4 px-0.5 text-white/85 ' +
  'max-md:w-[4.1vw] max-md:px-0 ' +
  '[&_i]:inline-flex [&_i]:leading-[0] ' +
  '[&_svg]:w-[11px] [&_svg]:h-[11px] ' +
  'max-md:[&_svg]:w-[2.93vw] max-md:[&_svg]:h-[2.93vw]'

// ─── Event "SRL" book chip ─────────────────────────────────────────────────
const EVENT_BOOK_WRAPPER =
  'items-center border border-[#1f5172] rounded-[0.1875rem] flex h-full ' +
  'justify-center mr-1 overflow-hidden w-auto'
const EVENT_BOOK_ICON =
  'items-center bg-[#1f5172] [clip-path:polygon(-100%_-100%,100%_0,79%_100%,0_100%)] ' +
  'h-full w-[1.25rem] text-[0.7rem] pl-[0.3rem] text-white'
const EVENT_BOOK_CONTENT =
  'text-[#1f5172] text-[0.5625rem] leading-[120%] pr-[0.125rem]'

const MarketChips = memo(function MarketChips({ game, isAuthenticated }) {
  const { t } = useTranslation()
  const isCricket = game.sport?.id === SPORT_IDS.CRICKET
  return (
    <>
      {game.isInPlay && (
        <span className={`${WRAPPER_BASE} ${WRAPPER_BLUE_DARK}`}>
          <div className={TEXT_CHIP_CLASS}>
            <SvgIcon name="playIcon" />
          </div>
        </span>
      )}
      {isCricket && game.isFancy && (
        <span className={`${CURRENT_CHIP_BASE} ${CURRENT_CHIP_LIGHTEST} pl-0`}>
          <span className={ALARM_ICON_CLASS}>
            <SvgIcon name="alarmIcon" />
          </span>
          <div className={TEXT_CHIP_CLASS}>
            <SvgIcon name="fIcon" />
          </div>
        </span>
      )}
      {game.isBookmaker && (
        <div className={`${CURRENT_CHIP_BASE} ${CURRENT_CHIP_BLUE_DARK} pl-0`}>
          <span className={ALARM_ICON_CLASS}>
            <SvgIcon name="alarmIcon" />
          </span>
          <div className={TEXT_CHIP_CLASS}>
            <SvgIcon name="boldIcon" />
          </div>
        </div>
      )}
      {game.isSportbook && isAuthenticated && (
        <span className={`${WRAPPER_BASE} ${WRAPPER_ORANGE}`}>
          <div className={TEXT_CHIP_CLASS}>
            <SvgIcon name="pIcon" />
          </div>
        </span>
      )}
      {isCricket && game.event?.name?.toLowerCase()?.includes('srl') && (
        <div className={EVENT_BOOK_WRAPPER}>
          <div className={EVENT_BOOK_ICON}>E</div>
          <div className={EVENT_BOOK_CONTENT}>{t('sports.cricket')}</div>
        </div>
      )}
    </>
  )
})

// Animation classes for the "odds-changed" pulse. The keyframes (`sparkBack`
// and `sparkLay`) are declared globally in src/index.css.
const BACK_SPARK = 'animate-[sparkBack_0.8s_ease-in-out]'
const LAY_SPARK = 'animate-[sparkLay_0.8s_ease-in-out]'

function useOddsSpark(value, isBack) {
  const previousValueRef = useRef(value)
  const [sparkClass, setSparkClass] = useState('')
  useEffect(() => {
    const previous = previousValueRef.current
    previousValueRef.current = value
    if (previous === value) return undefined
    setSparkClass(isBack ? BACK_SPARK : LAY_SPARK)
    const timer = setTimeout(() => setSparkClass(''), ODDS_SPARK_DURATION_MS)
    return () => clearTimeout(timer)
  }, [value, isBack])
  return sparkClass
}

// ─── Odds chip ─────────────────────────────────────────────────────────────
// Replaces `.data-chip` rules inside `.game-score-part`. Width/padding swap
// by sibling-index, so the wrapping row applies them through `[&>*:nth-child]`.
const DATA_CHIP_BASE =
  'w-full p-0.5 flex items-center justify-center h-full cursor-pointer ' +
  '[&_span]:flex [&_span]:items-center [&_span]:h-full [&_span]:w-full ' +
  '[&_span]:justify-center [&_span]:text-[11px]'

const ODDS_SPAN_BASE = 'text-center font-bold'
const ODDS_SPAN_BACK = 'bg-[var(--back-0)] hover:bg-[var(--back-0-hover)]'
const ODDS_SPAN_LAY = 'bg-[var(--lay-0)] hover:bg-[var(--lay-0-hover)]'
const ODDS_SPAN_DISABLED =
  'cursor-not-allowed relative ' +
  "before:content-[''] before:absolute before:inset-0 " +
  "before:bg-[rgba(51,51,51,0.2)_url('/img/bg-line.png')]"

const OddsCell = memo(function OddsCell({ value, isBack, disabled, onClick }) {
  const sparkClass = useOddsSpark(value, isBack)
  const spanClass = [
    ODDS_SPAN_BASE,
    isBack ? ODDS_SPAN_BACK : ODDS_SPAN_LAY,
    disabled ? ODDS_SPAN_DISABLED : '',
    sparkClass,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div
      className={DATA_CHIP_BASE}
      onClick={onClick}
      onKeyDown={activateOnKey(onClick)}
      role="button"
      tabIndex={0}
    >
      <span className={spanClass}>{value || '--'}</span>
    </div>
  )
})

// ─── Name / title block (`.name-wrap`) ─────────────────────────────────────
// White cursor block with the live-dot ::before. On mobile the dot becomes a
// floating circle pushed left of the title; on desktop it's an inline bullet.
const NAME_WRAP_CLASS = 'pt-[2px] pb-[3px] pl-2 cursor-pointer max-md:pl-0'

const MATCH_TITLE_BASE =
  'text-[var(--blue)] text-[12px] mb-0 relative font-semibold tracking-[0.01px] hover:underline ' +
  'max-md:text-[4vw] max-md:leading-[1.6] ' +
  "before:content-[''] before:bg-[var(--light-green)] before:border before:border-black/40 " +
  'before:rounded-full before:w-2 before:h-2 before:inline-block ' +
  'max-md:before:absolute max-md:before:right-full max-md:before:translate-x-[-5px] ' +
  'max-md:before:top-[1.6vw] max-md:before:w-[2.8vw] max-md:before:h-[2.8vw] ' +
  '[&>span]:max-md:overflow-hidden [&>span]:max-md:text-ellipsis [&>span]:max-md:line-clamp-1 ' +
  '[&>span]:max-md:[-webkit-box-orient:vertical] [&>span]:max-md:[display:-webkit-box]'

const MATCH_TITLE_NOT_IN_PLAY = 'before:!bg-[var(--sm-white)]'

const INPLAY_LABEL =
  'inline-block ml-1 text-[var(--dark-green)] font-bold text-[12px]'
const TIME_LABEL = 'inline-block ml-1 text-[var(--lg-dark-gray)] text-[12px]'

// ─── Desktop row (`.games-detail`) ─────────────────────────────────────────
const GAMES_DETAIL_BASE =
  'flex border-b border-[color:var(--light-bg)] last:border-b-[color:var(--sm-text-color)] ' +
  'max-md:last:border-b-[0.8vw] max-md:last:border-[color:var(--light-bg)] ' +
  'hover:bg-[var(--hover-bg)]'

const GAME_NAME_PART =
  'flex-1 flex items-center justify-between border-r border-[color:var(--light-bg)]'

const GAME_SCORE_PART =
  'basis-2/5 grow-0 shrink-0 flex items-center justify-end max-w-[41%] w-full ' +
  // Per-cell border/padding mirrors the original :nth-child(2..5) rules.
  '[&>div:nth-child(3)]:border-l [&>div:nth-child(3)]:border-r-0 [&>div:nth-child(3)]:border-[color:var(--light-bg)] [&>div:nth-child(3)]:pl-1 ' +
  '[&>div:nth-child(4)]:border-r [&>div:nth-child(4)]:border-[color:var(--light-bg)] [&>div:nth-child(4)]:pr-1 ' +
  '[&>div:nth-child(2)]:pr-1 [&>div:nth-child(5)]:pl-1'

const TOTAL_MATCHED_CLASS =
  'text-[11px] text-[var(--dark-gray)] whitespace-nowrap pr-1 flex-shrink-0'

const PIN_CHIP_CLASS =
  'h-full cursor-pointer min-w-[6%] w-auto text-center justify-center flex items-center'
const PIN_ICON_CLASS =
  'h-[21px] w-4 inline-block bg-[url(/img/pin-icon.png)] bg-no-repeat bg-center ' +
  'cursor-pointer hover:bg-[url(/img/pin-icon-hover.png)]'

const DesktopGameRow = memo(function DesktopGameRow({
  game,
  isAuthenticated,
  onSelect,
}) {
  const { t } = useTranslation()
  const eventId = game.event?.id ?? ''
  const name = game.event?.name ?? ''
  const openDate = game.event?.openDate
  const isInPlay = !!game.isInPlay
  const odds = game.odds_1x2 ?? []
  const totalMatched = game.totalMatched ?? 0

  const goToEvent = useCallback(() => onSelect(game), [game, onSelect])

  const titleClass = [
    'cursor-pointer',
    MATCH_TITLE_BASE,
    !isInPlay && MATCH_TITLE_NOT_IN_PLAY,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={GAMES_DETAIL_BASE}>
      <div className={GAME_NAME_PART}>
        <div className={NAME_WRAP_CLASS}>
          <h6
            className={titleClass}
            onClick={goToEvent}
            onKeyDown={activateOnKey(goToEvent)}
            role="button"
            tabIndex={0}
          >
            <span className="ml-1">{name}</span>
          </h6>
          <div className="flex gap-1 mt-1 ml-2">
            {isInPlay ? (
              <span className={INPLAY_LABEL}>{t('common.inPlay')}</span>
            ) : (
              <span className={TIME_LABEL}>{formatDate(openDate)}</span>
            )}
            <MarketChips game={game} isAuthenticated={isAuthenticated} />
          </div>
        </div>
        {!!totalMatched && (
          <div className={`pr-1 ${TOTAL_MATCHED_CLASS}`}>
            {formatNumber(totalMatched)}
          </div>
        )}
      </div>
      <div className={GAME_SCORE_PART}>
        {odds.map((odd, i) => {
          const isBack = i === 0 || i === 2 || i === 4
          return (
            <OddsCell
              key={`${eventId}-odd-${i}`}
              value={odd}
              isBack={isBack}
              disabled={!isInPlay}
              onClick={goToEvent}
            />
          )
        })}
        <span className={`${PIN_CHIP_CLASS}`}>
          <span className={PIN_ICON_CLASS} />
        </span>
      </div>
    </div>
  )
})

// ─── Mobile row (`.mobile-detail`) ─────────────────────────────────────────
const MOBILE_DETAIL_CLASS =
  'bg-white pt-[1.6vw] pb-[1.87vw] pr-[2.4vw] pl-[6.67vw] flex items-center justify-between gap-3 ' +
  'border-b border-[var(--light-bg)] cursor-pointer hover:bg-[#eff2f2]'

// `.icon-row` ─ chips + in-play / time text. Chip sizing already folded into
// the chip class builders above; here we only own the layout (flex + gap).
const ICON_ROW_CLASS = 'flex items-center gap-[1.33vw]'

const MOBILE_INPLAY_TEXT =
  'text-[var(--md-parrot)] max-md:text-[var(--primary)] max-md:text-[13px]'
const MOBILE_TIME_TEXT = 'text-[var(--dark-gray)]'

const ICON_PIN_CLASS =
  'h-6 w-6 flex items-center justify-center flex-none ' +
  '[&_svg]:w-[6.67vw] [&_svg]:h-[6.67vw]'

const GAMES_BORDER_CLASS =
  'max-md:last:border-b-[0.8vw] max-md:last:border-[var(--mobile-sport-active-menu-bg)]'

const MobileGameCard = memo(function MobileGameCard({
  game,
  isAuthenticated,
  onSelect,
}) {
  const { t } = useTranslation()
  const name = game.event?.name ?? ''
  const openDate = game.event?.openDate
  const isInPlay = !!game.isInPlay

  const goToEvent = useCallback(() => onSelect(game), [game, onSelect])

  const titleClass = [MATCH_TITLE_BASE, !isInPlay && MATCH_TITLE_NOT_IN_PLAY]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={GAMES_BORDER_CLASS}>
      <div
        className={MOBILE_DETAIL_CLASS}
        onClick={goToEvent}
        onKeyDown={activateOnKey(goToEvent)}
        role="button"
        tabIndex={0}
      >
        <div>
          <div className={ICON_ROW_CLASS}>
            <MarketChips game={game} isAuthenticated={isAuthenticated} />
            {isInPlay ? (
              <span className={MOBILE_INPLAY_TEXT}>{t('common.inPlay')}</span>
            ) : (
              <span className={MOBILE_TIME_TEXT}>{formatDate(openDate)}</span>
            )}
          </div>
          <div className={NAME_WRAP_CLASS}>
            <h6 className={titleClass}>
              <span>{name}</span>
            </h6>
          </div>
        </div>
        <span className={`${ICON_PIN_CLASS} cursor-pointer`}>
          <SvgIcon name="pinIcon" />
        </span>
      </div>
    </div>
  )
})

const RACING_GAMES_DETAILS_CLASS = 'py-1 px-2 max-md:py-1 max-md:px-5'

const RacingMarketRow = memo(function RacingMarketRow({
  game,
  market,
  isMobile,
  onSelect,
}) {
  const { t } = useTranslation()
  const goToMarket = useCallback(
    () => onSelect(game, market),
    [game, market, onSelect]
  )

  const titleClass = [
    'cursor-pointer m-0',
    MATCH_TITLE_BASE,
    !market.isInPlay && MATCH_TITLE_NOT_IN_PLAY,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={`${GAMES_DETAIL_BASE}${isMobile ? ` ${RACING_GAMES_DETAILS_CLASS}` : ''}`}
    >
      <div className={GAME_NAME_PART}>
        <div className={NAME_WRAP_CLASS}>
          <h6
            className={titleClass}
            onClick={goToMarket}
            onKeyDown={activateOnKey(goToMarket)}
            role="button"
            tabIndex={0}
          >
            {' '}
            {market.marketName}
            {market.isInPlay ? (
              <span className={INPLAY_LABEL}>{t('common.inPlay')}</span>
            ) : (
              <span className={TIME_LABEL}>
                {formatDate(market.marketStartTime)}
              </span>
            )}
          </h6>
        </div>
      </div>
    </div>
  )
})

const RacingGameItem = memo(function RacingGameItem({
  game,
  isMobile,
  onSelect,
}) {
  const { t } = useTranslation()
  const eventId = game.event?.id ?? ''
  const name = game.event?.name ?? ''
  const markets = game.markets ?? []

  return (
    <Accordion.Item eventKey={eventId}>
      <Accordion.Header>
        <span>{name}</span>
      </Accordion.Header>
      <Accordion.Body>
        {markets.length ? (
          markets.map((market) => (
            <RacingMarketRow
              key={market.marketId}
              game={game}
              market={market}
              isMobile={isMobile}
              onSelect={onSelect}
            />
          ))
        ) : (
          <NoData message={t('common.noEventsFound')} />
        )}
      </Accordion.Body>
    </Accordion.Item>
  )
})

function LoadingState() {
  const { t } = useTranslation()
  return (
    <div
      className="flex items-center justify-center text-gray-500 p-3"
      role="status"
      aria-live="polite"
    >
      {t('common.loader.pleaseWait', 'Loading…')}
    </div>
  )
}

// ─── Header strip above desktop rows ───────────────────────────────────────
// `.game-detail-header` ─ thin grey bar with 1 / X / 2 column labels.
const GAME_DETAIL_HEADER_CLASS =
  'flex items-center bg-[var(--xl-th-bg)] justify-end ' +
  'max-[991px]:shadow-none max-[991px]:justify-start max-[991px]:pl-2'

const GAME_DETAIL_INNER_CLASS = 'flex items-center max-w-[40%] w-full'

const GAME_DETAIL_HEADING_CLASS =
  'text-[var(--header-primary)] flex-1 mx-1 text-center py-1 text-[12px] leading-[17px]'

// `.game-wrap` ─ container that paints rows white & owns the bottom border.
const GAME_WRAP_CLASS =
  'bg-white [&_.accordion]:border-b [&_.accordion]:border-[var(--light-bg)] ' +
  '[&_.accordion-body]:p-0 [&_.accordion-body]:bg-white'

export default function GameList({
  games,
  sport,
  filterType = GAME_LIST_FILTERS.TIME,
  loading = false,
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const isRacingSport = RACING_SPORTS.has(sport ?? '')

  const visibleGames = useMemo(() => {
    if (!games?.length) return EMPTY_GAMES
    return games.filter((g) => {
      if (!g.event?.id) return false
      if (isRacingSport && !(g.markets?.length > 0)) return false
      return true
    })
  }, [games, isRacingSport])

  const competitionGroups = useMemo(() => {
    if (!visibleGames.length) return EMPTY_GAMES
    const map = new Map()
    for (const game of visibleGames) {
      const cid = game.competition?.id ?? ''
      if (!map.has(cid)) {
        map.set(cid, {
          competitionId: cid,
          competitionName: game.competition?.name ?? '',
          games: [],
        })
      }
      map.get(cid).games.push(game)
    }
    return Array.from(map.values())
  }, [visibleGames])

  const onSelect = useCallback(
    (game, market) => {
      if (game?.isMarketBlocked) return
      const sportId = game?.sport?.id
      const id = game?.event?.id
      if (!sportId || !id) return
      const slug = getSportSlug(sportId)
      if (isRacingSport) {
        if (!market?.marketId) return
        navigate(`/racing-odds/${id}/${market.marketId}/${slug}`)
        return
      }
      navigate(`/odds/${id}/${slug}`)
    },
    [isRacingSport, navigate]
  )

  const renderEmpty = () =>
    loading ? <LoadingState /> : <NoData message={t('common.noEventsFound')} />

  if (isRacingSport) {
    if (!visibleGames.length) return renderEmpty()
    return (
      <Accordion
        key={`race-${sport}`}
        defaultActiveKey={visibleGames.map((g) => g.event.id)}
        alwaysOpen
      >
        {visibleGames.map((game) => (
          <RacingGameItem
            key={game.event.id}
            game={game}
            isMobile={isMobile}
            onSelect={onSelect}
          />
        ))}
      </Accordion>
    )
  }

  if (isMobile) {
    if (filterType === GAME_LIST_FILTERS.COMPETITION) {
      if (!competitionGroups.length) return renderEmpty()
      return (
        <Accordion
          key={`mcomp-${sport}`}
          defaultActiveKey={competitionGroups.map((g) => g.competitionId)}
          alwaysOpen
        >
          {competitionGroups.map((group) => (
            <Accordion.Item
              eventKey={group.competitionId}
              key={group.competitionId}
            >
              <Accordion.Header variant="light">
                {group.competitionName}
              </Accordion.Header>
              <Accordion.Body>
                {group.games.map((game) => (
                  <MobileGameCard
                    key={game.event.id}
                    game={game}
                    isAuthenticated={isAuthenticated}
                    onSelect={onSelect}
                  />
                ))}
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )
    }
    if (!visibleGames.length) return renderEmpty()
    return (
      <>
        {visibleGames.map((game) => (
          <MobileGameCard
            key={game.event.id}
            game={game}
            isAuthenticated={isAuthenticated}
            onSelect={onSelect}
          />
        ))}
      </>
    )
  }

  return (
    <div>
      {visibleGames.length > 0 && (
        <div className={GAME_DETAIL_HEADER_CLASS}>
          <div className="pr-1">{t('markets.matched')}</div>
          <div className={GAME_DETAIL_INNER_CLASS}>
            <div className={GAME_DETAIL_HEADING_CLASS}>1</div>
            <div className={GAME_DETAIL_HEADING_CLASS}>x</div>
            <div className={GAME_DETAIL_HEADING_CLASS}>2</div>
            <div className="min-w-[30px]" />
          </div>
        </div>
      )}
      {filterType === GAME_LIST_FILTERS.COMPETITION ? (
        <div className={GAME_WRAP_CLASS}>
          {competitionGroups.length === 0 ? (
            renderEmpty()
          ) : (
            <Accordion
              key={`dcomp-${sport}`}
              defaultActiveKey={competitionGroups.map((g) => g.competitionId)}
              alwaysOpen
            >
              {competitionGroups.map((group) => (
                <Accordion.Item
                  eventKey={group.competitionId}
                  key={group.competitionId}
                >
                  <Accordion.Header variant="light">
                    {group.competitionName}
                  </Accordion.Header>
                  <Accordion.Body>
                    {group.games.map((game) => (
                      <DesktopGameRow
                        key={game.event.id}
                        game={game}
                        isAuthenticated={isAuthenticated}
                        onSelect={onSelect}
                      />
                    ))}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </div>
      ) : (
        <div className={GAME_WRAP_CLASS}>
          {visibleGames.length === 0
            ? renderEmpty()
            : visibleGames.map((game) => (
                <DesktopGameRow
                  key={game.event.id}
                  game={game}
                  isAuthenticated={isAuthenticated}
                  onSelect={onSelect}
                />
              ))}
        </div>
      )}
    </div>
  )
}
