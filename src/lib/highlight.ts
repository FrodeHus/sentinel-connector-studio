import DOMPurify from "dompurify"

export function highlightJson(json: string): string {
  const highlighted = json.replace(
    /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(\b(?:true|false)\b)|(\bnull\b)|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/g,
    (match, key, str, bool, nil, num) => {
      if (key) return `<span class="json-key">${key}</span>:`
      if (str) return `<span class="json-string">${str}</span>`
      if (bool) return `<span class="json-bool">${bool}</span>`
      if (nil) return `<span class="json-null">${nil}</span>`
      if (num) return `<span class="json-number">${num}</span>`
      return match
    },
  )
  return DOMPurify.sanitize(highlighted, {
    ALLOWED_TAGS: ["span"],
    ALLOWED_ATTR: ["class"],
  })
}
