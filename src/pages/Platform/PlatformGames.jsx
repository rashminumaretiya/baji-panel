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
import SvgIcon from '../../components/SvgIcon.jsx'

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
        <div className="relative mt-1 p-3 bg-[var(--xs-gray)] text-[#633]">
          <input
            type="text"
            className="w-full max-w-full border-0 rounded-[25px] py-[10px] pl-[50px] pr-[14px] text-sm bg-white focus:outline-none text-black"
            placeholder={t(
              'platform.searchGamePlaceholder',
              'Search game'
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <SvgIcon
            name="searchIconSolid"
            className="absolute top-1/2 left-[24px] -translate-y-1/2 text-[#633] [&_svg]:h-5 [&_svg]:w-5"
          />
          {search && (
            <SvgIcon
              name="cross"
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
              className="absolute top-1/2 right-[16px] -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-[rgb(176_125_74)] text-white cursor-pointer [&_svg]:h-4 [&_svg]:w-4 [&_svg]:p-1 text-white!"
            />
          )}
        </div>
      )}
      <div className="relative z-[9] cursor-pointer bg-[url('/img/platform/bg-default.jpg')] bg-cover px-5 py-[10px] md:min-h-[110px]">
        <div className="relative max-w-[80rem] w-full mx-auto md:min-h-[90px] flex justify-between">
          <div
            className="mt-2 md:mt-0 flex items-center h-full cursor-pointer"
            onClick={() => navigate('/platform')}
            role="presentation"
          >
            <SvgIcon
              name="leftBigArrow"
              className="inline-block mr-1 text-white [&_svg]:h-[30px] [&_svg]:w-[30px]"
            />
            <span className="font-bold text-base text-white">{selectedGame?.label}</span>
          </div>
          <div className="p-1 md:p-[2px] md:absolute md:-bottom-[22px] md:left-[22px] rounded-full bg-[linear-gradient(to_right_top,#654302,#f7c972,#644202,#f7c972,#694809,#f7c972,#6f4d0c)]">
            <img
              src={selectedGame?.image}
              alt={selectedGame?.label}
              className="rounded-full h-[68px] w-[68px] md:h-[70px] md:w-[70px] object-contain bg-[radial-gradient(circle,#262626_0%,#0a0a0a_100%)]"
            />
          </div>
        </div>
      </div>
      <div className="min-h-[calc(100svh-298px)] max-h-[calc(100svh-298px)] md:min-h-[calc(100svh-208px)] md:max-h-[calc(100svh-208px)] overflow-y-auto text-white bg-[radial-gradient(circle,#262626_0%,#0a0a0a_100%)]">
        <div className="flex flex-wrap max-w-full md:max-w-[80rem] w-full mx-auto pt-3 pb-3 px-1 md:px-0">
          {visibleGames.length === 0 ? (
            <p className="text-center text-white opacity-60 mt-8 w-full">
              {t('noData.default', 'No data found')}
            </p>
          ) : (
            visibleGames.map((game, idx) => (
              <div
                key={`${game.gameName}-${idx}`}
                className="mb-2 cursor-pointer p-[3px] md:p-1 w-auto md:w-[152px]"
                onClick={() => playCasinoByMerchant(game)}
                role="presentation"
              >
                <div className="flex items-center justify-between bg-[url('/img/platform/bg-game-purple.webp')] bg-[length:100%_auto] bg-no-repeat pl-4 md:pl-8 pr-1 text-white">
                  <SvgIcon
                    name={selectedGame?.icon || 'slotAWC'}
                    className="inline-flex text-white [&_svg]:h-4 [&_svg]:w-4"
                  />
                  <span className="text-[10px] whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px] md:max-w-none">
                    {selectedGame?.label}
                  </span>
                </div>
                <div className="relative z-[2] w-[114px] h-[114px] md:w-full md:h-auto p-[6px] mb-2">
                  <img
                    src={resolveCasinoImgUrl(game.image, casinoGameImages)}
                    alt={game.gameName}
                    className="block mx-auto h-[102px] max-w-[102px] md:h-[134px] md:max-w-full object-cover"
                  />
                  <div className="absolute inset-0 -z-[1] pt-[100px] md:pt-[144px] bg-no-repeat bg-contain bg-center bg-[url('/img/platform/img-silver-bg.webp')]"></div>
                </div>
                <h6 className="mb-0 text-center text-[14px] font-bold text-[#e8c991] w-[114px] md:w-full">
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
