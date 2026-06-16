# Home asset brief

## What to use as reference

- Backend API semantics from `../Iridoporth-backend`:
  - `GET /api/v1/raspi/status` means live hardware signal: hostname, CPU temperature, CPU usage, memory usage, or unavailable.
  - `GET/POST /api/v1/flight-log` powers quiet anonymous entries: id, content, callsign, created_at.
- Current frontend `main` branch can be used as technical scaffold only. It is effectively a fresh Vite app.
- `$brandkit` is the quality bar: sparse, intentional, grid-aware, brand-system driven, and implementation-friendly.

## What not to use as reference

- The `legacy` branch should not guide visual direction, layout rhythm, component style, or palette.
- The Vite/React starter visuals should be removed from the product language.
- Avoid enterprise dashboards, SaaS bento templates, generic AI purple-blue glow, stock-tech hero sections, and full business-product framing.
- The home page should not become the raspi status page or the flight-log page. It should introduce them quietly.
- Avoid round nautical window language. The window is an aircraft cabin window: a vertical capsule with thick molded trim.
- Avoid waterline or coastline scenery. The view is high-altitude cloud, sky, contrail, route marks, and cabin light.

## Direction

Iridoporth is a personal narrative site built around an aircraft window, a small machine signal, and flight-log.

The home page should feel like opening a quiet notebook on a folded tray table: paper grain, ink marks, a few route lines, and a capsule-shaped aircraft window looking out over cloud layers and cabin light. The raspi status is an onboard instrument heartbeat. flight-log is where private notes disappear.

Visual tone:

- Creative narrative, not corporate.
- Sparse and quiet. Let empty space do more work than copy.
- Hand-journal materiality, but composed with premium restraint.
- Calm, personal, slightly technical.
- More notebook than dashboard; more cabin window than landing page.
- Aircraft-window silhouette first: tall rounded rectangle, inner acrylic highlight, molded fuselage trim, and gentle cabin shadow.

Working palette:

- Ink graphite: `#191816`
- Cabin charcoal: `#242321`
- Fuselage paper: `#f3efe4`
- Cloud blue: `#dbe5e3`
- Altitude blue: `#6fa8bd`
- Deep sky: `#1f5969`
- Signal vermilion: `#c6543f`
- Runway amber: `#d8b24a`

Initial assets:

- `iridoporth-brandkit.svg`: 3x3 identity board and visual-system overview.
- `hero-aircraft-window.svg`: hero illustration for the home page.
- `journal-fragments.svg`: secondary hand-journal composition for navigation/content previews.
- `stamp-strip.svg`: reusable stamps, labels, and small motifs.
