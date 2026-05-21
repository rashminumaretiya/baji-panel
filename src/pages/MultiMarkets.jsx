import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../hooks/useMediaQuery.js'
import SvgIcon from '../components/SvgIcon.jsx'
import './multi-markets.scss'

export default function MultiMarkets() {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div className="multi-markets-page">
        <div className="odds-wrapper">
          <div className="no-data">
            <div className="no-data-heading">
              <i className="no-data-icon">
                <SvgIcon name="iconNoData" />
              </i>
              <h3>{t('multiMarkets.noFollowed')}</h3>
            </div>
            <p>{t('multiMarkets.addMarkets')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="multi-markets-page">
      <div className="multi-markets-wrapper">
        <h6 className="heading">{t('multiMarkets.heading')}</h6>
        <p className="description">{t('multiMarkets.noFollowed')}</p>
      </div>
    </div>
  )
}
