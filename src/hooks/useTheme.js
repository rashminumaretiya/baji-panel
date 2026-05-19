import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectPanelTheme } from '../store/slices/commonSlice.js'
import {
  ALL_THEME_BODY_CLASSES,
  resolveThemeBodyClass,
} from '../shared/types/common.js'

export function useTheme() {
  const panelTheme = useSelector(selectPanelTheme)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const { body } = document
    if (!body) return

    body.classList.remove(...ALL_THEME_BODY_CLASSES)
    const next = resolveThemeBodyClass(panelTheme)
    if (next) body.classList.add(next)

    return () => {
      body.classList.remove(...ALL_THEME_BODY_CLASSES)
    }
  }, [panelTheme])
}
