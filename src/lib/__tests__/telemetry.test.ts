import { describe, it, expect, beforeEach, vi } from "vitest"

// ---------------------------------------------------------------------------
// Mock @microsoft/applicationinsights-web before importing the module under test
// ---------------------------------------------------------------------------

const mockFlush = vi.fn()
const mockTrackPageView = vi.fn()
const mockTrackEvent = vi.fn()
const mockLoadAppInsights = vi.fn()

vi.mock("@microsoft/applicationinsights-web", () => {
  class MockApplicationInsights {
    loadAppInsights = mockLoadAppInsights
    flush = mockFlush
    trackPageView = mockTrackPageView
    trackEvent = mockTrackEvent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(_cfg: any) {}
  }
  return { ApplicationInsights: MockApplicationInsights }
})

// ---------------------------------------------------------------------------
// Reset module state and import.meta.env between tests
// ---------------------------------------------------------------------------

describe("telemetry", () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it("does not initialise when VITE_APPINSIGHTS_CONNECTION_STRING is absent", async () => {
    vi.stubEnv("VITE_APPINSIGHTS_CONNECTION_STRING", "")

    const { initTelemetry, getAppInsights } = await import("@/lib/telemetry")
    initTelemetry()
    expect(getAppInsights()).toBeNull()
  })

  it("initialises via window.__APP_CONFIG__ when build-time env var is absent", async () => {
    vi.stubEnv("VITE_APPINSIGHTS_CONNECTION_STRING", "")
    vi.stubGlobal("window", {
      __APP_CONFIG__: {
        appInsightsConnectionString:
          "InstrumentationKey=runtime-key;IngestionEndpoint=https://example.com/",
      },
    })

    const { initTelemetry, getAppInsights } = await import("@/lib/telemetry")
    initTelemetry()
    expect(getAppInsights()).not.toBeNull()
    expect(mockLoadAppInsights).toHaveBeenCalledTimes(1)
  })

  it("build-time env var takes priority over window.__APP_CONFIG__", async () => {
    vi.stubEnv(
      "VITE_APPINSIGHTS_CONNECTION_STRING",
      "InstrumentationKey=build-key;IngestionEndpoint=https://example.com/",
    )
    vi.stubGlobal("window", {
      __APP_CONFIG__: {
        appInsightsConnectionString:
          "InstrumentationKey=runtime-key;IngestionEndpoint=https://example.com/",
      },
    })

    const { initTelemetry, getAppInsights } = await import("@/lib/telemetry")
    initTelemetry()
    expect(getAppInsights()).not.toBeNull()
    expect(mockLoadAppInsights).toHaveBeenCalledTimes(1)
  })

  it("initialises Application Insights when connection string is provided", async () => {
    vi.stubEnv(
      "VITE_APPINSIGHTS_CONNECTION_STRING",
      "InstrumentationKey=test-key;IngestionEndpoint=https://example.com/",
    )

    const { initTelemetry, getAppInsights } = await import("@/lib/telemetry")
    initTelemetry()
    expect(getAppInsights()).not.toBeNull()
    expect(mockLoadAppInsights).toHaveBeenCalledTimes(1)
  })

  it("does not reinitialise on subsequent calls", async () => {
    vi.stubEnv(
      "VITE_APPINSIGHTS_CONNECTION_STRING",
      "InstrumentationKey=test-key;IngestionEndpoint=https://example.com/",
    )

    const { initTelemetry } = await import("@/lib/telemetry")
    initTelemetry()
    initTelemetry()
    expect(mockLoadAppInsights).toHaveBeenCalledTimes(1)
  })

  it("trackPageView is a no-op when not initialised", async () => {
    vi.stubEnv("VITE_APPINSIGHTS_CONNECTION_STRING", "")

    const { initTelemetry, trackPageView } = await import("@/lib/telemetry")
    initTelemetry()
    expect(() => trackPageView("/")).not.toThrow()
    expect(mockTrackPageView).not.toHaveBeenCalled()
  })

  it("trackPageView calls appInsights.trackPageView when initialised", async () => {
    vi.stubEnv(
      "VITE_APPINSIGHTS_CONNECTION_STRING",
      "InstrumentationKey=test-key;IngestionEndpoint=https://example.com/",
    )

    const { initTelemetry, trackPageView } = await import("@/lib/telemetry")
    initTelemetry()
    trackPageView("Home", "/")
    expect(mockTrackPageView).toHaveBeenCalledWith({ name: "Home", uri: "/" })
  })

  it("trackEvent is a no-op when not initialised", async () => {
    vi.stubEnv("VITE_APPINSIGHTS_CONNECTION_STRING", "")

    const { initTelemetry, trackEvent } = await import("@/lib/telemetry")
    initTelemetry()
    expect(() => trackEvent("test-event")).not.toThrow()
    expect(mockTrackEvent).not.toHaveBeenCalled()
  })

  it("trackEvent calls appInsights.trackEvent when initialised", async () => {
    vi.stubEnv(
      "VITE_APPINSIGHTS_CONNECTION_STRING",
      "InstrumentationKey=test-key;IngestionEndpoint=https://example.com/",
    )

    const { initTelemetry, trackEvent } = await import("@/lib/telemetry")
    initTelemetry()
    trackEvent("wizard-complete", { step: 8 })
    expect(mockTrackEvent).toHaveBeenCalledWith(
      { name: "wizard-complete" },
      { step: 8 },
    )
  })

  it("flushTelemetry is a no-op when not initialised", async () => {
    vi.stubEnv("VITE_APPINSIGHTS_CONNECTION_STRING", "")

    const { initTelemetry, flushTelemetry } = await import("@/lib/telemetry")
    initTelemetry()
    expect(() => flushTelemetry()).not.toThrow()
    expect(mockFlush).not.toHaveBeenCalled()
  })
})
