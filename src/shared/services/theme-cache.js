// Lightweight (un-encrypted) cache for theme state so the first paint after
// reload uses the user's last-seen theme — instead of the `null` default that
// briefly forces `isYellowTheme = true` until the domain-configuration API
// responds.

const PANEL_THEME_KEY = 'pt'
const SELECTED_THEME_KEY = 'st'
const VALID_BODY_CLASSES = ['mcv-yellow-theme', 'yellow-theme']

export function getCachedPanelTheme() {
  try {
    return localStorage.getItem(PANEL_THEME_KEY) || null
  } catch {
    return null
  }
}

export function getCachedSelectedTheme() {
  try {
    return localStorage.getItem(SELECTED_THEME_KEY) || 'light'
  } catch {
    return 'light'
  }
}

export function cacheTheme({ panelTheme, selectedTheme } = {}) {
  try {
    if (panelTheme !== undefined) {
      if (panelTheme === null) localStorage.removeItem(PANEL_THEME_KEY)
      else localStorage.setItem(PANEL_THEME_KEY, String(panelTheme))
    }
    if (selectedTheme !== undefined && selectedTheme !== null) {
      localStorage.setItem(SELECTED_THEME_KEY, String(selectedTheme))
    }
  } catch {
    // ignore quota / private-mode errors
  }
}

// Apply the cached body theme class synchronously — call before React renders
// so the first paint already carries the right class instead of swapping later.
export function applyCachedThemeBodyClass() {
  if (typeof document === 'undefined') return
  const body = document.body
  if (!body) return
  body.classList.remove(...VALID_BODY_CLASSES)
  // Body-class derivation mirrors the (currently empty) `THEME_BODY_CLASSES`
  // map in shared/types/common.js — extend here if/when those gain real values.
  // For now no class is added; the slice's `isYellowTheme` selector + cached
  // `panelTheme` are enough to render the correct theme variant on first paint.
}
