import { useTranslation } from 'react-i18next'

const LANDING_IMG_CLASS = 'h-[194px] w-full object-cover mt-px mb-4'

const GAME_TITLE_CLASS =
  'flex items-center justify-between bg-gradient-to-b from-[var(--xl-blue)] to-[var(--xxl-blue)] text-white text-[12px] font-bold p-2 mb-2 max-md:text-center max-md:font-semibold max-md:text-[3.73vw] max-md:leading-[1.05] max-md:p-[2.043vw]'

export default function RacingBanner({ src, sportName }) {
  const { t } = useTranslation()
  return (
    <>
      <img
        className={LANDING_IMG_CLASS}
        src={src}
        alt={`${sportName ?? 'Sport'} Landing Image`}
        width="1200"
        height="194"
        decoding="async"
      />
      <div className="mx-0 mt-2">
        <div className={GAME_TITLE_CLASS}>{t('titles.highLights')}</div>
      </div>
    </>
  )
}
