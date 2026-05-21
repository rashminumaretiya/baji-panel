import { memo, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Accordion } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import NoData from '../../shared/NoData.jsx'
import SvgIcon from '../SvgIcon.jsx'
import { useIsMobile } from '../../hooks/useMediaQuery.js'
import { RACING_SPORTS, PINNABLE_SPORT_IDS, GAME_LIST_FILTERS } from '../../core/constant/constants.js'
import { selectIsAuthenticated } from '../../store/slices/authSlice.js'
import './game-list.scss'

function formatNumber(n) {
  if (n == null) return ''
  return new Intl.NumberFormat('en-US').format(n)
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function activateOnKey(handler) {
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handler(e)
    }
  }
}

function MarketChips({ game }) {
  const { t } = useTranslation()
  return (
    <>
      {game.isInPlay && (
        <span className="wrapper blue-dark">
          <div className="text-chip"><SvgIcon name="playIcon" /></div>
        </span>
      )}
      {game.isFancy && (
        <span className="current-chip lightest-neavy ps-0">
          <span className="alarm-icon"><SvgIcon name="alarmIcon" /></span>
          <div className="text-chip"><SvgIcon name="fIcon" /></div>
        </span>
      )}
      {game.isBookmaker && (
        <div className="current-chip blue-dark ps-0">
          <span className="alarm-icon"><SvgIcon name="alarmIcon" /></span>
          <div className="text-chip"><SvgIcon name="boldIcon" /></div>
        </div>
      )}
      {game.isSportbook && (
        <span className="wrapper orange-darkest">
          <div className="text-chip"><SvgIcon name="pIcon" /></div>
        </span>
      )}
      {game.sportId === '4' && game.name?.toLowerCase()?.includes('srl') && (
        <div className="event-related-electronic-book">
          <div className="event-related-electronic-book-icon">E</div>
          <div className="event-related-electronic-book-content">{t('sports.cricket')}</div>
        </div>
      )}
    </>
  )
}

const OddsCell = memo(function OddsCell({ value, isBack, disabled, onClick }) {
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
        ].filter(Boolean).join(' ')}
      >
        {value || '--'}
      </span>
    </div>
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
  filterType = GAME_LIST_FILTERS.HIGHLIGHTS,
  pinnedEventIds = new Set(),
  onPinClick,
  loading = false,
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const isRacingSport = RACING_SPORTS.has(sport ?? '')
  const renderEmpty = () =>
    loading ? <LoadingState /> : <NoData message={t('common.noEventsFound')} />

  const gameListVM = useMemo(() => {
    if (!games?.length) return []
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now()
    return games
      .map((g) => {
        const markets = (g.markets ?? []).map((m) => ({
          ...m,
          isInPlay: m.isInPlay || new Date(m.marketStartTime).getTime() < now,
        }))
        return {
          id: g.event?.id ?? '',
          name: g.event?.name ?? '',
          openDate: g.event?.openDate,
          isInPlay: g.isInPlay,
          sportName: g.sport?.name,
          sportId: g.sport?.id,
          odds: g.odds_1x2 ?? [],
          isFancy: g.isFancy,
          isBookmaker: g.isBookmaker,
          isMatchOdds: g.isMatchOdds,
          isSportbook: g.isSportbook,
          isMarketBlocked: false,
          totalMatched: g.totalMatched ?? 0,
          competitionId: g.competition?.id ?? '',
          competitionName: g.competition?.name ?? '',
          markets,
        }
      })
      .filter((game) => game.id && (isRacingSport ? game.markets?.length > 0 : true))
      .sort((a, b) => {
        const aPinned = pinnedEventIds.has(a.id) ? 0 : 1
        const bPinned = pinnedEventIds.has(b.id) ? 0 : 1
        return aPinned - bPinned
      })
  }, [games, isRacingSport, pinnedEventIds])

  const competitionGroups = useMemo(() => {
    const map = new Map()
    for (const game of gameListVM) {
      if (!map.has(game.competitionId)) {
        map.set(game.competitionId, {
          competitionId: game.competitionId,
          competitionName: game.competitionName,
          games: [],
        })
      }
      map.get(game.competitionId).games.push(game)
    }
    return Array.from(map.values())
  }, [gameListVM])

  function navigateToOddsPage(game, market) {
    if (game?.isMarketBlocked) return
    const sportId = game?.sportId
    const id = game?.id
    if (!sportId || !id) return
    const path = ['/game-details', sportId, id]
    if (isRacingSport) {
      if (!market?.marketId) return
      path.push(market.marketId)
    }
    navigate(path.join('/'))
  }

  function handlePinClick(e, game) {
    e.stopPropagation()
    if (!isAuthenticated) return
    if (!PINNABLE_SPORT_IDS.has(game.sportId)) return
    onPinClick?.(game)
  }

  function renderDesktopGameRow(game) {
    const goToEvent = () => navigateToOddsPage(game)
    const togglePin = (e) => handlePinClick(e, game)
    const isPinned = pinnedEventIds.has(game.id)
    return (
      <div className="games-detail" key={game.id}>
        <div className="game-name-part">
          <div className="name-wrap">
            <h6
              className={`cursor-pointer match-title${!game.isInPlay ? ' not-in-play' : ''}`}
              onClick={goToEvent}
              onKeyDown={activateOnKey(goToEvent)}
              role="button"
              tabIndex={0}
            >
              <span className="ms-1">{game.name}</span>
            </h6>
            <div className="d-flex gap-1 mt-1 ms-2">
              {game.isInPlay ? (
                <span className="d-inline-block ms-1 inplay">{t('common.inPlay')}</span>
              ) : (
                <span className="d-inline-block ms-1 time">{formatDate(game.openDate)}</span>
              )}
              <MarketChips game={game} />
            </div>
          </div>
          {!!game.totalMatched && (
            <div className="pe-1 total-matched">{formatNumber(game.totalMatched)}</div>
          )}
        </div>
        <div className="game-score-part">
          {game.odds.map((odd, i) => {
            const isBack = i === 0 || i === 2 || i === 4
            return (
              <OddsCell
                key={`${game.id}-odd-${i}`}
                value={odd}
                isBack={isBack}
                disabled={!game.isInPlay}
                onClick={goToEvent}
              />
            )
          })}
          <span className="data-chip pin">
            <span
              className={`pin-icon cursor-pointer${isPinned ? ' pin-active' : ''}`}
              onClick={togglePin}
              onKeyDown={activateOnKey(togglePin)}
              role="button"
              tabIndex={0}
              aria-label={isPinned ? t('common.unpinEvent') : t('common.pinEvent')}
            >
              <SvgIcon name={isPinned ? 'unPinIcon' : 'pinIcon'} />
            </span>
          </span>
        </div>
      </div>
    )
  }

  function renderMobileGameCard(game) {
    const goToEvent = () => navigateToOddsPage(game)
    const togglePin = (e) => handlePinClick(e, game)
    const isPinned = pinnedEventIds.has(game.id)
    return (
      <div className="games-border" key={game.id}>
        <div
          className="mobile-detail cursor-pointer"
          onClick={goToEvent}
          onKeyDown={activateOnKey(goToEvent)}
          role="button"
          tabIndex={0}
        >
          <div>
            <div className="icon-row">
              <MarketChips game={game} />
              {game.isInPlay ? (
                <span className="text-inplay inplay">{t('common.inPlay')}</span>
              ) : (
                <span className="text-inplay time">{formatDate(game.openDate)}</span>
              )}
            </div>
            <div className="name-wrap">
              <h6 className={`match-title${!game.isInPlay ? ' not-in-play' : ''}`}>
                <span>{game.name}</span>
              </h6>
            </div>
          </div>
          <span
            className={`icon-wrapper-pin cursor-pointer${isPinned ? ' pin-active' : ''}`}
            onClick={togglePin}
            onKeyDown={activateOnKey(togglePin)}
            role="button"
            tabIndex={0}
            aria-label={isPinned ? t('common.unpinEvent') : t('common.pinEvent')}
          >
            <SvgIcon name={isPinned ? 'unPinIcon' : 'pinIcon'} />
          </span>
        </div>
      </div>
    )
  }

  if (isRacingSport) {
    if (!gameListVM.length) return renderEmpty()
    return (
      <Accordion key={`race-${sport}`} defaultActiveKey={gameListVM.map((g) => g.id)} alwaysOpen>
        {gameListVM.map((game) => (
          <Accordion.Item eventKey={game.id} key={game.id}>
            <Accordion.Header>
              <span className="racing-event-name">{game.name}</span>
              <span className="ms-2 time">{formatDate(game.openDate)}</span>
            </Accordion.Header>
            <Accordion.Body>
              {game.markets.length ? (
                game.markets.map((market) => {
                  const goToMarket = () => navigateToOddsPage(game, market)
                  return (
                    <div
                      key={market.marketId}
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
                              <span className="d-inline-block ms-1 inplay">{t('common.inPlay')}</span>
                            ) : (
                              <span className="d-inline-block ms-1 time">{formatDate(market.marketStartTime)}</span>
                            )}
                          </h6>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <NoData message={t('common.noEventsFound')} />
              )}
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    )
  }

  if (isMobile) {
    if (filterType === GAME_LIST_FILTERS.COMPETITION) {
      if (!competitionGroups.length) return renderEmpty()
      return (
        <Accordion key={`mcomp-${sport}`} defaultActiveKey={competitionGroups.map((g) => g.competitionId)} alwaysOpen>
          {competitionGroups.map((group) => (
            <Accordion.Item eventKey={group.competitionId} key={group.competitionId}>
              <Accordion.Header>{group.competitionName}</Accordion.Header>
              <Accordion.Body>
                {group.games.map(renderMobileGameCard)}
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )
    }
    if (!gameListVM.length) return renderEmpty()
    return <>{gameListVM.map(renderMobileGameCard)}</>
  }

  return (
    <>
      {gameListVM.length > 0 && (
        <div className="game-detail-header">
          <div className="pe-1 heading-matched">{t('markets.matched')}</div>
          <div className="game-detail-inner">
            <div className="heading">1</div>
            <div className="heading">X</div>
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
            <Accordion key={`dcomp-${sport}`} defaultActiveKey={competitionGroups.map((g) => g.competitionId)} alwaysOpen>
              {competitionGroups.map((group) => (
                <Accordion.Item eventKey={group.competitionId} key={group.competitionId}>
                  <Accordion.Header>{group.competitionName}</Accordion.Header>
                  <Accordion.Body>
                    {group.games.map(renderDesktopGameRow)}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </div>
      ) : (
        <div className="game-wrap">
          {gameListVM.length === 0 ? (
            renderEmpty()
          ) : (
            gameListVM.map(renderDesktopGameRow)
          )}
        </div>
      )}
    </>
  )
}
