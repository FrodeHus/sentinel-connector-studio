/**
 * Immutably update an item in an array by index, merging a partial patch.
 */
export function updateAtIndex<T>(arr: readonly T[], index: number, patch: Partial<T>): T[] {
  return arr.map((item, i) => (i === index ? { ...item, ...patch } : item))
}

/**
 * Immutably remove an item from an array by index.
 */
export function removeAtIndex<T>(arr: readonly T[], index: number): T[] {
  return arr.filter((_, i) => i !== index)
}
