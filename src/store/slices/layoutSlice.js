import { createSlice } from '@reduxjs/toolkit'
import { fetchDomainConfiguration } from './commonSlice.js'

const BANNER_KEYS = [
  'banners',
  'promotionalBanners',
  'mobileLoginBanner',
  'desktopRegistrationBanner',
  'favouriteBanners',
  'eventBanners',
  'primaryBanners',
]

function emptyBanners() {
  return BANNER_KEYS.reduce((acc, key) => {
    acc[key] = { light: {}, dark: {} }
    return acc
  }, {})
}

function normalizeBanners(d) {
  const next = emptyBanners()
  for (const key of BANNER_KEYS) {
    const bucket = d?.[key]
    if (bucket && typeof bucket === 'object') {
      next[key] = {
        light: bucket.light && typeof bucket.light === 'object' ? bucket.light : {},
        dark: bucket.dark && typeof bucket.dark === 'object' ? bucket.dark : {},
      }
    }
  }
  return next
}

const initialState = {
  layoutedRoutes: [
    '',
    'inplay',
    'odds',
    'racing-odds',
    'sports',
    'cricket',
    'soccer',
    'tennis',
    'horse-racing',
    'greyhound-racing',
  ],
  domainConfig: null,
  banners: emptyBanners(),
  footerData: null,
  announcements: [],
  newsList: [],
}

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    setDomainConfig(s, { payload }) {
      s.domainConfig = payload
    },
    setBanners(s, { payload }) {
      s.banners = payload && typeof payload === 'object' ? payload : emptyBanners()
    },
    setFooterData(s, { payload }) {
      s.footerData = payload
    },
    setAnnouncements(s, { payload }) {
      s.announcements = payload || []
    },
    setNewsList(s, { payload }) {
      s.newsList = payload || []
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchDomainConfiguration.fulfilled, (s, { payload }) => {
      s.domainConfig = payload ?? null
      s.banners = normalizeBanners(payload)
    })
  },
})

export const {
  setDomainConfig,
  setBanners,
  setFooterData,
  setAnnouncements,
  setNewsList,
} = layoutSlice.actions

export default layoutSlice.reducer

export const selectLayoutedRoutes = (s) => s.layout.layoutedRoutes
export const selectDomainConfig = (s) => s.layout.domainConfig
export const selectAllBanners = (s) => s.layout.banners
export const selectNewsList = (s) => s.layout.newsList
export const selectAnnouncements = (s) => s.layout.announcements

// Returns the banner array for a given bucket / mode / language, falling back
// to "en" then any available language when the requested locale is missing.
export const selectBannerList = (bucket, mode, language) => (s) => {
  const entry = s.layout.banners?.[bucket]?.[mode]
  if (!entry || typeof entry !== 'object') return []
  if (Array.isArray(entry[language])) return entry[language]
  if (Array.isArray(entry.en)) return entry.en
  const firstAvailable = Object.values(entry).find((v) => Array.isArray(v))
  return firstAvailable || []
}
