import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { selectIsMobile } from '../../store/slices/commonSlice.js'
import {
  launchCasinogame,
  selectCasinoProviders,
} from '../../store/slices/casinoSlice.js'
import {
  HorizontleListIcon,
  SearchIcon,
  VerticleListIcon,
  iconMap,
} from '../../components/icons.jsx'

const PROVIDER_ICONS = {
  spribe: 'kingmaker',
  sexy: 'sexy',
  kingmaker: 'slotAWC',
  jili: 'kingmaker',
  evolution: 'kingmaker',
  pp: 'kingmaker',
  jdb: 'kingmaker',
  redtiger: 'sexy',
  sv388: 'sexy',
  'pg soft': 'sexy',
  netent: 'kingmaker',
  spade: 'kingmaker',
  fachai: 'kingmaker',
  playtech: 'kingmaker',
}
const DEFAULT_PROVIDER_ICON = 'slotAWC'

const GRID_COVER_BASE = '/img/platform/games-cover'
const PROVIDER_GRID_COVERS = {
  spribe: 'SPRIBE_cover.webp',
  sexy: 'SEXYBCRT_cover.webp',
  kingmaker: 'KINGMAKER_cover.webp',
  jili: 'JILI_cover.webp',
  evolution: 'EVOLUTION_cover.webp',
  pp: 'PP_cover.webp',
  jdb: 'JDB_cover.webp',
  redtiger: 'RED_TIGER_cover.webp',
  sv388: 'SV388_cover.webp',
  'pg soft': 'PG_SOFT_cover.webp',
  netent: 'NETENT_cover.webp',
  spade: 'SPADE_cover.webp',
  fachai: 'FACHAI_cover.webp',
  playtech: 'PT_cover.webp',
}
const DEFAULT_GRID_COVER = `${GRID_COVER_BASE}/SLOT_cover.webp`

function providerIcon(provider) {
  return PROVIDER_ICONS[provider] ?? DEFAULT_PROVIDER_ICON
}
function providerGridCover(provider) {
  const file = PROVIDER_GRID_COVERS[provider]
  return file ? `${GRID_COVER_BASE}/${file}` : DEFAULT_GRID_COVER
}

export default function PlatformList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const isMobile = useSelector(selectIsMobile)
  const providers = useSelector(selectCasinoProviders)
  const [isGridView, setIsGridView] = useState(false)
  const [search, setSearch] = useState('')

  const visibleProviders = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return providers
    return providers.filter((p) => p.label?.toLowerCase().includes(q))
  }, [providers, search])

  const handleProviderClick = (provider) => {
    if (provider.games?.length > 1) {
      navigate(`/platform/${provider.provider}`, {
        state: {
          games: provider.games,
          selectedGame: {
            label: provider.label,
            image: provider.image,
            icon: providerIcon(provider.provider),
          },
        },
      })
      return
    }
    const game = provider.games?.[0]
    if (game) dispatch(launchCasinogame(game))
  }

  const toggleClass = (active) =>
    active
      ? 'relative p-0 cursor-pointer text-[#fadda6] [&_svg]:h-6 [&_svg]:w-6 after:content-[""] after:absolute after:top-[30px] after:left-0 after:min-w-[24px] after:border-b after:border-[#fadda6]'
      : 'p-0 cursor-pointer text-white! [&_svg]:h-6 [&_svg]:w-6'

  return (
    <div className="min-h-[calc(100vh-98px)] text-[#fadda6] bg-[radial-gradient(circle,#262626_0%,#0a0a0a_100%)] p-3 md:px-20">
      <div className="sticky top-0 z-[9] bg-[#665030] p-[13px] mb-4 flex justify-between items-center">
        <h6 className="text-white font-bold whitespace-nowrap min-w-[30%] flex-1 m-0 text-base">
          {t('platform.title', 'Platform List')}
        </h6>
        <div className="flex items-center pl-2 justify-end">
          {!isMobile && (
            <h6 className="text-white font-bold mr-3 m-0 text-base">
              {t('platform.listMode', 'List Mode')}
            </h6>
          )}
          <ul className="flex m-0 pl-0">
            <li
              onClick={() => setIsGridView(false)}
              role="presentation"
            >
              <VerticleListIcon className={toggleClass(!isGridView)} />
            </li>
            <li
              onClick={() => setIsGridView(true)}
              role="presentation"
              className="pl-2"
            >
              <HorizontleListIcon className={toggleClass(isGridView)} />
            </li>
          </ul>
          <div className="relative pl-2 max-w-[268px] max-[575px]:max-w-[55%]">
            <input
              type="text"
              className="w-full max-w-full border-0 rounded-[25px] py-[10px] px-[14px] pr-[38px] bg-white text-base focus:outline-none max-md:text-white max-md:bg-[rgb(85_61_17)]"
              placeholder={t('platform.searchPlaceholder', 'Search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {isMobile && (
              <SearchIcon className="absolute top-1/2 right-3 -translate-y-1/2 text-white! [&_svg]:h-5 [&_svg]:w-5 [&_svg]:[stroke-width:2px] [&_svg]:stroke-current" />
            )}
          </div>
        </div>
      </div>

      {visibleProviders.length === 0 ? (
        <p className="text-center text-white opacity-60 mt-8">
          {t('noData.default', 'No data found')}
        </p>
      ) : !isGridView ? (
        <div className="flex flex-wrap pb-4">
          {visibleProviders.map((game, idx) => (
            <div key={`${game.provider}-${idx}`} className="w-full md:w-1/3 xl:w-1/4">
              <div
                className="mb-3 mx-2 cursor-pointer bg-[url('/img/platform/bg-platform.jpg')] bg-cover"
                onClick={() => handleProviderClick(game)}
                role="presentation"
              >
                <div className="flex p-2 justify-between">
                  <div className="flex items-center">
                    <div className="rounded-full p-1 bg-[linear-gradient(to_right_top,#654302,#f7c972,#644202,#f7c972,#694809,#f7c972,#6f4d0c)]">
                      <img
                        src={game.image}
                        alt={game.label}
                        className="rounded-full h-[68px] w-[68px] object-contain bg-[radial-gradient(circle,#262626_0%,#0a0a0a_100%)]"
                      />
                    </div>
                    <h6 className="font-bold pl-2 mb-0 text-[1rem]">
                      {game.label}
                    </h6>
                  </div>
                  <div className="flex flex-col justify-between items-end">
                    <div className="inline-flex items-center">
                      {(() => {
                        const ProviderIcon = iconMap[providerIcon(game.provider)]
                        return ProviderIcon ? (
                          <ProviderIcon className="ml-1 text-white! [&_svg]:h-5 [&_svg]:w-5 inline-flex" />
                        ) : null
                      })()}
                    </div>
                    <div className="cursor-pointer">
                      <img
                        src={
                          game.games?.length > 1
                            ? '/img/platform/btn-more.png'
                            : '/img/platform/btn-playnow.webp'
                        }
                        alt="btn-image"
                        className="h-[30px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap -mx-[6px] pb-4">
          {visibleProviders.map((game, idx) => (
            <div
              key={`${game.provider}-${idx}`}
              className="w-1/2 xl:w-1/6 px-[6px] mb-3"
            >
              <div
                className="cursor-pointer border-2 border-[#1c1813] rounded-md shadow-md"
                onClick={() => handleProviderClick(game)}
                role="presentation"
              >
                <div className="relative bg-[url('/img/platform/bg-platform.jpg')] bg-no-repeat bg-cover">
                  <img
                    src={providerGridCover(game.provider)}
                    alt={game.label}
                    className="w-full h-[146px] object-cover object-top"
                  />
                  <div className="absolute left-0 right-0 bottom-0 h-6 px-1 flex items-center justify-between bg-black/60">
                    <div className="inline-flex items-center">
                      {(() => {
                        const ProviderIcon = iconMap[providerIcon(game.provider)]
                        return ProviderIcon ? (
                          <ProviderIcon className="inline-flex mx-1 text-white [&_svg]:h-4 [&_svg]:w-4" />
                        ) : null
                      })()}
                    </div>
                    <img
                      src={
                        game.games?.length > 1
                          ? '/img/platform/btn-more.png'
                          : '/img/platform/btn-playnow.webp'
                      }
                      alt="btn-image"
                      className="absolute h-[6.3vw] md:h-[30px] w-auto -top-[3vw] md:-top-[13px] right-1"
                    />
                  </div>
                </div>
                <div className="my-2 text-center text-white text-[14px]">
                  {game.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
