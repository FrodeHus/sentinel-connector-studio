/**
 * Convert ISO 8601 duration (PT5H, P1D, PT30M) to Sentinel shorthand (5h, 1d, 30m).
 * Falls through to the original value if the pattern isn't recognised.
 */
export function isoToShorthand(iso: string): string {
  const upper = iso.toUpperCase()
  const days = upper.match(/^P(\d+)D$/)
  if (days) return `${days[1]}d`
  const hours = upper.match(/^PT(\d+)H$/)
  if (hours) return `${hours[1]}h`
  const minutes = upper.match(/^PT(\d+)M$/)
  if (minutes) return `${minutes[1]}m`
  const seconds = upper.match(/^PT(\d+)S$/)
  if (seconds) return `${seconds[1]}s`
  return iso
}

/**
 * Convert duration shorthand (1d, 7d, 5h, 30m) or ISO 8601 (PT5H, P1D) to ISO 8601.
 * Returns empty string for non-string input.
 */
export function shorthandToIso(value: unknown): string {
  if (typeof value !== "string") return ""
  const trimmed = value.trim().toUpperCase()

  // Already ISO 8601
  if (/^P/.test(trimmed)) return trimmed

  // Shorthand: e.g. "1d", "7d", "5h", "30m"
  const match = trimmed.match(/^(\d+)\s*([DHMS])$/i)
  if (match) {
    const num = match[1]
    const unit = match[2].toUpperCase()
    if (unit === "D") return `P${num}D`
    return `PT${num}${unit}`
  }

  return value
}
