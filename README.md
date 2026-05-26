# baji-panel

React 19 + Vite 8 frontend for the MCV/Baji exchange. Port of the original
Angular `sbex-user-fe` app — see [CLAUDE.md](CLAUDE.md) for the load-bearing
architectural decisions (interceptor chains, theme cache flow, encrypted
localStorage, Tailwind v4 patterns).

## Scripts

| Command            | Purpose                                       |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Vite dev server with HMR                      |
| `npm run build`    | Production build to `dist/`                   |
| `npm run preview`  | Serve the production build locally            |
| `npm run lint`     | ESLint (flat config, [eslint.config.js])      |
| `npm run format`   | Prettier write (project style: see `.prettierrc`) |

## Tech stack

- React 19, React Router v7, Redux Toolkit, react-redux 9
- Vite 8 (`@vitejs/plugin-react`)
- Tailwind v4 via `@tailwindcss/vite` — no SCSS, no Bootstrap
- `axios` for HTTP, `socket.io-client` for live odds
- `i18next` + `i18next-http-backend` (translations served from `public/i18n/`)
- `crypto-js` for the encrypted-localStorage layer
- `sweetalert2` for toast/alert dialogs

## Directory map

```
src/
  App.jsx                 Routes + ErrorBoundary + layout selection
  main.jsx                Bootstrap order (theme cache → http → socket → i18n)
  index.css               Single global stylesheet (Tailwind + CSS custom props)
  core/
    constant/             SPORT_IDS, slug helpers, app-wide constants
    http/                 axios singleton + bootstrap (binds to store + i18n)
    interceptor/          header / success / error interceptors
    socket/               socket.io singleton + event names + bootstrap
  store/
    store.js              configureStore with 8 slices
    slices/               auth, betSlip, casino, common, header, layout,
                          sport, account — each slice owns its selectors
  hooks/                  useTheme, useSocket, useMediaQuery,
                          useDomainConfiguration, useHomePageData
  layouts/                Layout, InPlayLayout, MyAccountLayout — top-of-file
                          string constants own the column-width / vw spacing
  pages/                  Lazy-loaded route components, one per route
  components/             Header, BetSlip, OpenBets, Stake, NewsLine,
                          MobileNavigation, MyAccountPopup, …
  shared/
    components/           Loader, Modal, ErrorBoundary + primitives/
    services/             alert, place-bet, local-storage, theme-cache,
                          casino-img-url
    types/                Plain enums + constants (PanelTheme, LOCALSTORAGE, …)
  utils/
    cx.js                 className joiner (centralized)
    customFunction.js     formatAmount (Intl.NumberFormat + scientific fallback)
    format.js             formatDateTimeStamp (YYYY-MM-dd HH:mm:ss)
  environments/           apiUrl + crypto secrets (single environment.js)
  i18n/                   i18next init (loads translations over HTTP)
public/
  i18n/                   en.json, bn.json, hi.json, ur.json
  img/                    Static images, sprites, casino tile thumbnails
```

## Bootstrap order ([src/main.jsx])

This order is load-bearing — changing it causes visible regressions:

1. `applyCachedThemeBodyClass()` — paints the cached theme class on `<body>`
   synchronously, before React mounts, to avoid a yellow-theme flash.
2. `bootstrapHttp()` — wires the axios singleton to the store + i18n so
   interceptors can read the bearer token and translate error keys.
3. `bootstrapSocket()` — opens socket.io and routes `odds_update` into the
   `sport` slice via a single `mergeOddsUpdate` reducer.
4. `setupMobileBreakpointListener(store)` — keeps `common.isMobile` in sync
   with `(max-width: 767px)`.
5. Store subscription persists `panelTheme` + `selectedTheme` to localStorage
   (plain, not encrypted, so the synchronous step 1 can read it).
6. If `?token=` is in the URL, dispatch `autoLoginFromUrlToken()` — the SSO
   entry point.

## Conventions

- **JavaScript only.** No `.ts` / `.tsx` files. JSX everywhere.
- **One axios singleton** — `import { http } from 'core/http/client.js'`.
- **One socket singleton** — use `subscribeEvents` / `unsubscribeEvents` /
  `listenSocket`. Don't re-open connections in components.
- **Selectors live next to slices** and are named `select…`. Use
  `createSelector` for any derived value.
- **Thunks use the `condition` option** to dedupe + TTL-cache fetches
  (`fetchSidebarSports`, `loadGamesForSport`, `fetchDomainConfiguration`).
  Don't guard at the call site.
- **Routes are lazy-loaded** in [src/App.jsx]. Suspense fallbacks live in the
  layouts.
- **Layout sizing constants** are top-of-file `const` strings in each layout
  file — these replace the original SCSS rules. Tweak there, not inline.
- **Encrypted localStorage** for user-related keys — always use
  `localStorageService.{set,get,remove}Item`. Plain `localStorage` is reserved
  for the theme cache.
- **Tailwind v4 only.** Use arbitrary values for the design tokens
  (`bg-[var(--xs-blue)]`, `max-md:py-[1.87vw]`). No Bootstrap class names.
- **Mobile breakpoint** is custom: `--breakpoint-mobile: 767px`, so
  `max-md:…` ≈ `@media (max-width: 766px)`.
- **i18n keys for errors** live under `errors.*` — the error interceptor
  calls `i18n.t(key, dynamicValue)` directly.

## Environment

API URLs and crypto secrets live in [src/environments/environment.js]. There's
no separate dev/prod file; `server: 'development'` is the flag that makes the
header render before login (intentional for local dev).

## Testing

There are no automated tests in this repo. Verify behavior in the dev server
against the running backends in `/Users/.../Rental-sbex/` (see CLAUDE.md).
