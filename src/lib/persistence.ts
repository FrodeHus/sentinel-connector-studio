import type { ConnectorConfig } from "./schemas"

const STORAGE_KEY = "sentinel-ccf-builder-config"

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function saveConfig(config: ConnectorConfig): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // localStorage may be unavailable (private browsing) or full — config is still
      // held in memory for the current session, so the user can still export.
    }
  }, 500);
}

export function loadConfig(): ConnectorConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as ConnectorConfig;
  } catch {
    // JSON.parse throws if the stored value is corrupt; treat as no saved config.
    return null;
  }
}

export function clearConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable in this context — no-op, nothing to clear.
  }
}

export function exportConfig(config: ConnectorConfig): string {
  return JSON.stringify(config, null, 2)
}

export function importConfig(json: string): ConnectorConfig | null {
  try {
    return JSON.parse(json) as ConnectorConfig
  } catch {
    return null
  }
}
