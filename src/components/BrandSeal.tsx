type BrandSealProps = {
  size?: number
  className?: string
}

/**
 * Iridoporth cabin-window seal: a capsule aircraft window looking out over a
 * horizon, a contrail flight path, and an altitude sun. Brand mark built from
 * the locked palette. The frame follows `currentColor` so it adapts to light
 * and dark surfaces; the contrail and sun use the signal/sun tokens.
 */
export function BrandSeal({ size = 48, className }: BrandSealProps) {
  return (
    <svg
      viewBox="0 0 64 80"
      width={size}
      height={(size * 80) / 64}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="6"
        width="52"
        height="68"
        rx="26"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <rect
        x="11"
        y="11"
        width="42"
        height="58"
        rx="22"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.32"
      />
      <line
        x1="15"
        y1="52"
        x2="49"
        y2="52"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
      <path
        className="brand-seal__contrail"
        d="M15 47 Q32 30 49 40"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle className="brand-seal__sun" cx="43" cy="27" r="3.6" />
    </svg>
  )
}
