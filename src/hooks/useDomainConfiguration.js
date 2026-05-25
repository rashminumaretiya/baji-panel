import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchDomainConfiguration,
  selectCurrentSiteName,
  selectFavicon,
  setCurrentSiteName,
} from '../store/slices/commonSlice.js'

function applyFavicon(href) {
  if (typeof document === 'undefined' || !href) return
  let link = document.querySelector("link[rel*='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.type = 'image/x-icon'
  link.href = href
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

export function useDomainConfiguration() {
  const { t, i18n } = useTranslation()
  const dispatch = useDispatch()
  const favicon = useSelector(selectFavicon)
  const currentSiteName = useSelector(selectCurrentSiteName)
  const language = i18n.language

  useEffect(() => {
    dispatch(fetchDomainConfiguration())
    const siteName = titleCase(getSecondLevelDomain())
    if (siteName) dispatch(setCurrentSiteName(siteName))
  }, [dispatch])

  useEffect(() => {
    applyFavicon(favicon)
  }, [favicon])

  useEffect(() => {
    if (!currentSiteName) return
    applyTitle(t('app.titleSuffix', { siteName: currentSiteName }))
  }, [currentSiteName, language, t])
}
