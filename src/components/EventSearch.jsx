import { useTranslation } from 'react-i18next'
import SvgIcon from './SvgIcon.jsx'

/** Desktop event search — DOM mirrors Angular ng-select markup */
export default function EventSearch() {
  const { t } = useTranslation()
  return (
    <div className="relative mr-2 w-full max-w-[280px] min-w-[150px] flex-[0_0_auto] max-[1440px]:flex-[0_0_50%] [&_i]:absolute [&_i]:top-1/2 [&_i]:left-[5px] [&_i]:z-[1002] [&_i]:flex [&_i]:-translate-y-1/2 [&_i_svg]:h-[14px] [&_i_svg]:w-[14px] [&_i_svg]:text-(--dark-grey)">
      <SvgIcon name="searchIcon" />
      {/* `.search-events` focus-within state — mirrors the original
          `.search-events.ng-select-opened { box-shadow + border + radius }`. */}
      <div className="w-full rounded border border-transparent focus-within:border focus-within:border-[#2789ce] focus-within:shadow-[0_0_4px_2px_rgba(114,187,239,0.8)]">
        <div>
          {/* Input padding ported from `input { padding: 0 4px 0 25px }`. */}
          <input
            type="text"
            role="combobox"
            aria-autocomplete="list"
            placeholder={t('header.searchEvents', 'Search Events')}
            className="h-[25px] min-w-[280px] rounded border-0 bg-white pr-1 pl-[25px] text-[12px] placeholder:text-(--xxl-gray) focus:outline-none max-[768px]:min-w-[150px]"
          />
        </div>
        <span />
      </div>
    </div>
  )
}
