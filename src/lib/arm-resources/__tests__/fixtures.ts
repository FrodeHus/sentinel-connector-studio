import type { Meta, TableSchema, DataFlow, ConnectorUI, PollerConfig } from "@/lib/schemas"
import { PollerConfigSchema } from "@/lib/schemas"

// ── Meta fixtures ──────────────────────────────────────────────────────────────

export const pushMeta: Meta = {
  connectorId: "TestConnector",
  title: "Test Connector",
  publisher: "TestPublisher",
  descriptionMarkdown: "Test description",
  logo: "",
  connectorKind: "Push" as const,
}

export const pullMeta: Meta = {
  ...pushMeta,
  connectorKind: "RestApiPoller" as const,
}

export const pushMetaWithLogo: Meta = {
  ...pushMeta,
  logo: "<svg>test</svg>",
}

// ── Table schema fixture ───────────────────────────────────────────────────────

export const testSchema: TableSchema = {
  tableName: "TestConnector_CL",
  columns: [
    { name: "TimeGenerated", type: "datetime" },
    { name: "Message", type: "string" },
    { name: "Severity", type: "int" },
  ],
}

// ── Data flow fixtures ─────────────────────────────────────────────────────────

export const testDataFlow: DataFlow = {
  streamName: "Custom-TestConnector",
  transformKql: "source | extend TimeGenerated = now()",
  inputColumnsOverride: false,
  inputColumns: [],
}

export const testDataFlowWithOverride: DataFlow = {
  ...testDataFlow,
  inputColumnsOverride: true,
  inputColumns: [
    { name: "msg", type: "string" },
    { name: "sev", type: "int" },
  ],
}

// ── Connector UI fixtures ──────────────────────────────────────────────────────

export const testConnectorUI: ConnectorUI = {
  graphQueries: [
    {
      metricName: "Total events",
      legend: "Events",
      baseQuery: "{{graphQueriesTableName}}",
    },
  ],
  sampleQueries: [
    {
      description: "All events",
      query: "TestConnector_CL | take 10",
    },
  ],
  connectivityCriteria: [
    {
      type: "IsConnectedQuery",
      value: ["TestConnector_CL | summarize max(TimeGenerated)"],
    },
  ],
  isConnectivityCriteriasMatchSome: false,
  permissions: {
    resourceProvider: [
      {
        provider: "Microsoft.OperationalInsights/workspaces",
        permissionsDisplayText: "Read and Write",
        providerDisplayName: "Workspace",
        scope: "Workspace",
        requiredPermissions: {
          write: true,
          read: true,
          delete: false,
          action: false,
        },
      },
    ],
    customs: [
      {
        name: "API Key",
        description: "Required",
      },
    ],
  },
  instructionSteps: [
    {
      title: "Connect",
      description: "Follow steps",
      instructions: [
        {
          type: "Markdown",
          parameters: { content: "Hello" },
        },
      ],
    },
  ],
}

export const pullConnectorUI: ConnectorUI = {
  ...testConnectorUI,
  connectivityCriteria: [
    {
      type: "HasDataConnectors",
      value: [],
    },
  ],
}

// ── Poller config fixtures ─────────────────────────────────────────────────────

const pollerDefaults = PollerConfigSchema.parse({})

export const basicPollerConfig: PollerConfig = {
  ...pollerDefaults,
  auth: {
    ...pollerDefaults.auth,
    type: "Basic" as const,
  },
  request: {
    ...pollerDefaults.request,
    apiEndpoint: "https://api.example.com/events",
  },
}

export const apiKeyPollerConfig: PollerConfig = {
  ...pollerDefaults,
  auth: {
    ...pollerDefaults.auth,
    type: "APIKey" as const,
    apiKey: "{{apiKey}}",
    apiKeyName: "Authorization",
    apiKeyIdentifier: "Bearer",
    isApiKeyInPostPayload: false,
  },
  request: {
    ...pollerDefaults.request,
    apiEndpoint: "https://api.example.com/events",
  },
}

export const oauth2ClientCredsPollerConfig: PollerConfig = {
  ...pollerDefaults,
  auth: {
    ...pollerDefaults.auth,
    type: "OAuth2" as const,
    clientId: "{{clientId}}",
    clientSecret: "{{clientSecret}}",
    grantType: "client_credentials" as const,
    tokenEndpointUrl: "https://auth.example.com/token",
    scope: "read",
  },
  request: {
    ...pollerDefaults.request,
    apiEndpoint: "https://api.example.com/events",
  },
}

export const oauth2AuthCodePollerConfig: PollerConfig = {
  ...pollerDefaults,
  auth: {
    ...pollerDefaults.auth,
    type: "OAuth2" as const,
    clientId: "{{clientId}}",
    clientSecret: "{{clientSecret}}",
    grantType: "authorization_code" as const,
    tokenEndpointUrl: "https://auth.example.com/token",
    scope: "read",
    authorizationEndpoint: "https://auth.example.com/authorize",
    redirectUri: "https://portal.azure.com/TokenAuthorize/ExtensionName/DataConnectors",
    authorizationEndpointQueryParameters: { response_type: "code" },
  },
  request: {
    ...pollerDefaults.request,
    apiEndpoint: "https://api.example.com/events",
  },
}

export const nextPageTokenPollerConfig: PollerConfig = {
  ...basicPollerConfig,
  paging: {
    ...pollerDefaults.paging,
    pagingType: "NextPageToken" as const,
    nextPageTokenJsonPath: "$.nextToken",
    nextPageParaName: "cursor",
  },
}

export const offsetPollerConfig: PollerConfig = {
  ...basicPollerConfig,
  paging: {
    ...pollerDefaults.paging,
    pagingType: "Offset" as const,
    pageSize: 100,
    pageSizeParaName: "limit",
  },
}
