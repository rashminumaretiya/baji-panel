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
        light:
          bucket.light && typeof bucket.light === 'object' ? bucket.light : {},
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
    'multi-markets',
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
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchDomainConfiguration.fulfilled, (s, { payload }) => {
      s.domainConfig = payload ?? null
      s.banners = normalizeBanners(payload)
    })
  },
})

export default layoutSlice.reducer

export const selectLayoutedRoutes = (s) => s.layout.layoutedRoutes
