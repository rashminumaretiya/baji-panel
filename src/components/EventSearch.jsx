import SvgIcon from './SvgIcon.jsx'

/** Desktop event search — DOM mirrors Angular ng-select markup */
export default function EventSearch() {
  return (
    <div className="relative max-w-[280px] w-full min-w-[150px] flex-[0_0_auto] mr-2 max-[1440px]:flex-[0_0_50%] [&_i]:flex [&_i]:absolute [&_i]:top-1/2 [&_i]:-translate-y-1/2 [&_i]:left-[5px] [&_i]:z-[1002] [&_i_svg]:h-[14px] [&_i_svg]:w-[14px] [&_i_svg]:text-[var(--dark-grey)]">
      <SvgIcon name="searchIcon" />
      <div className="w-full border border-transparent">
        <div>
          <input
            type="text"
            role="combobox"
            aria-autocomplete="list"
            placeholder="Search Events"
            className="bg-white h-[25px] text-[12px] rounded min-w-[280px] border-0 pl-[26px] focus:outline-none placeholder:text-[var(--xxl-gray)] max-[768px]:min-w-[150px]"
          />
        </div>
        <span />
      </div>
    </div>
  )
}
