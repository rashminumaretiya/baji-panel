// Mirrors a subset of sbex-user-fe/src/app/shared/services/layout.ts state.
// Populate via thunks (domain/footer/banner fetches) in a follow-up phase.
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  // First URL segment whitelist that triggers MainLayout's sport + right sidebars.
  // Mirrors Angular's layoutedRoutes; extended with the React app's existing
  // page slugs (cricket, soccer, tennis) so they get the same shell.
  layoutedRoutes: ['', 'inplay', 'game-details', 'sports', 'cricket', 'soccer', 'tennis'],
  domainConfig: null,
  banners: [],
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
      s.banners = payload || []
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
export const selectNewsList = (s) => s.layout.newsList
export const selectAnnouncements = (s) => s.layout.announcements
