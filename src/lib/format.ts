export function formatPercent(value: number | null) {
  if (value === null) return '--'
  return `${Math.round(value)}%`
}

export function formatTemp(value: number | null) {
  if (value === null) return '--'
  return `${value.toFixed(1)}C`
}

export function clampPercent(value: number | null) {
  if (value === null) return 0
  return Math.min(Math.max(value, 0), 100)
}
