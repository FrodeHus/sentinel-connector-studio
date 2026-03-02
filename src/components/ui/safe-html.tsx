import * as React from "react"
import DOMPurify from "dompurify"

const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: ["span"],
  ALLOWED_ATTR: ["class"],
}

interface SafeHtmlSpanProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "dangerouslySetInnerHTML" | "children"> {
  /** Raw HTML string. Will be sanitized with DOMPurify before rendering. */
  html: string
}

/**
 * Renders sanitized HTML inside a <span>. Only <span> tags with class
 * attributes are allowed — everything else is stripped by DOMPurify.
 *
 * Use this instead of raw dangerouslySetInnerHTML to ensure consistent
 * sanitization across all preview components.
 */
export const SafeHtmlSpan = React.memo(function SafeHtmlSpan({ html, ...rest }: SafeHtmlSpanProps) {
  const sanitized = DOMPurify.sanitize(html, SANITIZE_OPTIONS)
  return <span {...rest} dangerouslySetInnerHTML={{ __html: sanitized || " " }} />
})
