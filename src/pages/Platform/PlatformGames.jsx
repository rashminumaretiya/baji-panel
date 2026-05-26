import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { selectIsMobile } from '../../store/slices/commonSlice.js'
import {
  launchCasinogame,
  selectCasinoGameImages,
} from '../../store/slices/casinoSlice.js'
import { resolveCasinoImgUrl } from '../../shared/services/casino-img-url.js'
import {
  CrossIcon,
  LeftBigArrowIcon,
  SearchIconSolidIcon,
  SlotAwcIcon,
  iconMap,
} from '../../components/icons.jsx'

export default function PlatformGames() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const isMobile = useSelector(selectIsMobile)
  const casinoGameImages = useSelector(selectCasinoGameImages)
  const [search, setSearch] = useState('')

  const casinoGames = useMemo(
    () => location.state?.games ?? [],
    [location.state]
  )
  const selectedGame = location.state?.selectedGame ?? null

  const visibleGames = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return casinoGames
    return casinoGames.filter((g) => g.gameName?.toLowerCase().includes(q))
  }, [casinoGames, search])

  const playCasinoByMerchant = (game) => {
    dispatch(launchCasinogame(game))
  }

  return (
    <div className="w-full">
      {isMobile && (
        <div className="relative mt-1 bg-[var(--xs-gray)] p-3 text-[#633]">
          <input
            type="text"
            className="w-full max-w-full rounded-[25px] border-0 bg-white py-[10px] pr-[14px] pl-[50px] text-sm text-black focus:outline-none"
            placeholder={t('platform.searchGamePlaceholder', 'Search game')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <SearchIconSolidIcon className="absolute top-1/2 left-[24px] -translate-y-1/2 text-[#633] [&_svg]:h-5 [&_svg]:w-5" />
          {search && (
            <CrossIcon
              onClick={() => setSearch('')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSearch('')
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={t('platform.searchClear', 'Clear search')}
              className="absolute top-1/2 right-[16px] flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[rgb(176_125_74)] text-white text-white! [&_svg]:h-4 [&_svg]:w-4 [&_svg]:p-1"
            />
          )}
        </div>
      )}
      <div className="relative z-[9] cursor-pointer bg-[url('/img/platform/bg-default.jpg')] bg-cover px-5 py-[10px] md:min-h-[110px]">
        <div className="relative mx-auto flex w-full max-w-[80rem] justify-between md:min-h-[90px]">
          <div
            className="mt-2 flex h-full cursor-pointer items-center md:mt-0"
            onClick={() => navigate('/platform')}
            role="presentation"
          >
            <LeftBigArrowIcon className="mr-1 inline-block text-white [&_svg]:h-[30px] [&_svg]:w-[30px]" />
            <span className="text-base font-bold text-white">
              {selectedGame?.label}
            </span>
          </div>
          <div className="rounded-full bg-[linear-gradient(to_right_top,#654302,#f7c972,#644202,#f7c972,#694809,#f7c972,#6f4d0c)] p-1 md:absolute md:-bottom-[22px] md:left-[22px] md:p-[2px]">
            <img
              loading="lazy"
              decoding="async"
              src={selectedGame?.image}
              alt={selectedGame?.label}
              className="h-[68px] w-[68px] rounded-full bg-[radial-gradient(circle,#262626_0%,#0a0a0a_100%)] object-contain md:h-[70px] md:w-[70px]"
            />
          </div>
        </div>
      </div>
      <div className="max-h-[calc(100svh-298px)] min-h-[calc(100svh-298px)] overflow-y-auto bg-[radial-gradient(circle,#262626_0%,#0a0a0a_100%)] text-white md:max-h-[calc(100svh-208px)] md:min-h-[calc(100svh-208px)]">
        <div className="mx-auto flex w-full max-w-full flex-wrap px-1 pt-3 pb-3 md:max-w-[80rem] md:px-0">
          {visibleGames.length === 0 ? (
            <p className="mt-8 w-full text-center text-white opacity-60">
              {t('noData.default', 'No data found')}
            </p>
          ) : (
            visibleGames.map((game, idx) => (
              <div
                key={`${game.gameName}-${idx}`}
                className="mb-2 w-auto cursor-pointer p-[3px] md:w-[152px] md:p-1"
                onClick={() => playCasinoByMerchant(game)}
                role="presentation"
              >
                <div className="flex items-center justify-between bg-[url('/img/platform/bg-game-purple.webp')] bg-[length:100%_auto] bg-no-repeat pr-1 pl-4 text-white md:pl-8">
                  {(() => {
                    const GameIcon = iconMap[selectedGame?.icon] || SlotAwcIcon
                    return (
                      <GameIcon className="inline-flex text-white [&_svg]:h-4 [&_svg]:w-4" />
                    )
                  })()}
                  <span className="max-w-[80px] overflow-hidden text-[10px] text-ellipsis whitespace-nowrap md:max-w-none">
                    {selectedGame?.label}
                  </span>
                </div>
                <div className="relative z-[2] mb-2 h-[114px] w-[114px] p-[6px] md:h-auto md:w-full">
                  <img
                    loading="lazy"
                    decoding="async"
                    src={resolveCasinoImgUrl(game.image, casinoGameImages)}
                    alt={game.gameName}
                    className="mx-auto block h-[102px] max-w-[102px] object-cover md:h-[134px] md:max-w-full"
                  />
                  <div className="absolute inset-0 -z-[1] bg-[url('/img/platform/img-silver-bg.webp')] bg-contain bg-center bg-no-repeat pt-[100px] md:pt-[144px]"></div>
                </div>
                <h6 className="mb-0 w-[114px] text-center text-[14px] font-bold text-[#e8c991] md:w-full">
                  {game.gameName}
                </h6>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
