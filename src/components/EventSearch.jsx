import SvgIcon from './SvgIcon.jsx'

/** Desktop event search — DOM mirrors Angular ng-select markup */
export default function EventSearch() {
  return (
    <div className="relative max-w-[280px] w-full min-w-[150px] flex-[0_0_auto] mr-2 max-[1440px]:flex-[0_0_50%] [&_i]:flex [&_i]:absolute [&_i]:top-1/2 [&_i]:-translate-y-1/2 [&_i]:left-[5px] [&_i]:z-[1002] [&_i_svg]:h-[14px] [&_i_svg]:w-[14px] [&_i_svg]:text-[var(--dark-grey)]">
      <SvgIcon name="searchIcon" />
      {/* `.search-events` focus-within state — mirrors the original
          `.search-events.ng-select-opened { box-shadow + border + radius }`. */}
      <div className="w-full border border-transparent rounded focus-within:border focus-within:border-[#2789ce] focus-within:shadow-[0_0_4px_2px_rgba(114,187,239,0.8)]">
        <div>
          {/* Input padding ported from `input { padding: 0 4px 0 25px }`. */}
          <input
            type="text"
            role="combobox"
            aria-autocomplete="list"
            placeholder="Search Events"
            className="bg-white h-[25px] text-[12px] rounded min-w-[280px] border-0 pl-[25px] pr-1 focus:outline-none placeholder:text-[var(--xxl-gray)] max-[768px]:min-w-[150px]"
          />
        </div>
        <span />
      </div>
    </div>
  )
}
