import { SPORT_IDS } from '../core/constant/constants.js'
import SportPage from './SportPage.jsx'

export default function GreyhoundRacing() {
  return (
    <SportPage
      sportId={SPORT_IDS.GREYHOUND_RACING}
      bannerSrc="/img/greyhound_landing.webp"
      isRacing
    />
  )
}
