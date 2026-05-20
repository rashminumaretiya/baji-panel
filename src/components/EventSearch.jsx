import SvgIcon from './SvgIcon.jsx'
import './eventSearch.scss'

/** Desktop event search — DOM mirrors Angular ng-select markup */
export default function EventSearch() {
  return (
    <div className="search-wrapper me-2">
      <SvgIcon name="searchIcon" />
      <div className="search-events ng-select-typeahead ng-select-searchable ng-select-clearable ng-select ng-select-single">
        <div className="ng-select-container">
          <div className="ng-value-container">
            <div className="ng-input">
              <input
                type="text"
                role="combobox"
                aria-autocomplete="list"
                placeholder="Search Events"
              />
            </div>
          </div>
          <span className="ng-arrow-wrapper">
            <span className="ng-arrow" />
          </span>
        </div>
      </div>
    </div>
  )
}
