/**
 * Application configuration constants
 * Centralizes magic numbers and configuration values
 */

export const CONFIG = {
  /** LocalStorage key for auto-saved configuration */
  STORAGE_KEY: "sentinel-ccf-builder-config",

  /** LocalStorage key for theme preference */
  THEME_STORAGE_KEY: "theme",

  /** Maximum file size for project imports (1 MB) */
  MAX_FILE_SIZE_BYTES: 1_048_576,

  /** Debounce delay for auto-save operations (ms) */
  AUTO_SAVE_DEBOUNCE_MS: 500,

  /** Duration to show "copied" feedback (ms) */
  COPY_FEEDBACK_DURATION_MS: 2000,

  /** Allowed file extensions for project import */
  ALLOWED_FILE_EXTENSIONS: [".json"] as const,

  /** Allowed MIME types for project import */
  ALLOWED_MIME_TYPES: ["application/json", "text/json", ""] as const,

  /** DOMPurify configuration for SVG sanitization */
  DOMPURIFY_CONFIG: {
    ALLOWED_TAGS: [
      "svg",
      "path",
      "circle",
      "rect",
      "line",
      "polyline",
      "polygon",
      "g",
      "defs",
      "clipPath",
      "mask",
      "pattern",
      "linearGradient",
      "radialGradient",
      "stop",
      "use",
      "title",
      "desc",
    ],
    ALLOWED_ATTR: [
      "viewBox",
      "xmlns",
      "d",
      "fill",
      "stroke",
      "stroke-width",
      "stroke-linecap",
      "stroke-linejoin",
      "cx",
      "cy",
      "r",
      "x",
      "y",
      "width",
      "height",
      "transform",
      "id",
      "class",
      "x1",
      "y1",
      "x2",
      "y2",
      "points",
      "offset",
      "stop-color",
      "stop-opacity",
      "fill-opacity",
      "stroke-opacity",
      "href",
      "xlink:href",
    ],
    KEEP_CONTENT: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  },
} as const;

/** File size in human-readable format */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Validate file for project import */
export function validateProjectFile(file: File): { valid: boolean; error?: string } {
  // Check file extension
  const hasValidExtension = CONFIG.ALLOWED_FILE_EXTENSIONS.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  if (!hasValidExtension) {
    return { 
      valid: false, 
      error: `Invalid file type. Only ${CONFIG.ALLOWED_FILE_EXTENSIONS.join(', ')} files are allowed.`
    };
  }
  
  // Check MIME type (if available)
  if (file.type && !CONFIG.ALLOWED_MIME_TYPES.includes(file.type as any)) {
    return { 
      valid: false, 
      error: `Invalid file type. Expected JSON file.`
    };
  }
  
  // Check file size
  if (file.size > CONFIG.MAX_FILE_SIZE_BYTES) {
    return { 
      valid: false, 
      error: `File is too large (${formatFileSize(file.size)}). Maximum allowed size is ${formatFileSize(CONFIG.MAX_FILE_SIZE_BYTES)}.`
    };
  }
  
  return { valid: true };
}

/** Validate URL for project import */
export function validateProjectUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return {
        valid: false,
        error: 'Invalid URL protocol. Only HTTP and HTTPS URLs are allowed.'
      };
    }
    
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid URL format.'
    };
  }
}
