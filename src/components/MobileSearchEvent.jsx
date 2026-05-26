import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { http } from '../core/http/client.js'
import { getSportSlug } from '../core/constant/constants.js'
import { SearchIcon } from './icons.jsx'

const SEARCH_DEBOUNCE_MS = 300

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

const SearchInlineSvg = (
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

export default function MobileSearchEvent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const inputRef = useRef(null)

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults([])
  }, [])
  const toggle = useCallback(() => setOpen((v) => !v), [])

  // Body scroll-lock + Esc to close.
  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      clearTimeout(focusTimer)
    }
  }, [open, close])

  // Debounced search against /sport/search.
  useEffect(() => {
    const text = query.trim()
    if (!text) return undefined
    const controller = new AbortController()
    const timer = setTimeout(() => {
      http
        .get('sport/search', {
          params: { searchText: text },
          signal: controller.signal,
        })
        .then((res) => {
          if (controller.signal?.aborted) return
          const data = res?.data?.data ?? res?.data ?? []
          setResults(Array.isArray(data) ? data : [])
        })
        .catch((err) => {
           if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
            return
          }
        })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const trimmed = query.trim()
  const showPanel = open && trimmed.length > 0
  const showResults = results.length > 0

  const onResultClick = useCallback(
    (item) => {
      if (!item?.eventId) return
      const slug =
        getSportSlug(item.sportId) ||
        (item.sportName ? String(item.sportName).toLowerCase() : '')
      if (item.marketId) {
        navigate(`/racing-odds/${item.eventId}/${item.marketId}/${slug}`)
      } else {
        navigate(`/odds/${item.eventId}/${slug}`)
      }
      close()
    },
    [navigate, close]
  )

  return (
    <div className="relative">
      {/* `.search-out` ─ collapsed icon trigger (12.8vw × 12.45vw, dark gradient). */}
      <span
        className="flex items-center justify-center cursor-pointer text-white w-[12.8vw] h-[12.45vw] bg-[linear-gradient(180deg,#525252_0%,#2d2d2d_100%)] [&_i_svg]:w-[5.87vw] [&_i_svg]:h-full"
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()}
        aria-label="Open search"
      >
        <SearchIcon />
      </span>

      {/* `.search-events` ─ fullscreen overlay; opacity 0→1, transition 0.7s. */}
      <div
        className={
          'fixed inset-0 z-99999 transition-all duration-700 ease-in-out ' +
          (open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none')
        }
      >
        {/* `.search-events-inner` ─ 16vw-tall white top bar. */}
        <div className="flex items-center bg-white h-[16vw] relative z-1">
          {/* `.left-arrow` */}
          <i
            className="inline-flex items-center justify-center cursor-pointer flex-none [&_svg]:w-[10.67vw] [&_svg]:h-[10.07vw]"
            onClick={close}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && close()}
            aria-label="Close search"
          >
            {LeftArrowSvg}
          </i>

          {/* `.ng-select-container` ─ the input row (12vw tall, no border/radius). */}
          <div className="flex flex-1 items-center h-[12vw] rounded-none border-0">
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showPanel}
              aria-label="Search events"
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="off"
              placeholder={t('header.searchEvents', 'Search Events')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-[7vw] border-0 outline-none bg-transparent text-(--text-color) placeholder:text-[#9b9b9b] placeholder:font-normal placeholder:ml-0 font-normal"
            />
            {/* `.ng-clear-wrapper` ─ 6.07vw wide × button. */}
            {query && (
              <span
                className="flex items-center justify-center cursor-pointer flex-none w-[6.07vw] font-thin"
                role="button"
                tabIndex={0}
                aria-label="Clear search"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setQuery('')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setQuery('')
                  }
                }}
              >
                <span className="text-[7vw] leading-normal text-(--xxl-black)">
                  ×
                </span>
              </span>
            )}
          </div>

          {/* `.search-icon` (right) ─ decorative magnifier inside the bar. */}
          <i className="p-2.5 leading-[45px] flex-none [&_svg]:w-[5.67vw] [&_svg]:h-[5.07vw] [&_svg_path]:fill-(--xxl-black)">
            {SearchInlineSvg}
          </i>
        </div>

        {/* `.ng-dropdown-panel` ─ fixed below the 16vw-tall bar. */}
        {showPanel && (
          <div className="fixed left-0 right-0 top-[16vw] bg-white border-t border-(--xxl-gray)">
            <div className="overflow-y-auto max-h-[46.67vw]">
              {showResults ? (
                results.map((item) => (
                  <div
                    key={`${item.sportId}-${item.eventId}-${item.marketId ?? 'evt'}`}
                    className="cursor-pointer bg-white px-[2vw] text-[4vw] text-(--blue) [&_.item]:overflow-hidden [&_.item]:text-ellipsis [&_.item]:leading-[11.68vw] [&_.item]:whitespace-nowrap [&_.time]:mr-[1.87vw] [&_.time]:font-normal [&_.time]:text-(--lg-black) hover:bg-(--xxs-gray)"
                    role="option"
                    aria-selected="false"
                    tabIndex={0}
                    onClick={() => onResultClick(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onResultClick(item)
                      }
                    }}
                  >
                    <div className="item" title={item.eventName}>
                      <span className="time">
                        {formatEventTime(
                          item.marketStartTime ?? item.openDate
                        )}
                      </span>
                      <span>
                        {item.marketName
                          ? `${item.eventName} -> ${item.marketName}`
                          : item.eventName?.trim()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-[2vw] text-[4vw] text-(--blue) leading-[11.68vw] bg-white">
                  {t('header.noEventsFound', 'No events found')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* `.search-overlay` ─ dim backdrop. Sits *behind* the bar (-z-[1])
            but inside `.search-events`, so clicks on the dim area dismiss
            the modal. */}
        <div
          className="fixed top-0 left-0 w-screen h-full bg-black/70 z-[-1]"
          onClick={close}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
