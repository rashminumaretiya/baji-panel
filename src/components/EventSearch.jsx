import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getSportSlug } from '../core/constant/constants.js'
import { http } from '../core/http/client.js'
import { SearchIcon } from './icons.jsx'

const DEBOUNCE_MS = 300

function pad(n) {
  return String(n).padStart(2, '0')
}
function formatDate(input) {
  if (!input) return ''
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function mapResults(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map((row) => {
    const isRacing = !!row?.marketId
    const dateStr = formatDate(isRacing ? row?.marketStartTime : row?.openDate)
    const name = row?.eventName ?? row?.name ?? ''
    const label = isRacing
      ? `${dateStr} ${name} -> ${row?.marketName ?? ''}`
      : `${dateStr} ${name}`
    return {
      key: `${row?.eventId}-${row?.marketId ?? 'evt'}`,
      label,
      sportId: row?.sportId,
      eventId: row?.eventId,
      marketId: row?.marketId,
      isRacing,
    }
  })
}

export default function EventSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  // Debounced fetch — mirrors Archive's `debounceTime + distinctUntilChanged + switchMap`.
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) return undefined
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await http.get('sport/search', {
          params: { searchText: trimmed },
          signal: controller.signal,
        })
        const rows = res?.data?.data ?? res?.data ?? []
        setResults(mapResults(rows))
      } catch {
        /* keep the previous results visible on error — don't clear */
      }
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  // Close on outside click.
  useEffect(() => {
    if (!open) return undefined
    const onDocClick = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const onSelect = (item) => {
    if (!item?.eventId || !item?.sportId) return
    const slug = getSportSlug(item.sportId)
    if (item.isRacing && item.marketId) {
      navigate(`/racing-odds/${item.eventId}/${item.marketId}/${slug}`)
    } else {
      navigate(`/odds/${item.eventId}/${slug}`)
    }
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const showDropdown = open && query.trim().length > 0
  const emptyText = useMemo(
    () => t('header.noEventsFound', 'No events found'),
    [t]
  )

  return (
    <div
      ref={wrapperRef}
      className="relative mr-2 w-full max-w-[280px] min-w-[150px] flex-[0_0_auto]"
    >
      <i className="absolute top-1/2 left-[5px] z-1002 flex -translate-y-1/2 [&_svg]:h-[14px] [&_svg]:w-[14px] [&_svg]:text-(--dark-grey)">
        <SearchIcon />
      </i>
      <div className={`flex w-full items-center border border-transparent bg-white ${query ? 'rounded-t' : 'rounded'}`}>
        <input
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          placeholder={t('header.searchEvents', 'Search Events')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className={`h-[25px] w-full min-w-[150px] flex-1 border-0 bg-white pr-1 pl-[25px] text-[12px] placeholder:text-(--xxl-gray) focus:outline-none ${query ? 'rounded-t' : 'rounded'}`}
        />
        {/* Clear (X) button — mirrors NBC's ng-select `.ng-clear-wrapper`. */}
        {query && (
          <span
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
            className="mr-1 flex h-[18px] w-[18px] cursor-pointer items-center justify-center text-[16px] leading-none bg-[#edeced] hover:text-(--dark,#1e1e1e)"
          >
            ×
          </span>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-1003 max-h-[320px] overflow-y-auto rounded-b bg-white shadow-lg">
          {results.length === 0 ? (
            <div className="px-2 py-2 text-[12px] text-(--dark-gray,#6b7c87)">
              {emptyText}
            </div>
          ) : (
            results.map((item) => (
              <div
                key={item.key}
                role="option"
                aria-selected="false"
                tabIndex={0}
                onClick={() => onSelect(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(item)
                  }
                }}
                className="cursor-pointer truncate px-2 leading-[32px] text-[12px] text-[#1e1e1e] hover:bg-(--xxs-gray,#eef2f4) hover:underline"
                title={item.label}
              >
                {item.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
