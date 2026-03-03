import type { TourStop } from "./types"

export function validateStopValue(
  stop: TourStop,
  currentValue: string,
): boolean {
  if (stop.expectedValue === null) return true

  const expected = stop.expectedValue
  const value = currentValue.trim()

  switch (stop.matchStrategy) {
    case "exact":
      return value === expected
    case "startsWith":
      return value.length > 0 && value.startsWith(expected)
    case "endsWith":
      return value.length > 0 && value.endsWith(expected)
    case "contains":
      return value.length > 0 && value.includes(expected)
    default:
      return false
  }
}
