export const SUB_HEADER_HEAD_PAGES = Object.freeze([
  {
    label: 'common.home',
    fallback: 'Home',
    url: '/highlight',
    aliasUrls: ['/'],
  },
  {
    label: 'common.inPlay',
    fallback: 'In-Play',
    url: '/in-play',
  },
  {
    label: 'titles.games.multiMarket',
    fallback: 'Multi Markets',
    url: '/multi-markets',
    isHidden: true,
  },
])

export const SUB_HEADER_TAIL_PAGES = Object.freeze([
  {
    label: 'header.result',
    fallback: 'Result',
    url: '/result',
    authRequired: true,
  },
])

export function sportTabToPage(tab) {
  const url = tab.route?.startsWith('/') ? tab.route : `/${tab.route ?? ''}`
  return {
    id: tab.id,
    label: tab.label,
    fallback: tab.name,
    icon: tab.icon,
    url,
    isCount: true,
    count: tab.count ?? 0,
  }
}

export function isPageActive(pathname, page) {
  if (pathname === page.url) return true
  if (page.aliasUrls?.some((alias) => alias === pathname)) return true
  return false
}
