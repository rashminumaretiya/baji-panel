import SvgIcon from './SvgIcon.jsx'
import './eventSearch.scss'

/** Desktop event search — DOM mirrors Angular ng-select markup */
export default function EventSearch({ isYellowTheme = false }) {
  return (
    <div
      className={`search-wrapper me-2${isYellowTheme ? ' isYellowTheme' : ''}`}
    >
      <SvgIcon name="searchIcon" />
      <div className="search-events">
        <div className="ng-input">
          <input
            type="text"
            role="combobox"
            aria-autocomplete="list"
            placeholder="Search Events"
          />
        </div>
        <span className="ng-arrow" />
      </div>
    </div>
  )
}
