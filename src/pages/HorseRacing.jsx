import { SPORT_IDS } from '../core/constant/constants.js'
import SportPage from './SportPage.jsx'

export default function HorseRacing() {
  return (
    <SportPage
      sportId={SPORT_IDS.HORSE_RACING}
      bannerSrc="/img/horse_racing_landing.webp"
      isRacing
    />
  )
}
