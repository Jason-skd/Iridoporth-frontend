/**
 * Layout contract — readable single-source spec mirroring the CSS in
 * src/styles/tokens.css (the `:root` layout tokens + the `.hero` / `.page`
 * classes in src/styles/layout.css).
 *
 * CSS is authoritative at runtime; this module exposes the same numbers and a
 * few helpers for JS consumers (scroll-snap anchors, scroll-margin, resize
 * observers, future canvas/SVG work). WHEN YOU CHANGE A VALUE HERE, CHANGE IT
 * IN tokens.css / layout.css TOO — and vice versa.
 */

/** Primitive and derived lengths, as authored in CSS (`:root`). */
export const LAYOUT = {
  /** Sticky header height in px (`--header-h`). */
  headerHeight: 72,
  /** Slice of the next section that peeks into the first viewport (`--hero-peek`). */
  heroPeek: '7.5rem',
  /** Single content-start offset, shared by every section (`--section-pad-top`). */
  sectionPadTop: 'clamp(2.5rem, 6vw, 5.5rem)',
  /** Section bottom rhythm (`--section-pad-bottom`). */
  sectionPadBottom: 'clamp(4rem, 8vw, 7rem)',
  /** Hero grid/flex gap (`--hero-gap`). */
  heroGap: 'clamp(2rem, 6vw, 6rem)',
  /** Cue offset from the hero bottom edge (`--cue-gap`). */
  cueGap: 'clamp(1rem, 3vw, 2rem)',
  /** Standard page width (`--page-width`). */
  pageWidth: 'min(1180px, calc(100% - 2rem))',
  /** Narrow page width, e.g. admin (`--page-width-narrow`). */
  pageWidthNarrow: 'min(880px, calc(100% - 2rem))',
} as const

/**
 * Hero min-height as a CSS length string — matches `--hero-min-h`. The hero's
 * outer box resolves to exactly this height (it is `border-box`), so the next
 * section peeks `--hero-peek` into the first viewport.
 */
export const heroMinHeight = `calc(100dvh - ${LAYOUT.headerHeight}px - ${LAYOUT.heroPeek})`

/**
 * Scroll-margin to apply to any `scrollIntoView` target so the sticky header
 * (`--header-h`) does not cover it. Used e.g. on `#flight-log-board`.
 */
export const scrollMarginTop = LAYOUT.headerHeight

/**
 * px from the top of the document at which the hero's peek line sits — i.e.
 * where the next section begins to enter the viewport. `dvh` is the current
 * dynamic viewport height in px. Handy for scroll-snap anchors / scroll drives.
 */
export function heroPeekLinePx(dvh: number): number {
  return dvh - remToPx(LAYOUT.heroPeek)
}

/** CSS custom-properties for a hero/section, for inline overrides if needed. */
export function sectionVars(): Record<string, string> {
  return {
    '--section-pad-top': LAYOUT.sectionPadTop,
    '--section-pad-bottom': LAYOUT.sectionPadBottom,
    '--hero-min-h': heroMinHeight,
  }
}

/* ---- internal helpers (no deps) ---- */

function remToPx(value: string): number {
  const match = /^([0-9.]+)rem$/.exec(value.trim())
  if (!match) return 0
  const rem = Number(match[1])
  // :root sets font-size: 17px (tokens.css), so 1rem = 17px. Read the computed
  // value at runtime in case that ever changes.
  const rootPx = readRootFontSize()
  return rem * rootPx
}

let cachedRootFontSize: number | null = null
function readRootFontSize(): number {
  if (cachedRootFontSize !== null) return cachedRootFontSize
  if (typeof document !== 'undefined') {
    const px = parseFloat(getComputedStyle(document.documentElement).fontSize)
    if (Number.isFinite(px) && px > 0) {
      cachedRootFontSize = px
      return px
    }
  }
  return 17 // fallback matching tokens.css :root font-size
}
