import { SPORT_IDS } from '../core/constant/constants.js'
import SportPage from './SportPage.jsx'

export default function Soccer() {
  return <SportPage sportId={SPORT_IDS.SOCCER} bannerSrc="/img/soccer-img.jpg" />
}
