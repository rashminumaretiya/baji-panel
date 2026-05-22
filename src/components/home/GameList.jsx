import { memo, useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { Accordion } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
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
import './game-list.scss'

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

const MarketChips = memo(function MarketChips({ game, isAuthenticated }) {
  const { t } = useTranslation()
  const isCricket = game.sport?.id === SPORT_IDS.CRICKET
  return (
    <>
      {game.isInPlay && (
        <span className="wrapper blue-dark">
          <div className="text-chip">
            <SvgIcon name="playIcon" />
          </div>
        </span>
      )}
      {isCricket && game.isFancy && (
        <span className="current-chip lightest-neavy ps-0">
          <span className="alarm-icon">
            <SvgIcon name="alarmIcon" />
          </span>
          <div className="text-chip">
            <SvgIcon name="fIcon" />
          </div>
        </span>
      )}
      {game.isBookmaker && (
        <div className="current-chip blue-dark ps-0">
          <span className="alarm-icon">
            <SvgIcon name="alarmIcon" />
          </span>
          <div className="text-chip">
            <SvgIcon name="boldIcon" />
          </div>
        </div>
      )}
      {game.isSportbook && isAuthenticated && (
        <span className="wrapper orange-darkest">
          <div className="text-chip">
            <SvgIcon name="pIcon" />
          </div>
        </span>
      )}
      {isCricket && game.event?.name?.toLowerCase()?.includes('srl') && (
        <div className="event-related-electronic-book">
          <div className="event-related-electronic-book-icon">E</div>
          <div className="event-related-electronic-book-content">
            {t('sports.cricket')}
          </div>
        </div>
      )}
    </>
  )
})

function useOddsSpark(value, isBack) {
  const previousValueRef = useRef(value)
  const [sparkClass, setSparkClass] = useState('')
  useEffect(() => {
    const previous = previousValueRef.current
    previousValueRef.current = value
    if (previous === value) return undefined
    setSparkClass(isBack ? 'back-spark' : 'lay-spark')
    const timer = setTimeout(() => setSparkClass(''), ODDS_SPARK_DURATION_MS)
    return () => clearTimeout(timer)
  }, [value, isBack])
  return sparkClass
}

const OddsCell = memo(function OddsCell({ value, isBack, disabled, onClick }) {
  const sparkClass = useOddsSpark(value, isBack)
  return (
    <div
      className="data-chip cursor-pointer"
      onClick={onClick}
      onKeyDown={activateOnKey(onClick)}
      role="button"
      tabIndex={0}
    >
      <span
        className={[
          'text-center fw-bold',
          isBack ? 'blue-xs' : 'red-xs',
          disabled ? 'disable-odds' : '',
          sparkClass,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value || '--'}
      </span>
    </div>
  )
})

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

  return (
    <div className="games-detail">
      <div className="game-name-part">
        <div className="name-wrap">
          <h6
            className={`cursor-pointer match-title${!isInPlay ? ' not-in-play' : ''}`}
            onClick={goToEvent}
            onKeyDown={activateOnKey(goToEvent)}
            role="button"
            tabIndex={0}
          >
            <span className="ms-1">{name}</span>
          </h6>
          <div className="d-flex gap-1 mt-1 ms-2">
            {isInPlay ? (
              <span className="d-inline-block ms-1 inplay">
                {t('common.inPlay')}
              </span>
            ) : (
              <span className="d-inline-block ms-1 time">
                {formatDate(openDate)}
              </span>
            )}
            <MarketChips game={game} isAuthenticated={isAuthenticated} />
          </div>
        </div>
        {!!totalMatched && (
          <div className="pe-1 total-matched">
            {formatNumber(totalMatched)}
          </div>
        )}
      </div>
      <div className="game-score-part">
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
        <span className="data-chip pin">
          <span className="pin-icon cursor-pointer" />
        </span>
      </div>
    </div>
  )
})

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

  return (
    <div className="games-border">
      <div
        className="mobile-detail cursor-pointer"
        onClick={goToEvent}
        onKeyDown={activateOnKey(goToEvent)}
        role="button"
        tabIndex={0}
      >
        <div>
          <div className="icon-row">
            <MarketChips game={game} isAuthenticated={isAuthenticated} />
            {isInPlay ? (
              <span className="text-inplay inplay">{t('common.inPlay')}</span>
            ) : (
              <span className="text-inplay time">{formatDate(openDate)}</span>
            )}
          </div>
          <div className="name-wrap">
            <h6 className={`match-title${!isInPlay ? ' not-in-play' : ''}`}>
              <span>{name}</span>
            </h6>
          </div>
        </div>
        <span className="icon-wrapper-pin cursor-pointer">
          <SvgIcon name="pinIcon" />
        </span>
      </div>
    </div>
  )
})

const RacingMarketRow = memo(function RacingMarketRow({
  game,
  market,
  isMobile,
  onSelect,
}) {
  const { t } = useTranslation()
  const goToMarket = useCallback(
    () => onSelect(game, market),
    [game, market, onSelect],
  )
  return (
    <div
      className={`games-detail${isMobile ? ' racing-games-details' : ''}`}
    >
      <div className="game-name-part">
        <div className="name-wrap">
          <h6
            className={`cursor-pointer m-0${!market.isInPlay ? ' not-in-play' : ''}`}
            onClick={goToMarket}
            onKeyDown={activateOnKey(goToMarket)}
            role="button"
            tabIndex={0}
          >
            {market.marketName}
            {market.isInPlay ? (
              <span className="d-inline-block ms-1 inplay">
                {t('common.inPlay')}
              </span>
            ) : (
              <span className="d-inline-block ms-1 time">
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
        <span className="racing-event-name">{name}</span>
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
      className="d-flex align-items-center justify-content-center text-secondary p-3"
      role="status"
      aria-live="polite"
    >
      {t('common.loader.pleaseWait', 'Loading…')}
    </div>
  )
}

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
    [isRacingSport, navigate],
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
              <Accordion.Header>{group.competitionName}</Accordion.Header>
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
    <div className="game-details-container">
      {visibleGames.length > 0 && (
        <div className="game-detail-header">
          <div className="pe-1">{t('markets.matched')}</div>
          <div className="game-detail-inner">
            <div className="heading">1</div>
            <div className="heading">x</div>
            <div className="heading">2</div>
            <div className="data-chip" />
          </div>
        </div>
      )}
      {filterType === GAME_LIST_FILTERS.COMPETITION ? (
        <div className="game-wrap">
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
                  <Accordion.Header>{group.competitionName}</Accordion.Header>
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
        <div className="game-wrap">
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
