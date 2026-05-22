import { SPORT_IDS } from '../core/constant/constants.js'
import SportPage from './SportPage.jsx'

export default function Tennis() {
  return (
    <SportPage sportId={SPORT_IDS.TENNIS} bannerSrc="/img/tennis-img.jpg" />
  )
}
