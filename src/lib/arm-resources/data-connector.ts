import type { Meta, DataFlow, PollerConfig, PollerAuth, PollerRequest, PollerResponse, PollerPaging } from "../schemas"
import {
  connectorIdToConnectorDefName,
  connectorIdToConnectorConfigName,
} from "../naming";

function buildAuthSection(auth: PollerAuth) {
  switch (auth.type) {
    case "Basic":
      return {
        type: "Basic",
        userName: auth.userName,
        password: auth.password,
      }
    case "APIKey": {
      const result: Record<string, unknown> = {
        type: "APIKey",
        apiKey: auth.apiKey,
        apiKeyName: auth.apiKeyName,
      }
      if (auth.apiKeyIdentifier) result.apiKeyIdentifier = auth.apiKeyIdentifier
      if (auth.isApiKeyInPostPayload) result.isApiKeyInPostPayload = true
      return result
    }
    case "OAuth2": {
      const result: Record<string, unknown> = {
        type: "OAuth2",
        clientId: auth.clientId,
        clientSecret: auth.clientSecret,
        grantType: auth.grantType,
        tokenEndpointUrl: auth.tokenEndpointUrl,
      }
      if (auth.scope) result.scope = auth.scope
      if (auth.tokenEndpointHeaders && Object.keys(auth.tokenEndpointHeaders).length > 0) {
        result.tokenEndpointHeaders = auth.tokenEndpointHeaders
      }
      if (auth.tokenEndpointQueryParameters && Object.keys(auth.tokenEndpointQueryParameters).length > 0) {
        result.tokenEndpointQueryParameters = auth.tokenEndpointQueryParameters
      }
      if (auth.grantType === "authorization_code") {
        if (auth.authorizationEndpoint) result.authorizationEndpoint = auth.authorizationEndpoint
        if (auth.redirectUri) result.redirectUri = auth.redirectUri
        if (auth.authorizationEndpointQueryParameters && Object.keys(auth.authorizationEndpointQueryParameters).length > 0) {
          result.authorizationEndpointQueryParameters = auth.authorizationEndpointQueryParameters
        }
      }
      return result
    }
  }
}

function buildRequestSection(request: PollerRequest) {
  const result: Record<string, unknown> = {
    apiEndpoint: request.apiEndpoint,
    httpMethod: request.httpMethod,
    queryWindowInMin: request.queryWindowInMin,
    queryTimeFormat: request.queryTimeFormat,
    rateLimitQPS: request.rateLimitQPS,
    retryCount: request.retryCount,
    timeoutInSeconds: request.timeoutInSeconds,
  }
  if (request.startTimeAttributeName) result.startTimeAttributeName = request.startTimeAttributeName
  if (request.endTimeAttributeName) result.endTimeAttributeName = request.endTimeAttributeName
  if (request.headers && Object.keys(request.headers).length > 0) result.headers = request.headers
  if (request.queryParameters && Object.keys(request.queryParameters).length > 0) result.queryParameters = request.queryParameters
  if (request.queryParametersTemplate) result.queryParametersTemplate = request.queryParametersTemplate
  if (request.httpMethod === "POST" && request.isPostPayloadJson !== undefined) {
    result.isPostPayloadJson = request.isPostPayloadJson
  }
  return result
}

function buildResponseSection(response: PollerResponse) {
  const result: Record<string, unknown> = {
    eventsJsonPaths: response.eventsJsonPaths,
    format: response.format,
  }
  if (response.successStatusJsonPath) result.successStatusJsonPath = response.successStatusJsonPath
  if (response.successStatusValue) result.successStatusValue = response.successStatusValue
  if (response.isGzipCompressed) result.isGzipCompressed = true
  if (response.convertChildPropertiesToArray) result.convertChildPropertiesToArray = true
  return result
}

function buildPagingSection(paging: PollerPaging) {
  const result: Record<string, unknown> = {
    pagingType: paging.pagingType,
  }
  if (paging.nextPageParaName) result.nextPageParaName = paging.nextPageParaName
  if (paging.nextPageTokenJsonPath) result.nextPageTokenJsonPath = paging.nextPageTokenJsonPath
  if (paging.nextPageUrl) result.nextPageUrl = paging.nextPageUrl
  if (paging.hasNextFlagJsonPath) result.hasNextFlagJsonPath = paging.hasNextFlagJsonPath
  if (paging.nextPageRequestHeader) result.nextPageRequestHeader = paging.nextPageRequestHeader
  if (paging.pageSizeParaName) result.pageSizeParaName = paging.pageSizeParaName
  if (paging.pageSize) result.pageSize = paging.pageSize
  return result
}

function generatePushDataConnector(
  connectorConfigName: string,
  connectorDefName: string,
  dataFlow: DataFlow,
) {
  return {
    name: connectorConfigName,
    apiVersion: "2024-09-01",
    type: "Microsoft.SecurityInsights/dataConnectors",
    kind: "Push",
    properties: {
      connectorDefinitionName: connectorDefName,
      dcrConfig: {
        streamName: dataFlow.streamName,
        dataCollectionEndpoint:
          "[[parameters('dcrConfig').dataCollectionEndpoint]",
        dataCollectionRuleImmutableId:
          "[[parameters('dcrConfig').dataCollectionRuleImmutableId]",
      },
      auth: {
        type: "Push",
        AppId: "[[parameters('auth').appId]",
        ServicePrincipalId: "[[parameters('auth').servicePrincipalId]",
      },
      request: {
        RetryCount: 1,
      },
      response: {
        eventsJsonPaths: ["$"],
      },
    },
  }
}

function generatePullDataConnector(
  connectorConfigName: string,
  connectorDefName: string,
  dataFlow: DataFlow,
  pollerConfig: PollerConfig,
) {
  const properties: Record<string, unknown> = {
    connectorDefinitionName: connectorDefName,
    dcrConfig: {
      streamName: dataFlow.streamName,
      dataCollectionEndpoint:
        "[[parameters('dcrConfig').dataCollectionEndpoint]",
      dataCollectionRuleImmutableId:
        "[[parameters('dcrConfig').dataCollectionRuleImmutableId]",
    },
    auth: buildAuthSection(pollerConfig.auth),
    request: buildRequestSection(pollerConfig.request),
    response: buildResponseSection(pollerConfig.response),
  }

  if (pollerConfig.paging.pagingType !== "None") {
    properties.paging = buildPagingSection(pollerConfig.paging)
  }

  return {
    name: connectorConfigName,
    apiVersion: "2024-09-01",
    type: "Microsoft.SecurityInsights/dataConnectors",
    kind: "RestApiPoller",
    properties,
  }
}

export function generateDataConnector(
  meta: Meta,
  dataFlow: DataFlow,
  pollerConfig?: PollerConfig,
) {
  const connectorDefName = connectorIdToConnectorDefName(meta.connectorId, meta.connectorKind);
  const connectorConfigName = connectorIdToConnectorConfigName(meta.connectorId, meta.connectorKind);

  if (meta.connectorKind === "RestApiPoller" && pollerConfig) {
    return generatePullDataConnector(connectorConfigName, connectorDefName, dataFlow, pollerConfig)
  }
  return generatePushDataConnector(connectorConfigName, connectorDefName, dataFlow)
}
