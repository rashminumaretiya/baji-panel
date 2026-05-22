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
          <div className="bg-white border border-[var(--sm-text-color)] rounded-[1.6vw] text-[var(--sm-text-color)] text-[4.26667vw] my-[5.33333vw] mx-[2.66667vw] pt-[2.66667vw] pb-[5.33333vw] px-[1.86667vw] text-center">
            <div className="border-b border-[var(--light-bg)] mb-[1.33333vw] py-[1.86667vw] flex items-center justify-center">
              <i className="[&_svg]:w-[5.8vw] [&_svg]:h-[6vw]">
                <SvgIcon name="iconNoData" />
              </i>
              <h3 className="font-bold text-[5.33333vw] text-[var(--sm-text-color)] leading-[2.2] mb-0">
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
        <h6 className="text-[13px] leading-[20px] pt-[6px] mb-[6px] font-bold">
          {t('multiMarkets.heading')}
        </h6>
        <p className="mb-[7px] leading-[15px] text-[12px]">
          {t('multiMarkets.noFollowed')}
        </p>
      </div>
    </div>
  )
}
