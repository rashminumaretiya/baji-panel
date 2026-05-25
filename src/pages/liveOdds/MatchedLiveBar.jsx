import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { cx, fmt } from './helpers.js'

const LIVE_BTN_BASE =
  'relative h-[23px] leading-[19px] rounded-[3px] text-white px-[7px] my-[3px] mx-[5px] text-[13px] ' +
  "before:content-[''] before:inline-block before:align-middle before:mr-[5px] before:h-[15px] before:w-[18px]"

const LIVE_ON =
  'bg-gradient-to-b from-(--md-cloud) to-(--lg-cloud) ' +
  'before:[background-image:url(/img/live-icons.png)] before:[background-position:-396px_-2453px]'

const LIVE_OFF =
  'bg-gradient-to-b from-(--mds-orange) to-(--lg-orange) ' +
  'before:[background-image:url(/img/close-live.png)] before:[background-position:center]'

export const MatchedLiveBar = memo(function MatchedLiveBar({
  currency,
  totalMatched,
  showLiveButton,
  isLiveStreamOn,
  onToggleLive,
}) {
  const { t } = useTranslation()
  return (
    <div className="flex">
      <div className="flex items-center text-[13px] [&_span]:font-bold">
        <p className="m-0">{t('common.matched', 'Matched')}</p>
        <span className="ml-1">{currency || 'PBU'}</span>
        <span className="mr-2 ml-1">{fmt(totalMatched)}</span>
      </div>
      {showLiveButton && (
        <button
          type="button"
          className={cx(LIVE_BTN_BASE, isLiveStreamOn ? LIVE_OFF : LIVE_ON)}
          onClick={onToggleLive}
        >
          {t('common.live', 'Live')}
        </button>
      )}
    </div>
  )
})
