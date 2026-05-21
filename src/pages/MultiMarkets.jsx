import { useIsMobile } from '../hooks/useMediaQuery.js'
import SvgIcon from '../components/SvgIcon.jsx'
import './multi-markets.scss'

export default function MultiMarkets() {
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
              <h3>There are currently no followed multi markets.</h3>
            </div>
            <p>Please add some markets from events.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="multi-markets-page">
      <div className="multi-markets-wrapper">
        <h6 className="heading">Multi Markets</h6>
        <p className="description">There are currently no followed multi markets.</p>
      </div>
    </div>
  )
}
