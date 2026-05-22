import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { http } from '../core/http/client.js'
import { getSportSlug } from '../core/constant/constants.js'
import SvgIcon from './SvgIcon.jsx'

const SEARCH_DEBOUNCE_MS = 250

function formatEventTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

// SVGs ported verbatim from the live mobile `search-event` component.
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

  // Debounced search against /sport/search.
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
    [navigate, close]
  )

  const showEmpty =
    open &&
    trimmedQuery.length > 0 &&
    !isSearching &&
    effectiveResults.length === 0

  const placeholder = t('header.searchEvents', 'Search Events')

  return (
    <div className="relative">
      {/* `.search-out` ─ collapsed icon button */}
      <span
        className={
          'w-[12.8vw] flex items-center h-[12.45vw] justify-center text-white ' +
          'bg-gradient-to-b from-[#525252] to-[#2d2d2d] ' +
          '[&_i_svg]:w-[5.87vw] [&_i_svg]:h-full'
        }
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()}
        aria-label="Open search"
      >
        <SvgIcon name="searchIcon" />
      </span>

      {/* `.search-events` ─ fullscreen overlay */}
      <div
        className={
          'fixed inset-0 z-[99999] transition-all duration-700 ease-in-out ' +
          (open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none')
        }
      >
        {/* `.search-events-inner` ─ search bar row */}
        <div className="flex bg-white items-center">
          {/* `.left-arrow` ─ back button */}
          <i
            className={
              'inline-flex items-center justify-center ' +
              '[&_svg]:scale-80 max-mobile:[&_svg]:scale-100 ' +
              'max-mobile:[&_svg]:w-[10.67vw] max-mobile:[&_svg]:h-[10.07vw]'
            }
            onClick={close}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && close()}
            aria-label="Close search"
          >
            {LeftArrowSvg}
          </i>

          {/* `.ng-select-container` ─ input + clear */}
          <div className="flex flex-1 items-center rounded-none border-0">
            {/* `.ng-value-container` */}
            <div className="flex items-center h-full flex-1">
              {/* `.ng-input` */}
              <div className="h-full">
                <input
                  aria-autocomplete="list"
                  role="combobox"
                  type="text"
                  placeholder={placeholder}
                  autoCorrect="off"
                  autoCapitalize="off"
                  autoComplete="off"
                  aria-expanded={open}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus={open}
                  // SCSS reset on mobile: `padding-left: 0; height: 100%;`
                  className={
                    'h-[46px] max-mobile:h-full max-mobile:pl-0 w-full outline-none border-0 ' +
                    'font-normal placeholder:text-[#9b9b9b] placeholder:font-normal placeholder:ml-0'
                  }
                />
              </div>
            </div>
            {query && (
              <span
                className={
                  'w-[22px] flex items-center font-thin max-mobile:w-[6.07vw]'
                }
                role="button"
                tabIndex={0}
                onClick={() => setQuery('')}
                onKeyDown={(e) =>
                  (e.key === 'Enter' || e.key === ' ') && setQuery('')
                }
                aria-label="Clear search"
              >
                <span
                  className={
                    'text-[26px] leading-[20px] text-[var(--lg-black)] ' +
                    'max-mobile:text-[var(--xxl-black)] max-mobile:text-[7vw] max-mobile:leading-normal'
                  }
                >
                  ×
                </span>
              </span>
            )}
            {/* `.ng-arrow-wrapper` ─ hidden in original */}
            <span className="hidden">
              <span />
            </span>
          </div>

          {/* `.search-icon` */}
          <i
            className={
              'p-2.5 leading-[45px] ' +
              '[&_svg]:w-[5.67vw] [&_svg]:h-[5.07vw] ' +
              '[&_svg_path]:fill-[var(--lg-black)] max-mobile:[&_svg_path]:fill-[var(--xxl-black)]'
            }
          >
            {SearchSvg}
          </i>
        </div>

        {(effectiveResults.length > 0 || isSearching || showEmpty) && (
          // `.ng-select` ─ dropdown results panel
          <div
            className={
              'bg-white flex items-center w-full overflow-y-auto max-mobile:h-[16vw]'
            }
          >
            {/* `.ng-dropdown-panel` */}
            <div
              className={
                'max-mobile:fixed max-mobile:left-0 max-mobile:right-0 ' +
                'max-mobile:top-[16vw] max-mobile:border-t max-mobile:border-[var(--xxl-gray)]'
              }
            >
              {/* `.ng-dropdown-panel-items` */}
              <div className="max-mobile:max-h-[46.67vw]">
                {isSearching && effectiveResults.length === 0 && (
                  <div
                    className={
                      'px-1 bg-white text-[var(--text-color)] text-[14px] ' +
                      'max-mobile:px-[2vw] max-mobile:text-[4vw] max-mobile:text-[var(--blue)]'
                    }
                  >
                    {t('common.loading', 'Searching…')}
                  </div>
                )}
                {effectiveResults.map((item) => (
                  <div
                    type="button"
                    key={`${item.sportId}-${item.eventId}`}
                    className={
                      'px-1 bg-white text-[var(--text-color)] text-[14px] cursor-pointer ' +
                      'max-mobile:px-[2vw] max-mobile:text-[4vw] max-mobile:text-[var(--blue)] ' +
                      'max-mobile:[&_.item]:overflow-hidden max-mobile:[&_.item]:text-ellipsis ' +
                      'max-mobile:[&_.item]:leading-[11.68vw] ' +
                      'max-mobile:[&_.time]:mr-[1.87vw] max-mobile:[&_.time]:font-normal ' +
                      'max-mobile:[&_.time]:text-[var(--lg-black)]'
                    }
                    onClick={() => onResultClick(item)}
                  >
                    <div title={item.eventName} className="item">
                      <span className="time">
                        {formatEventTime(item.openDate)}
                      </span>
                      <span>{item.eventName?.trim()}</span>
                    </div>
                  </div>
                ))}
                {showEmpty && (
                  <div
                    className={
                      'px-1 bg-white text-[var(--text-color)] text-[14px] ' +
                      'max-mobile:px-[2vw] max-mobile:text-[4vw] max-mobile:text-[var(--blue)]'
                    }
                  >
                    {t('common.noEventsFound', 'No events found')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* `.search-overlay` ─ dim backdrop */}
        <div
          className="fixed top-0 left-0 w-screen h-full bg-black/70 -z-[1]"
          onClick={close}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
