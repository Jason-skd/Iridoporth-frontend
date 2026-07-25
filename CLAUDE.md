# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm install          # install deps
npm run dev          # Vite dev server; proxies /api → VITE_DEV_API_TARGET (default http://127.0.0.1:3000)
npm run build        # type-check (tsc -b) then vite build → dist/
npm run lint         # eslint .
npm run preview      # serve the production build
npx tsc -b           # type-check only (no bundle)
```

There is **no test framework** — no `test` script, no test files. Don't go looking for one; verify changes with `npm run lint`, `npx tsc -b`, and by driving the flow in `npm run dev`.

Dev proxy override: `VITE_DEV_API_TARGET=http://host:port npm run dev`. The backend is expected on `127.0.0.1:3000` locally.

## Stack & conventions

- **React 19.2 + Vite 8 + react-router-dom 7.** Entry is `src/main.tsx` (StrictMode + BrowserRouter).
- **Strict TS that forbids runtime-only syntax.** `tsconfig.app.json` sets `verbatimModuleSyntax` and `erasableSyntaxOnly`, plus `noUnusedLocals`/`noUnusedParameters`. Consequences:
  - Always use `export type` / `import type` for types.
  - **No enums, no namespaces, no parameter properties** — `erasableSyntaxOnly` rejects them. Use union string types + `as const` objects instead.
- **No Tailwind, no state library, no axios.** Styling is hand-written CSS; HTTP is the custom `fetch` wrapper in `src/http/`. Icons come from `@phosphor-icons/react`.
- `src/lib/i18n.tsx` is **single-locale**. The old EN/ZH toggle was retired; copy carries a light bilingual accent inline. All user-visible strings live in the `dict` object and are read via `t('dotted.path', { placeholder })` (`{name}` interpolation). `useTranslation()` returns `{ t }`. Add strings here, never hard-code user copy.

## Architecture

### App shell & routing
`App.tsx` is the shell only — `<Nav/>` (sticky header, `BrandSeal`, `NavLink` routes) + `<AppRouter/>`. The route table lives in `src/router/AppRouter.tsx`: `/` (Home), `/raspi-status`, `/flight-log`, `/login`, `/admin`. Keep the shell and the route table separate; pages go in `src/pages/`.

### API layering (mirrors the backend)
Three layers, deliberately separated — do not collapse them:
- `src/api/` — pure DTO wire shapes (`FlightLogEntry`, `AdminFlightLogEntry`, `RaspiStatus`). Data only, no logic.
- `src/http/` — `client.ts` (`readJson`, `jsonBody`, `apiBase`, `ApiEnvelope`, `EmptyData`) and `api_error.ts` (`ApiError`, `errorCode`, `errorMessage`, `extractCode`, `statusFallback`).
- `src/services/` — per-feature call orchestration (`flight-log.ts`, `raspi.ts`, `account.ts`).

`src/lib/api.ts` is a **barrel facade** that re-exports the old flat surface so pages can keep doing `import { … } from '../lib/api'`. When adding new call sites, import from the layered modules directly; the facade exists only to avoid churning page imports.

Backend wire contract:
- Success: `{ ok: true, data: T }` — `readJson` unwraps and returns `data`.
- Error: `{ ok: false, error: { code } }` — **code string only, no message**. `readJson` throws `ApiError(code, status)`.
- All requests send `credentials: 'include'` for the HttpOnly session cookie.
- Endpoints are `/api/v1/*`. `apiBase` (`VITE_API_BASE_URL`, empty = same-origin) is prepended; in dev the Vite proxy serves same-origin `/api`.

Rendering errors: `errorMessage(error)` maps the backend code to `errors.<code>` in the i18n dict, falling back to `errors.generic`. `statusFallback` synthesizes a code from HTTP status when the body carries none (401→`unauthenticated`, 403→`forbidden`, …).

### Layout contract (cross-page invariant)
This is the core frontend invariant — read `src/styles/tokens.css` + `src/styles/layout.css` + the TS mirror `src/lib/layout.ts` together.

`--hero-min-h = calc(100dvh - var(--header-h) - var(--hero-peek))` is the "function": every hero is `.hero` (+ `.hero--split` for the two-column Home/Raspi grid, + `.hero--center` for FlightLog's centered flex column) so its outer box is exactly `--hero-min-h` tall and the single `.hero__cue` (a `ScrollHint`) lands at the same viewport Y on every page.

**The hero owns the content-start offset** (`--section-pad-top`); page wrappers carry **no top padding** (this is deliberate — adding top padding to a page wrapper double-offsets the hero). Non-hero pages (Admin) use `.page` (+ `.page--narrow`) and apply their own `--section-pad-top`.

`src/lib/layout.ts` mirrors the same numbers for JS consumers (scroll-snap, scroll-margin). **CSS is authoritative** — when you change a token, update `tokens.css`/`layout.css` and `layout.ts` together.

### Styles
`src/index.css` is only an ordered `@import` manifest (the order reproduces the pre-split cascade of the deleted `App.css`). Per-concern sheets live in `src/styles/` (`tokens`, `base`, `layout`, `home`, `raspi`, `flight-log`, `auth`, `admin`, `animations`, `responsive`). `tokens.css` is imported first because it defines the `:root` design tokens everyone else consumes via `var()`. **Add CSS to the matching concern file, not to `index.css`.** Palette is light/dark via `prefers-color-scheme` with one accent `--signal`.

### Page data-fetching pattern
See `src/pages/FlightLogPage.tsx` for the canonical pattern: a tagged-union state (`{ status: 'loading' | 'ready' | 'error' }`), an `AbortController` created inside `useEffect` (aborted on cleanup), and optimistic mutations that roll back on failure (like/unlike). Mutations live in the page and are passed down to presentational cards; the service layer stays dumb.

## Backend feature scope (matters for frontend decisions)

- **flight-log** is anonymous — the backend derives `callsign` server-side, so it is always `"Anonymous"`; there is no composer callsign field and no content-edit (PATCH only sets `is_deleted` / `is_hidden` / `response` / `clear_response`).
- **Owner delete** is `PATCH /api/v1/flight-log/{id}` `{ is_deleted: true }`; visibility/response are the same endpoint with different bodies. Like/unlike are `POST`/`DELETE` on `…/{id}/like`.
- **Admin** (`/admin`) is self-guarding: a `forbidden` code means redirect away. The single endpoint `/api/v1/flight-log/admin` returns everything; the page buckets it client-side into unreplied / active / hidden / deleted.
- **Auth**: `/api/v1/login` sets the HttpOnly cookie — **there is no logout endpoint and no logout UI**. `changePassword` (`PUT /api/v1/account/password`) is overloaded: the `unauthenticated` code also covers a wrong current-password, so treat it as "session expired → redirect to /login".

## Deploy
`Dockerfile` is a two-stage build: `node:22-alpine` runs `npm run build`, `nginx:1.27-alpine` serves `dist/`. `nginx.conf` proxies `/api/` → `http://backend:3000/api/` and falls back to `/index.html` for client-side routing. The GitHub Actions workflow (`.github/workflows/docker.yml`) builds on tags `v*.*.*` (and `latest` on the default branch) and pushes to `ghcr.io/jason-skd/iridoporth-frontend`, on an ARM64 runner (`ubuntu-24.04-arm`).

## Repo notes
- `.playwright-mcp/` (Playwright MCP screenshots/snapshots/logs) is gitignored.
- `docs/TODO.md` tracks backend-dependent feature gaps (e.g. ip→city, content edit) — check it before assuming a feature exists.
