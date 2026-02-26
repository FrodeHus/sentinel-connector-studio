/**
 * Extract values from a JSON object using simplified JSON path expressions.
 *
 * Supported paths:
 *   "$"            – root (returns the value itself, flattened if array)
 *   "$.foo.bar"    – dot-notation traversal
 *
 * Results from all paths are concatenated into a single array.
 */
export function extractByJsonPaths(
  data: unknown,
  paths: string[],
): unknown[] {
  const results: unknown[] = []

  for (const raw of paths) {
    const path = raw.trim()
    if (!path) continue

    let current: unknown = data

    if (path !== "$") {
      const segments = path
        .replace(/^\$\.?/, "")
        .split(".")
        .filter(Boolean)

      for (const segment of segments) {
        if (current == null || typeof current !== "object") {
          current = undefined
          break
        }
        current = (current as Record<string, unknown>)[segment]
      }
    }

    if (current === undefined) continue

    if (Array.isArray(current)) {
      results.push(...current)
    } else {
      results.push(current)
    }
  }

  return results
}
