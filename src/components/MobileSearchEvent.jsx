import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { http } from '../core/http/client.js'
import { getSportSlug } from '../core/constant/constants.js'
import SvgIcon from './SvgIcon.jsx'
import './mobileSearchEvent.scss'

const SEARCH_DEBOUNCE_MS = 250

function formatEventTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

// SVGs ported verbatim from the live mobile `search-event` component so the
// existing SCSS selectors that target the icon paths/wrappers still match.
const LeftArrowSvg = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="40"
    viewBox="0 0 40 40"
    width="40"
    aria-hidden="true"
  >
    <g fill="none" fillRule="evenodd">
      <path d="m0 0h40v40h-40z" />
      <path
        d="m16.9093851 12 8.0906149 8-8.0906149 8-1.9093851-1.888 6.2135922-6.112-6.2135922-6.112z"
        fill="rgb(74,74,74)"
        transform="matrix(-1 0 0 1 40 0)"
      />
    </g>
  </svg>
)

const SearchSvg = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="22"
    viewBox="0 0 22 22"
    width="22"
    aria-hidden="true"
  >
    <path
      d="m29.6697865 25.8286042h-1.0026615l-.3764635-.3143021c1.191151-1.4455833 1.9434479-3.2687188 1.9434479-5.342849-.0000573-4.5258698-3.6359011-8.1714531-8.14825-8.1714531-4.4505886 0-8.0858594 3.6455833-8.0858594 8.1714531s3.6352708 8.1713959 8.1483073 8.1713959c2.0058385 0 3.886151-.7543594 5.3276094-1.948375l.3758906.3143593v1.0055261l6.2678802 6.2856406 1.8803125-1.8856979zm-7.5214792 0c-3.1339688 0-5.6411094-2.5143594-5.6411094-5.6571511 0-3.1429062 2.5071406-5.6570937 5.6411094-5.6570937 3.1338542 0 5.6410521 2.5141875 5.6410521 5.6570937 0 3.1427917-2.5071979 5.6571511-5.6410521 5.6571511z"
      fill="currentColor"
      transform="translate(-14 -12)"
    />
  </svg>
)

// Collapsed search trigger for mobile views. Tap the icon to open a fullscreen
// overlay with the search input; tap the dim background or back arrow to close.
// Markup mirrors the live `search-event` component (including the ng-select
// inner DOM) so the SCSS hooks (.ng-select-container, .ng-value-container,
// .ng-placeholder, .ng-input, .ng-arrow-wrapper, .search-overlay) all match.
export default function MobileSearchEvent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults([])
  }, [])
  const toggle = useCallback(() => setOpen((v) => !v), [])

  // Body scroll-lock while the overlay is open + Escape to close.
  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  // Debounced search against /sport/search. Cancels in-flight requests when
  // the user keeps typing so we never paint stale results on top of fresh ones.
  // An empty / whitespace query short-circuits with no setState — that's
  // handled by the derived `effectiveResults` below to keep this effect from
  // doing a sync setState (which the React 19 lint flags as cascading).
  useEffect(() => {
    const text = query.trim()
    if (!text) return undefined
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setLoading(true)
      http
        .get('sport/search', {
          params: { searchText: text },
          signal: controller.signal,
        })
        .then((res) => {
          setResults(Array.isArray(res?.data?.data) ? res.data.data : [])
        })
        .catch((err) => {
          if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
            return
          }
          setResults([])
        })
        .finally(() => {
          setLoading(false)
        })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  // Derived results — when the query is empty there's nothing to show no
  // matter what's still in `results`. Avoids a syncing-setState in the effect.
  const trimmedQuery = query.trim()
  const effectiveResults = trimmedQuery ? results : []
  const isSearching = !!trimmedQuery && loading

  const onResultClick = useCallback(
    (item) => {
      if (!item?.eventId) return
      const slug =
        getSportSlug(item.sportId) ||
        (item.sportName ? String(item.sportName).toLowerCase() : '')
      navigate(`/odds/${item.eventId}/${slug}`)
      close()
    },
    [navigate, close],
  )

  const showEmpty =
    open && trimmedQuery.length > 0 && !isSearching && effectiveResults.length === 0

  const placeholder = t('header.searchEvents', 'Search Events')
  const selectClass = [
    'ng-select-typeahead',
    'ng-select-searchable',
    query && 'ng-select-clearable',
    'ng-select',
    'ng-select-single',
    open && 'ng-select-focused',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="search-collapse">
      <span
        className="search-out"
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()}
        aria-label="Open search"
      >
        <SvgIcon name="searchIcon" />
      </span>

      <div className={`search-events${open ? ' open' : ''}`}>
        <div className="search-events-inner">
          <i
            className="left-arrow"
            onClick={close}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && close()}
            aria-label="Close search"
          >
            {LeftArrowSvg}
          </i>

          <div className={selectClass}>
            <div className="ng-select-container">
              <div className="ng-value-container">
                {!query && (
                  <div className="ng-placeholder">{placeholder}</div>
                )}
                <div className="ng-input">
                  <input
                    aria-autocomplete="list"
                    role="combobox"
                    type="text"
                    autoCorrect="off"
                    autoCapitalize="off"
                    autoComplete="off"
                    aria-expanded={open}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus={open}
                  />
                </div>
              </div>
              {query && (
                <span
                  className="ng-clear-wrapper"
                  role="button"
                  tabIndex={0}
                  onClick={() => setQuery('')}
                  onKeyDown={(e) =>
                    (e.key === 'Enter' || e.key === ' ') && setQuery('')
                  }
                  aria-label="Clear search"
                >
                  <span className="ng-clear">×</span>
                </span>
              )}
              <span className="ng-arrow-wrapper">
                <span className="ng-arrow" />
              </span>
            </div>
          </div>

          <i className="search-icon">{SearchSvg}</i>
        </div>

        {(effectiveResults.length > 0 || isSearching || showEmpty) && (
          <div className="ng-dropdown-panel">
            <div className="ng-dropdown-panel-items">
              {isSearching && effectiveResults.length === 0 && (
                <div className="ng-option ng-option-loading">
                  {t('common.loading', 'Searching…')}
                </div>
              )}
              {effectiveResults.map((item) => (
                <button
                  type="button"
                  key={`${item.sportId}-${item.eventId}`}
                  className="ng-option"
                  onClick={() => onResultClick(item)}
                >
                  <div title={item.eventName} className="item">
                    <span className="time">{formatEventTime(item.openDate)}</span>
                    <span> {item.sportName}</span>
                    <span className="event-name"> {item.eventName?.trim()}</span>
                  </div>
                </button>
              ))}
              {showEmpty && (
                <div className="ng-option ng-option-empty">
                  {t('common.noEventsFound', 'No events found')}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="search-overlay" onClick={close} aria-hidden="true" />
      </div>
    </div>
  )
}
