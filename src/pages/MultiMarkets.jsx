import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../hooks/useMediaQuery.js'
import SvgIcon from '../components/SvgIcon.jsx'

export default function MultiMarkets() {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div>
        <div className="flex items-center justify-center">
          <div className="mx-[2.66667vw] my-[5.33333vw] rounded-[1.6vw] border border-(--sm-text-color) bg-white px-[1.86667vw] pt-[2.66667vw] pb-[5.33333vw] text-center text-[4.26667vw] text-(--sm-text-color)">
            <div className="mb-[1.33333vw] flex items-center justify-center border-b border-(--light-bg) py-[1.86667vw]">
              <i className="[&_svg]:h-[6vw] [&_svg]:w-[5.8vw]">
                <SvgIcon name="iconNoData" />
              </i>
              <h3 className="mb-0 text-[5.33333vw] leading-[2.2] font-bold text-(--sm-text-color)">
                {t('multiMarkets.noFollowed')}
              </h3>
            </div>
            <p className="mb-0">{t('multiMarkets.addMarkets')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="block">
        <h6 className="mb-[6px] pt-[6px] text-[13px] leading-[20px] font-bold">
          {t('multiMarkets.heading')}
        </h6>
        <p className="mb-[7px] text-[12px] leading-[15px]">
          {t('multiMarkets.noFollowed')}
        </p>
      </div>
    </div>
  )
}
