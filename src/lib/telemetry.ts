import { ApplicationInsights } from "@microsoft/applicationinsights-web";

let appInsights: ApplicationInsights | null = null;

/**
 * Initialise Application Insights once using the connection string stored in
 * VITE_APPINSIGHTS_CONNECTION_STRING.  When the variable is absent the module
 * is a complete no-op so the app works identically without it.
 */
export function initTelemetry(): void {
  const connectionString = import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING as
    | string
    | undefined;

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
