# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — ESLint (flat config in [eslint.config.js](eslint.config.js)). There are no tests in this repo.
- `npm run format` / `npm run format:check` — Prettier write/check. Style is `semi: false`, `singleQuote: true`, `trailingComma: es5`.

This is a JavaScript codebase (`.jsx` / `.js`) on React 19 + Vite 8. Do not add TypeScript files.

## Origin and porting context

This frontend is a **React port of an Angular app (`sbex-user-fe`)**. Many files carry `// Ported from sbex-user-fe/...` comments. When you change behavior, treat the Angular original as the spec — interceptor chains, thunk lifecycles, and selector names deliberately mirror the Angular service / signal surface. The Redux slices in [src/store/slices/](src/store/slices/) replace Angular services + signals; selectors are named like the Angular computed signals they replace (`selectIsAuthenticated`, `selectIsYellowTheme`, etc.).

The companion backends live in the additional working directories under `/Users/taglineinfotechllp/Documents/sites/node/Rental-sbex/` (`sbex-user-be`, `sbex-affiliate-be`, `sbex-casino-be`, `sbex-settlement-be`, `sbex-socket-be`). API and socket contracts are defined there.

## Architecture

### App bootstrap order ([src/main.jsx](src/main.jsx))

The order in `main.jsx` matters and is load-bearing:

1. `applyCachedThemeBodyClass()` — synchronously paints the cached theme class on `<body>` before React renders, avoiding a yellow-theme flash.
2. `bootstrapHttp()` — binds the axios client in [src/core/http/client.js](src/core/http/client.js) to the Redux store + i18next so interceptors can read the Bearer token and translate error keys ([src/core/http/bootstrap.js](src/core/http/bootstrap.js)).
3. `bootstrapSocket()` — opens the socket.io connection and wires `odds_update` into the `sport` slice ([src/core/socket/bootstrap.js](src/core/socket/bootstrap.js)).
4. `setupMobileBreakpointListener(store)` — keeps `common.isMobile` in sync with `(max-width: 767px)`.
5. A store subscription persists `panelTheme` + `selectedTheme` to localStorage via [src/shared/services/theme-cache.js](src/shared/services/theme-cache.js).
6. If `?token=` is present in the URL, dispatch `autoLoginFromUrlToken()` before mounting. This is the SSO entry point.

The HTTP client is a module-level singleton — import `http` from `core/http/client.js` everywhere. The socket client in [src/core/socket/client.js](src/core/socket/client.js) is also a singleton; use `subscribeEvents` / `unsubscribeEvents` / `listenSocket` rather than re-creating connections.

### Redux store ([src/store/store.js](src/store/store.js))

Seven slices: `auth`, `betSlip`, `common`, `header`, `layout`, `sport`, `account`. A few conventions to follow:

- **Thunks use the `condition` option** to dedupe + TTL-cache fetches (see `fetchSidebarSports`, `loadGamesForSport`, `fetchDomainConfiguration`). When adding a thunk for cached data, follow that pattern instead of guarding at the call site.
- **Selectors live next to the slice** and are named `select…`. Use `createSelector` for any derived/filtered value.
- **Socket → store glue is centralized**: `mergeOddsUpdate` in `sportSlice` is the single reducer that absorbs live odds. Don't add socket listeners inside components; add a handler in `bootstrapSocket` and dispatch.

### Auth + encrypted localStorage

- The user object is persisted **encrypted** via [src/shared/services/local-storage.js](src/shared/services/local-storage.js) using AES-ECB with `environment.cryptoSecret` (keys are also encrypted). Always use `localStorageService.{set,get,remove}Item` rather than raw `localStorage`, otherwise reads return `null`.
- Bet-place payloads use a **separate** secret (`cryptoSecretforPayload`) via `encryptPayload` — see [src/shared/services/place-bet.js](src/shared/services/place-bet.js). The server expects `{ bet: <ciphertext> }`.
- Theme cache deliberately uses **plain** localStorage (keys `pt`, `st`) so it can be read synchronously before the store exists.

### Interceptors ([src/core/interceptor/](src/core/interceptor/))

- `header-interceptor.js` injects `Bearer ${token}` and `ngrok-skip-browser-warning: true`.
- `error-interceptor.js` has special behavior to preserve:
  - `481` → dispatches `setIsIPBanned` and rejects without toasting.
  - URL contains `bet/place` → reject silently (the bet flow shows its own UI).
  - `401` / `499` → clear auth (`setUser(null)`), suppress the toast for `errors.UNAUTHENTICATED` / `errors.TOKEN_REQUIRED`.
  - Any `/i18n/` request error is passed through (avoids a toast loop if translations 404).

### Routing + layouts ([src/App.jsx](src/App.jsx))

Four layout shells under [src/layouts/](src/layouts/):

- `Layout` — default (header + sports sidebar + bet slip + open bets + mobile nav). Branches on `isMobile`, `isAuthenticated`, `isYellowTheme`, `isOneClickBet`, `isAccountRoute`, `layoutedRoutes`.
- `InPlayLayout` — `/in-play`, `/result`.
- `ResultLayout` — `/ipl-winner`.
- `MyAccountLayout` — wraps `/my-account/*`; `index` redirects to `my-profile`.

All non-Home pages are `React.lazy()` — keep that pattern. A `Suspense` fallback (`<Loader>`) is provided by `Layout`.

Layout sizing rules that used to live in `layout.scss` (`.main-wrapper`, `.left-content`, `.middle-content`, `.right-content`, `.scroll-wrap`, `.no-header-wrapper`) are now top-of-file string constants inside [src/layouts/Layout.jsx](src/layouts/Layout.jsx) and [src/layouts/MyAccountLayout.jsx](src/layouts/MyAccountLayout.jsx). Update those constants if you need to tweak the column widths or top offsets.

### Theming

Panel theme state lives in `common.panelTheme` and is one of the values in `PanelTheme` ([src/shared/types/common.js](src/shared/types/common.js)). **Note:** `PanelTheme.MCV`, `BAJI`, and `BETJILI` currently all map to the string `'BAJI'` — the multi-theme system is half-built. `THEME_BODY_CLASSES` is intentionally empty (all values `''`); body-class swapping is handled in [src/hooks/useTheme.js](src/hooks/useTheme.js) against `ALL_THEME_BODY_CLASSES = ['mcv-yellow-theme', 'yellow-theme']`. Selectors `selectIsYellowTheme` / `selectIsMcvYellowTheme` are how components branch on the active theme.

The logo and favicon come from the domain-configuration API (`auth/domain-configuration`); there's a hostname-based override that swaps in a 9wickets logo for `babu365` / `velkiex247` hosts (see [src/store/slices/commonSlice.js](src/store/slices/commonSlice.js)).

### Constants ([src/core/constant/constants.js](src/core/constant/constants.js))

`SPORT_IDS`, `SPORTS`, and `RACING_SPORTS` are the source of truth. Use `getSportName`, `getSportSlug`, `getSportIdFromSlug`, and `isRacingSport` helpers rather than hard-coding IDs in components. URL slugs in routes (`/cricket`, `/horse-racing`) map back through `getSportIdFromSlug`.

### i18n ([src/i18n/index.js](src/i18n/index.js))

Translations are loaded over HTTP from `/i18n/{lng}.json` (files in [public/i18n/](public/i18n/), copied verbatim from the Angular app). Supported languages: `en`, `bn`, `hi`, `ur`. Use the `errors.*` key namespace for messages thrown via the error interceptor — it calls `i18n.t(key, dynamicValue)` directly.

### Styles — Tailwind v4 only

The codebase was migrated off Bootstrap + SCSS to **pure Tailwind v4**. The `bootstrap`, `react-bootstrap`, and `sass` packages are removed; no `.scss` files exist anywhere; no component imports a stylesheet of its own. Every component styles itself with Tailwind utility classes inline.

- **Single global stylesheet:** [src/index.css](src/index.css). Contains `@import 'tailwindcss'`, an `@theme` block with curated colour/font/breakpoint tokens, all ~200 `:root` CSS custom properties (consumed via arbitrary values), the two body-class theme override blocks (`.mcv-yellow-theme`, `.yellow-theme`) that JS toggles, `@font-face` rules, body resets, and `@keyframes` (`blinking`, `loadBar`, `sparkBack`, `sparkLay`, `yellow-circle`, `blue-circle`, `ticker-scroll`, `deposit-slide-in`). Animations are referenced from JSX via `animate-[name_0.8s_ease-in-out]` arbitrary values.
- **Design tokens are CSS custom properties first, Tailwind tokens second.** Most colours (`--xs-blue`, `--md-red-bg`, `--coffee`, etc.) only exist as `:root` vars — use them via arbitrary values: `bg-[var(--xs-blue)]`, `text-[var(--dark)]`, `border-[var(--light-border)]`. A small curated set lives in `@theme` (`primary`, `back-0/1/2`, `lay-0/1/2`, `primary-yellow`, …) and is available as ordinary Tailwind utilities like `bg-primary` / `text-primary-yellow`. When in doubt, prefer the arbitrary `var()` form so you don't have to extend `@theme`.
- **Mobile responsive uses a custom breakpoint.** `@theme` defines `--breakpoint-mobile: 767px`, so `max-mobile:foo` ≈ `@media (max-width: 766px)` — the convention that replaces the old SCSS `@media (max-width: 767px)` blocks. The original mobile sizing uses `vw` units; keep them as arbitrary values: `max-mobile:text-[3.47vw]`, `max-mobile:py-[1.87vw]`, `max-mobile:h-[14.67vw]`. Off-by-one on the breakpoint vs `767px` is intentional and accepted.
- **No Bootstrap class names.** `d-flex`, `row`, `col-*`, `btn`, `btn-primary`, `form-control`, `form-label`, `ms-N/me-N/ps-N/pe-N`, `align-items-*`, `justify-content-*`, `nav-tabs`, `nav-link`, `modal-header`, etc. are all dead and must never be reintroduced. Use the Tailwind equivalent.
- **Hand-rolled drop-ins replace react-bootstrap.** [src/shared/components/primitives/](src/shared/components/primitives/) holds `Modal`, `Accordion`, `Collapse`, `Popover`/`Overlay`, and `ListGroup`. APIs deliberately mirror the react-bootstrap surface used by the codebase (e.g. `<Accordion defaultActiveKey="X"><Accordion.Item eventKey="X"><Accordion.Header>…</Accordion.Header><Accordion.Body>…</Accordion.Body></Accordion.Item></Accordion>`) so call sites read like the originals. The custom `Modal` at [src/shared/components/Modal.jsx](src/shared/components/Modal.jsx) uses `isOpen`/`onClose`/`title`/`size`/`children`/`centered`/`closeOnBackdrop`/`closeOnEscape` — not react-bootstrap's `show`/`onHide`.
- **Popover placement** in the primitive only supports `top|bottom|left|right` (no `bottom-end` etc.). Anchored popovers may sit centered instead of edge-aligned.

## Environment

[src/environments/environment.js](src/environments/environment.js) holds API URLs and the two crypto secrets. There is no separate dev/prod file — `server: 'development'` is the flag used by `selectIsShowHeader` to render the header even when logged out, which is intentional for local development.
