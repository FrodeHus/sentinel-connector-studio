import { saveAs } from "file-saver";
import type { AppState } from "./schemas";
import { AppStateSchema } from "./schemas";
import {
  CONFIG,
  validateProjectFile,
  validateProjectUrl,
  formatFileSize,
} from "@/config";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function saveConfig(state: AppState): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // localStorage may be unavailable (private browsing) or full
      console.warn('Failed to auto-save to localStorage:', error);
      // Config is still held in memory for the current session, so the user can still export
    }
  }, CONFIG.AUTO_SAVE_DEBOUNCE_MS);
}

export function loadConfig(): AppState | null {
  try {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);

    // Migrate old format: single ConnectorConfig → AppState
    if ("meta" in parsed && !("connectors" in parsed)) {
      const migrated = {
        solution: parsed.solution ?? {},
        connectors: [
          {
            meta: parsed.meta,
            schema: parsed.schema,
            dataFlow: parsed.dataFlow,
            connectorUI: parsed.connectorUI,
          },
        ],
        activeConnectorIndex: 0,
      };
      // Parse through schema to apply new defaults (connectorKind, etc.)
      return AppStateSchema.parse(migrated);
    }

    // Parse through schema to fill new field defaults
    return AppStateSchema.parse(parsed);
  } catch (error) {
    console.warn('Failed to load config from localStorage:', error);
    // JSON.parse or schema validation failed; treat as no saved config
    return null;
  }
}

export function clearConfig(): void {
  try {
    localStorage.removeItem(CONFIG.STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear config from localStorage:', error);
    // localStorage unavailable in this context — no-op, nothing to clear
  }
}

export function exportConfig(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importConfig(json: string): AppState | null {
  try {
    return AppStateSchema.parse(JSON.parse(json));
  } catch (error) {
    console.error('Failed to import config:', error);
    return null;
  }
}

export function downloadProjectFile(state: AppState): void {
  const name =
    state.solution.name || state.connectors[0]?.meta.connectorId || "project";
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  saveAs(blob, `${name}-project.json`);
}

export async function readProjectFile(file: File): Promise<AppState> {
  // Validate file before reading
  const validation = validateProjectFile(file);
  if (!validation.valid) {
    throw new Error(validation.error!);
  }

  const text = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `The file does not contain valid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  try {
    return AppStateSchema.parse(parsed);
  } catch (error) {
    throw new Error(
      `The file is not a valid project file. It does not match the expected format: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Load project from a URL
 * @param url URL to fetch the project JSON from
 * @returns Parsed and validated AppState
 * @throws Error if URL is invalid, fetch fails, or content is invalid
 */
export async function readProjectFromUrl(url: string): Promise<AppState> {
  // Validate URL format and protocol
  const urlValidation = validateProjectUrl(url);
  if (!urlValidation.valid) {
    throw new Error(urlValidation.error!);
  }

  let response: Response;
  try {
    // Fetch with timeout and no credentials for security
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    response = await fetch(url, {
      method: 'GET',
      credentials: 'omit', // Don't send credentials for security
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. The URL took too long to respond.');
      }
      throw new Error(`Failed to fetch URL: ${error.message}`);
    }
    throw new Error('Failed to fetch URL: Unknown error');
  }

  // Verify content type
  const contentType = response.headers.get('content-type');
  if (contentType && !contentType.includes('application/json') && !contentType.includes('text/json')) {
    console.warn(`Warning: Expected JSON content-type, got: ${contentType}`);
  }

  // Check content length before reading
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > CONFIG.MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `Content is too large (${formatFileSize(size)}). Maximum allowed size is ${formatFileSize(CONFIG.MAX_FILE_SIZE_BYTES)}.`
      );
    }
  }

  // Read and parse response
  let text: string;
  try {
    text = await response.text();
    
    // Check actual size after reading
    const actualSize = new Blob([text]).size;
    if (actualSize > CONFIG.MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `Content is too large (${formatFileSize(actualSize)}). Maximum allowed size is ${formatFileSize(CONFIG.MAX_FILE_SIZE_BYTES)}.`
      );
    }
  } catch (error) {
    throw new Error(
      `Failed to read response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `The response does not contain valid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Validate against schema
  try {
    return AppStateSchema.parse(parsed);
  } catch (error) {
    throw new Error(
      `The response is not a valid project file. It does not match the expected format: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
