import { describe, it, expect } from "vitest"
import { generateDataConnector } from "@/lib/arm-resources/data-connector"
import {
  pushMeta,
  pullMeta,
  testDataFlow,
  basicPollerConfig,
  apiKeyPollerConfig,
  oauth2ClientCredsPollerConfig,
  oauth2AuthCodePollerConfig,
  nextPageTokenPollerConfig,
  offsetPollerConfig,
} from "./fixtures"

describe("Push connector", () => {
  const result = generateDataConnector(pushMeta, testDataFlow)

  it("kind is Push", () => {
    expect(result.kind).toBe("Push")
  })

  it("name is TestConnectorPushConnector", () => {
    expect(result.name).toBe("TestConnectorPushConnector")
  })

  it("connectorDefinitionName is TestConnectorPush", () => {
    expect(result.properties.connectorDefinitionName).toBe("TestConnectorPush")
  })

  it("dcrConfig.streamName matches testDataFlow.streamName", () => {
    expect(result.properties.dcrConfig.streamName).toBe("Custom-TestConnector")
  })

  it("dcrConfig uses [[parameters escape syntax for dataCollectionEndpoint and dataCollectionRuleImmutableId", () => {
    expect(result.properties.dcrConfig.dataCollectionEndpoint).toBe(
      "[[parameters('dcrConfig').dataCollectionEndpoint]",
    )
    expect(result.properties.dcrConfig.dataCollectionRuleImmutableId).toBe(
      "[[parameters('dcrConfig').dataCollectionRuleImmutableId]",
    )
  })

  it("auth.type is Push with AppId and ServicePrincipalId ARM parameters", () => {
    expect(result.properties.auth).toEqual({
      type: "Push",
      AppId: "[[parameters('auth').appId]",
      ServicePrincipalId: "[[parameters('auth').servicePrincipalId]",
    })
  })

  it("request.RetryCount is 1", () => {
    expect(result.properties.request.RetryCount).toBe(1)
  })

  it("response.eventsJsonPaths is ['$']", () => {
    expect(result.properties.response.eventsJsonPaths).toEqual(["$"])
  })
})

describe("Pull connector — Basic auth", () => {
  const result = generateDataConnector(pullMeta, testDataFlow, basicPollerConfig)

  it("kind is RestApiPoller", () => {
    expect(result.kind).toBe("RestApiPoller")
  })

  it("name is TestConnectorPollerConnector", () => {
    expect(result.name).toBe("TestConnectorPollerConnector")
  })

  it("connectorDefinitionName is TestConnectorPoller", () => {
    expect(result.properties.connectorDefinitionName).toBe("TestConnectorPoller")
  })

  it("auth includes type Basic and userName/password from fixture defaults", () => {
    expect(result.properties.auth).toEqual({
      type: "Basic",
      userName: "{{username}}",
      password: "{{password}}",
    })
  })
})

describe("Pull connector — request section", () => {
  const result = generateDataConnector(pullMeta, testDataFlow, basicPollerConfig)

  it("request includes apiEndpoint, httpMethod, queryWindowInMin, queryTimeFormat, rateLimitQPS, retryCount, timeoutInSeconds with correct defaults", () => {
    expect(result.properties.request).toEqual({
      apiEndpoint: "https://api.example.com/events",
      httpMethod: "GET",
      queryWindowInMin: 5,
      queryTimeFormat: "yyyy-MM-ddTHH:mm:ssZ",
      rateLimitQPS: 10,
      retryCount: 3,
      timeoutInSeconds: 60,
    })
  })

  it("response includes eventsJsonPaths and format json", () => {
    expect(result.properties.response).toEqual({
      eventsJsonPaths: ["$"],
      format: "json",
    })
  })
})

describe("Pull connector — APIKey auth", () => {
  const result = generateDataConnector(pullMeta, testDataFlow, apiKeyPollerConfig)

  it("auth.type is APIKey with apiKey and apiKeyName", () => {
    expect(result.properties.auth).toHaveProperty("type", "APIKey")
    expect(result.properties.auth).toHaveProperty("apiKey", "{{apiKey}}")
    expect(result.properties.auth).toHaveProperty("apiKeyName", "Authorization")
  })

  it("auth includes apiKeyIdentifier Bearer since fixture has it non-empty", () => {
    expect(result.properties.auth).toHaveProperty("apiKeyIdentifier", "Bearer")
  })

  it("auth does NOT include isApiKeyInPostPayload since fixture has it as false", () => {
    expect(result.properties.auth).not.toHaveProperty("isApiKeyInPostPayload")
  })
})

describe("Pull connector — OAuth2 client_credentials", () => {
  const result = generateDataConnector(pullMeta, testDataFlow, oauth2ClientCredsPollerConfig)

  it("auth.type is OAuth2 with clientId, clientSecret, grantType, tokenEndpointUrl", () => {
    expect(result.properties.auth).toHaveProperty("type", "OAuth2")
    expect(result.properties.auth).toHaveProperty("clientId", "{{clientId}}")
    expect(result.properties.auth).toHaveProperty("clientSecret", "{{clientSecret}}")
    expect(result.properties.auth).toHaveProperty("grantType", "client_credentials")
    expect(result.properties.auth).toHaveProperty("tokenEndpointUrl", "https://auth.example.com/token")
  })

  it("auth includes scope read", () => {
    expect(result.properties.auth).toHaveProperty("scope", "read")
  })

  it("auth does NOT include authorization_code flow fields", () => {
    expect(result.properties.auth).not.toHaveProperty("authorizationEndpoint")
    expect(result.properties.auth).not.toHaveProperty("redirectUri")
    expect(result.properties.auth).not.toHaveProperty("authorizationEndpointQueryParameters")
  })
})

describe("Pull connector — OAuth2 authorization_code", () => {
  const result = generateDataConnector(pullMeta, testDataFlow, oauth2AuthCodePollerConfig)

  it("auth includes authorizationEndpoint and redirectUri", () => {
    expect(result.properties.auth).toHaveProperty(
      "authorizationEndpoint",
      "https://auth.example.com/authorize",
    )
    expect(result.properties.auth).toHaveProperty(
      "redirectUri",
      "https://portal.azure.com/TokenAuthorize/ExtensionName/DataConnectors",
    )
  })

  it("auth includes authorizationEndpointQueryParameters", () => {
    expect(result.properties.auth).toHaveProperty("authorizationEndpointQueryParameters", {
      response_type: "code",
    })
  })
})

describe("Pull connector — Paging", () => {
  it("no paging property when pagingType is None", () => {
    const result = generateDataConnector(pullMeta, testDataFlow, basicPollerConfig)
    expect(result.properties).not.toHaveProperty("paging")
  })

  it("NextPageToken includes pagingType, nextPageTokenJsonPath, nextPageParaName", () => {
    const result = generateDataConnector(pullMeta, testDataFlow, nextPageTokenPollerConfig)
    expect(result.properties.paging).toEqual({
      pagingType: "NextPageToken",
      nextPageTokenJsonPath: "$.nextToken",
      nextPageParaName: "cursor",
    })
  })

  it("Offset includes pagingType, pageSize, pageSizeParaName", () => {
    const result = generateDataConnector(pullMeta, testDataFlow, offsetPollerConfig)
    expect(result.properties.paging).toEqual({
      pagingType: "Offset",
      pageSize: 100,
      pageSizeParaName: "limit",
    })
  })
})

describe("Fallback behavior", () => {
  it("when meta.connectorKind is RestApiPoller but pollerConfig is undefined, output kind is Push", () => {
    const result = generateDataConnector(pullMeta, testDataFlow, undefined)
    expect(result.kind).toBe("Push")
  })
})
