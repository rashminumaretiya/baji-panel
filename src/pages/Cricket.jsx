import { SPORT_IDS } from '../core/constant/constants.js'
import SportPage from './SportPage.jsx'

export default function Cricket() {
  return (
    <SportPage sportId={SPORT_IDS.CRICKET} bannerSrc="/img/cricket-img.webp" />
  )
}
