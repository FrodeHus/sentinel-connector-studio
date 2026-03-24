import { ApplicationInsights } from "@microsoft/applicationinsights-web";

let appInsights: ApplicationInsights | null = null;

declare global {
  interface Window {
    __APP_CONFIG__?: {
      appInsightsConnectionString?: string;
    };
  }
}

/**
 * Initialise Application Insights once.  The connection string is resolved in
 * priority order:
 *   1. VITE_APPINSIGHTS_CONNECTION_STRING — baked in at build time (dev / CI
 *      builds where the var is available during `vite build`).
 *   2. window.__APP_CONFIG__.appInsightsConnectionString — injected at
 *      container start by docker-entrypoint.sh from the runtime env var
 *      APPINSIGHTS_CONNECTION_STRING (used with pre-built Docker images where
 *      the value cannot be baked in at build time).
 *
 * When neither source provides a value the module is a complete no-op so the
 * app works identically without it.
 */
export function initTelemetry(): void {
  // || is intentional: an empty build-time value means "not configured", so
  // we fall through to the runtime window.__APP_CONFIG__ in that case too.
  const connectionString =
    (import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING as string | undefined) ||
    (typeof window !== "undefined"
      ? window.__APP_CONFIG__?.appInsightsConnectionString
      : undefined);

  if (!connectionString) {
    return;
  }

  if (appInsights) {
    return;
  }

  appInsights = new ApplicationInsights({
    config: {
      connectionString,
      enableAutoRouteTracking: false, // we handle route tracking manually
      disableFetchTracking: false,
      enableCorsCorrelation: false,
    },
  });

  appInsights.loadAppInsights();
}

/** Track a page view.  Safe to call even when telemetry is not initialised. */
export function trackPageView(name?: string, uri?: string): void {
  appInsights?.trackPageView({ name, uri });
}

/** Track a custom event.  Safe to call even when telemetry is not initialised. */
export function trackEvent(
  name: string,
  properties?: Record<string, string | number | boolean>,
): void {
  appInsights?.trackEvent({ name }, properties);
}

/** Flush buffered telemetry (e.g. before unload). */
export function flushTelemetry(): void {
  appInsights?.flush();
}

/** Returns the underlying ApplicationInsights instance (may be null). */
export function getAppInsights(): ApplicationInsights | null {
  return appInsights;
}
