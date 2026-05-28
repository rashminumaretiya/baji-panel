import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import {
  fetchDomainConfiguration,
  selectCurrentSiteName,
  selectFavicon,
  setCurrentSiteName,
} from '../store/slices/commonSlice.js'
import { fetchCasinoInfo } from '../store/slices/casinoSlice.js'

const FAVICON_MIME_BY_EXT = {
  ico: 'image/x-icon',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
}

function inferFaviconType(href) {
  const match = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(href || '')
  const ext = match ? match[1].toLowerCase() : ''
  return FAVICON_MIME_BY_EXT[ext] || 'image/x-icon'
}

function applyFavicon(href) {
  if (typeof document === 'undefined' || !href) return
  let link = document.querySelector('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  const nextType = inferFaviconType(href)
  if (link.type !== nextType) link.type = nextType
  if (link.href !== href) link.href = href
}

function applyTitle(text) {
  if (typeof document === 'undefined' || !text) return
  if (document.title !== text) document.title = text
}

function getSecondLevelDomain() {
  if (typeof window === 'undefined') return ''
  const hostname = window.location?.hostname ?? ''
  const parts = hostname.split('.').filter(Boolean)
  if (parts.length >= 2) {
    return parts.length === 2 ? parts[0] : parts[parts.length - 2]
  }
  return hostname
}

function titleCase(text) {
  if (!text) return ''
  return text
    .toLowerCase()
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}

// Map known pathnames to i18n keys under `app.titles.*`. For dynamic segments
// (e.g. /odds/:eventId/:sport) we fall back to prefix matching.
const ROUTE_TITLE_KEYS = {
  '/': 'home',
  '/cricket': 'cricket',
  '/soccer': 'soccer',
  '/tennis': 'tennis',
  '/horse-racing': 'horseRacing',
  '/greyhound-racing': 'greyhoundRacing',
  '/multi-markets': 'multiMarkets',
  '/account': 'account',
  '/in-play': 'inPlay',
  '/result': 'result',
  '/platform': 'platform',
  '/my-account': 'profile',
  '/my-account/my-profile': 'profile',
  '/my-account/balance-overview': 'balanceOverview',
  '/my-account/account-statement': 'accountStatement',
  '/my-account/my-bets': 'myBets',
  '/my-account/bets-complaints': 'betsComplaints',
  '/my-account/activity-log': 'activityLog',
  '/my-account/deposit': 'deposit',
  '/my-account/deposit-history': 'depositHistory',
  '/my-account/withdraw': 'withdraw',
  '/my-account/withdraw-history': 'withdrawHistory',
}

function getRouteTitleKey(pathname) {
  if (!pathname) return null
  const normalized =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname
  if (ROUTE_TITLE_KEYS[normalized]) return ROUTE_TITLE_KEYS[normalized]
  if (normalized.startsWith('/odds/')) return 'liveOdds'
  if (normalized.startsWith('/racing-odds/')) return 'racingOdds'
  if (normalized.startsWith('/platform/')) return 'platform'
  return null
}

export function useDomainConfiguration() {
  const { t, i18n } = useTranslation()
  const dispatch = useDispatch()
  const location = useLocation()
  const favicon = useSelector(selectFavicon)
  const currentSiteName = useSelector(selectCurrentSiteName)
  const language = i18n.language

  useEffect(() => {
    dispatch(fetchDomainConfiguration())
    dispatch(fetchCasinoInfo())
    const siteName = titleCase(getSecondLevelDomain())
    if (siteName) dispatch(setCurrentSiteName(siteName))
  }, [dispatch])

  useEffect(() => {
    applyFavicon(favicon)
  }, [favicon])

  useEffect(() => {
    if (!currentSiteName) return
    const siteSuffix = t('app.titleSuffix', { siteName: currentSiteName })
    const pageKey = getRouteTitleKey(location.pathname)
    if (pageKey) {
      const pageName = t(`app.titles.${pageKey}`, { defaultValue: '' })
      applyTitle(pageName ? `${pageName} | ${siteSuffix}` : siteSuffix)
    } else {
      applyTitle(siteSuffix)
    }
  }, [currentSiteName, location.pathname, language, t])
}
