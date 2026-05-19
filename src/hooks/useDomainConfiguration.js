import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchDomainConfiguration,
  selectFavicon,
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

export function useDomainConfiguration() {
  const dispatch = useDispatch()
  const favicon = useSelector(selectFavicon)

  useEffect(() => {
    dispatch(fetchDomainConfiguration())
  }, [dispatch])

  useEffect(() => {
    applyFavicon(favicon)
  }, [favicon])
}
