import { z } from "zod"

export const columnTypes = [
  "string", "int", "long", "real", "bool", "datetime", "dynamic", "guid"
] as const

export type ColumnType = typeof columnTypes[number]

export const ColumnSchema = z.object({
  name: z.string(),
  type: z.enum(columnTypes),
})

// Connector kind
export const ConnectorKindSchema = z.enum(["Push", "RestApiPoller"]).default("Push")

// Lenient schemas for state storage — no strict validation, just shape
export const MetaSchema = z.object({
  connectorId: z.string().default(""),
  title: z.string().default(""),
  publisher: z.string().default(""),
  descriptionMarkdown: z.string().default(""),
  logo: z.string().optional().default(""),
  connectorKind: ConnectorKindSchema,
})

export const TableSchemaSchema = z.object({
  tableName: z.string().default(""),
  columns: z.array(ColumnSchema).default([{ name: "TimeGenerated", type: "datetime" }]),
})

export const DataFlowSchema = z.object({
  streamName: z.string().default(""),
  transformKql: z.string().default("source | extend TimeGenerated = now()"),
  inputColumnsOverride: z.boolean().default(false),
  inputColumns: z.array(ColumnSchema).optional().default([]),
})

export const GraphQuerySchema = z.object({
  metricName: z.string(),
  legend: z.string(),
  baseQuery: z.string(),
})

export const SampleQuerySchema = z.object({
  description: z.string(),
  query: z.string(),
})

export const ConnectivityCriteriaSchema = z.object({
  type: z.string().default("IsConnectedQuery"),
  value: z.array(z.string()),
})

export const ResourceProviderPermission = z.object({
  provider: z.string(),
  permissionsDisplayText: z.string(),
  providerDisplayName: z.string(),
  scope: z.string(),
  requiredPermissions: z.object({
    write: z.boolean().default(false),
    read: z.boolean().default(false),
    delete: z.boolean().default(false),
    action: z.boolean().default(false),
  }),
})

export const CustomPermission = z.object({
  name: z.string(),
  description: z.string(),
})

export const PermissionsSchema = z.object({
  resourceProvider: z.array(ResourceProviderPermission).default([]),
  customs: z.array(CustomPermission).optional().default([]),
})

export const InstructionSchema = z.object({
  type: z.enum([
    "Markdown",
    "CopyableLabel",
    "DeployPushConnectorButton",
    "ConnectionToggleButton",
    "Textbox",
    "OAuthForm",
    "Dropdown",
    "InfoMessage",
    "InstructionStepsGroup",
    "InstallAgent",
  ]),
  parameters: z.record(z.unknown()).default({}),
})

export const InstructionStepSchema = z.object({
  title: z.string(),
  description: z.string().default(""),
  instructions: z.array(InstructionSchema).default([]),
})

export const ConnectorUISchema = z.object({
  graphQueries: z.array(GraphQuerySchema).default([]),
  sampleQueries: z.array(SampleQuerySchema).default([]),
  connectivityCriteria: z.array(ConnectivityCriteriaSchema).default([]),
  isConnectivityCriteriasMatchSome: z.boolean().default(false),
  permissions: PermissionsSchema.default({
    resourceProvider: [],
    customs: [],
  }),
  instructionSteps: z.array(InstructionStepSchema).default([]),
})

export const SolutionSchema = z.object({
  name: z.string().default(""),
  publisherId: z.string().default(""),
  offerId: z.string().default(""),
  version: z.string().default("1.0.0"),
  categories: z
    .object({
      domains: z.array(z.string()).default(["Security - Threat Protection"]),
      verticals: z.array(z.string()).default([]),
    })
    .default({
      domains: ["Security - Threat Protection"],
      verticals: [],
    }),
  support: z
    .object({
      name: z.string().default(""),
      email: z.string().default(""),
      tier: z.enum(["Microsoft", "Partner", "Community"]).default("Partner"),
      link: z.string().default(""),
    })
    .default({
      name: "",
      email: "",
      tier: "Partner",
      link: "",
    }),
  firstPublishDate: z.string().default(() => new Date().toISOString().split("T")[0]),
});

// --- Analytic Rules, Hunting Queries & ASIM Parsers ---

export const EntityFieldMappingSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  identifier: z.string().default(""),
  columnName: z.string().default(""),
})

export const EntityMappingSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  entityType: z.string().default(""),
  fieldMappings: z.array(EntityFieldMappingSchema).default([]),
})

export const RequiredDataConnectorSchema = z.object({
  connectorId: z.string().default(""),
  dataTypes: z.array(z.string()).default([]),
})

export const AnalyticRuleSchema = z.object({
  id: z.string().default(""),
  name: z.string().default(""),
  description: z.string().default(""),
  severity: z.enum(["High", "Medium", "Low", "Informational"]).default("Medium"),
  kind: z.enum(["Scheduled", "NRT"]).default("Scheduled"),
  queryPeriod: z.string().default("PT5H"),
  queryFrequency: z.string().default("PT5H"),
  triggerOperator: z.enum(["GreaterThan", "LessThan", "Equal", "NotEqual"]).default("GreaterThan"),
  triggerThreshold: z.number().default(0),
  tactics: z.array(z.string()).default([]),
  relevantTechniques: z.array(z.string()).default([]),
  query: z.string().default(""),
  entityMappings: z.array(EntityMappingSchema).default([]),
  requiredDataConnectors: z.array(RequiredDataConnectorSchema).default([]),
  version: z.string().default("1.0.0"),
  enabled: z.boolean().default(true),
})

export const HuntingQuerySchema = z.object({
  id: z.string().default(""),
  name: z.string().default(""),
  description: z.string().default(""),
  tactics: z.array(z.string()).default([]),
  relevantTechniques: z.array(z.string()).default([]),
  query: z.string().default(""),
  entityMappings: z.array(EntityMappingSchema).default([]),
  requiredDataConnectors: z.array(RequiredDataConnectorSchema).default([]),
  version: z.string().default("1.0.0"),
})

export const AsimParserSchema = z.object({
  id: z.string().default(""),
  name: z.string().default(""),
  targetSchema: z.string().default(""),
  query: z.string().default(""),
  version: z.string().default("1.0.0"),
})

export const WorkbookSchema = z.object({
  id: z.string().default(""),
  name: z.string().default(""),
  description: z.string().default(""),
  fromTemplateId: z.string().default(""),
  serializedData: z.string().default(""),
  version: z.string().default("1.0"),
})

// --- REST API Poller (pull) connector schemas ---

export const PollerAuthTypeSchema = z.enum(["Basic", "APIKey", "OAuth2"]).default("Basic")

export const PollerAuthSchema = z.object({
  type: PollerAuthTypeSchema,
  // Basic
  userName: z.string().default("{{username}}"),
  password: z.string().default("{{password}}"),
  // APIKey
  apiKey: z.string().default("{{apiKey}}"),
  apiKeyName: z.string().default(""),
  apiKeyIdentifier: z.string().default(""),
  isApiKeyInPostPayload: z.boolean().default(false),
  // OAuth2
  clientId: z.string().default("{{clientId}}"),
  clientSecret: z.string().default("{{clientSecret}}"),
  grantType: z.enum(["client_credentials", "authorization_code"]).default("client_credentials"),
  tokenEndpointUrl: z.string().default(""),
  scope: z.string().default(""),
  tokenEndpointHeaders: z.record(z.string()).optional().default({}),
  tokenEndpointQueryParameters: z.record(z.string()).optional().default({}),
  authorizationEndpoint: z.string().default(""),
  authorizationEndpointQueryParameters: z.record(z.string()).optional().default({}),
  redirectUri: z.string().default(""),
})

export const PollerRequestSchema = z.object({
  apiEndpoint: z.string().default(""),
  httpMethod: z.enum(["GET", "POST"]).default("GET"),
  startTimeAttributeName: z.string().default(""),
  endTimeAttributeName: z.string().default(""),
  queryWindowInMin: z.number().default(5),
  queryTimeFormat: z.string().default("yyyy-MM-ddTHH:mm:ssZ"),
  rateLimitQPS: z.number().default(10),
  retryCount: z.number().default(3),
  timeoutInSeconds: z.number().default(60),
  headers: z.record(z.string()).optional().default({}),
  queryParameters: z.record(z.string()).optional().default({}),
  queryParametersTemplate: z.string().default(""),
  isPostPayloadJson: z.boolean().default(true),
})

export const PollerResponseSchema = z.object({
  eventsJsonPaths: z.array(z.string()).default(["$"]),
  successStatusJsonPath: z.string().default(""),
  successStatusValue: z.string().default(""),
  isGzipCompressed: z.boolean().default(false),
  format: z.enum(["json", "csv", "xml"]).default("json"),
  convertChildPropertiesToArray: z.boolean().default(false),
})

export const PagingTypeSchema = z.enum([
  "None",
  "LinkHeader",
  "NextPageUrl",
  "NextPageToken",
  "Offset",
  "PersistentToken",
  "PersistentLink",
]).default("None")

export const PollerPagingSchema = z.object({
  pagingType: PagingTypeSchema,
  nextPageParaName: z.string().default(""),
  nextPageTokenJsonPath: z.string().default(""),
  nextPageUrl: z.string().default(""),
  hasNextFlagJsonPath: z.string().default(""),
  nextPageRequestHeader: z.string().default(""),
  pageSizeParaName: z.string().default(""),
  pageSize: z.number().default(0),
})

export const PollerConfigSchema = z.object({
  auth: PollerAuthSchema.default({}),
  request: PollerRequestSchema.default({}),
  response: PollerResponseSchema.default({}),
  paging: PollerPagingSchema.default({}),
})

export const ConnectorConfigSchema = z.object({
  meta: MetaSchema.default({}),
  schema: TableSchemaSchema.default({}),
  dataFlow: DataFlowSchema.default({}),
  connectorUI: ConnectorUISchema.default({}),
  pollerConfig: PollerConfigSchema.optional(),
  solution: SolutionSchema.default({}),
})

// --- Strict validation schemas for step gating ---

export const MetaValidation = z.object({
  connectorId: z.string().min(3, "Connector ID must be at least 3 characters").regex(/^[a-zA-Z][a-zA-Z0-9]*$/, "Must start with a letter, alphanumeric only"),
  title: z.string().min(1, "Title is required"),
  publisher: z.string().min(1, "Publisher is required"),
  descriptionMarkdown: z.string().min(1, "Description is required"),
})

export const TableSchemaValidation = z.object({
  tableName: z.string().min(1, "Table name is required").regex(/_CL$/, "Table name must end with _CL"),
  columns: z.array(z.object({
    name: z.string().min(1, "Column name is required").regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Invalid column name"),
    type: z.enum(columnTypes),
  })).min(2, "At least one column beyond TimeGenerated is required"),
})

export const DataFlowValidation = z.object({
  streamName: z.string().min(1, "Stream name is required").regex(/^Custom-/, "Must start with Custom-"),
  transformKql: z.string().min(1, "Transform KQL is required"),
})

export const SolutionValidation = z.object({
  publisherId: z.string().min(1, "Publisher ID is required").regex(/^[a-z][a-z0-9]*$/, "Lowercase alphanumeric only"),
  offerId: z.string().min(1, "Offer ID is required").regex(/^[a-z][a-z0-9-]*$/, "Lowercase alphanumeric with hyphens"),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Must be semver format (e.g., 1.0.0)"),
  support: z.object({
    name: z.string().min(1, "Support name is required"),
  }),
})

// --- Per-connector data (steps 1-4) ---

export const ConnectorDataSchema = z.object({
  meta: MetaSchema.default({}),
  schema: TableSchemaSchema.default({}),
  dataFlow: DataFlowSchema.default({}),
  connectorUI: ConnectorUISchema.default({}),
  pollerConfig: PollerConfigSchema.optional(),
})

// --- Top-level app state (solution shared across connectors) ---

export const AppStateSchema = z
  .object({
    solution: SolutionSchema.default({}),
    connectors: z.array(ConnectorDataSchema).min(1).default([ConnectorDataSchema.parse({})]),
    activeConnectorIndex: z.number().int().nonnegative().default(0),
    analyticRules: z.array(AnalyticRuleSchema).default([]),
    huntingQueries: z.array(HuntingQuerySchema).default([]),
    asimParsers: z.array(AsimParserSchema).default([]),
    workbooks: z.array(WorkbookSchema).default([]),
  })
  .superRefine((state, ctx) => {
    if (state.activeConnectorIndex >= state.connectors.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["activeConnectorIndex"],
        message: "Active connector index is out of range",
      })
    }
  })

// --- Inferred types ---

export type Column = z.infer<typeof ColumnSchema>
export type ConnectorKind = z.infer<typeof ConnectorKindSchema>
export type Meta = z.infer<typeof MetaSchema>
export type TableSchema = z.infer<typeof TableSchemaSchema>
export type DataFlow = z.infer<typeof DataFlowSchema>
export type GraphQuery = z.infer<typeof GraphQuerySchema>
export type SampleQuery = z.infer<typeof SampleQuerySchema>
export type ConnectivityCriteria = z.infer<typeof ConnectivityCriteriaSchema>
export type Permission = z.infer<typeof PermissionsSchema>
export type InstructionStep = z.infer<typeof InstructionStepSchema>
export type Instruction = z.infer<typeof InstructionSchema>
export type ConnectorUI = z.infer<typeof ConnectorUISchema>
export type Solution = z.infer<typeof SolutionSchema>
export type PollerAuth = z.infer<typeof PollerAuthSchema>
export type PollerRequest = z.infer<typeof PollerRequestSchema>
export type PollerResponse = z.infer<typeof PollerResponseSchema>
export type PollerPaging = z.infer<typeof PollerPagingSchema>
export type PollerConfig = z.infer<typeof PollerConfigSchema>
export type ConnectorConfig = z.infer<typeof ConnectorConfigSchema>
export type ConnectorData = z.infer<typeof ConnectorDataSchema>
export type AppState = z.infer<typeof AppStateSchema>
export type EntityFieldMapping = z.infer<typeof EntityFieldMappingSchema>
export type EntityMapping = z.infer<typeof EntityMappingSchema>
export type RequiredDataConnector = z.infer<typeof RequiredDataConnectorSchema>
export type AnalyticRule = z.infer<typeof AnalyticRuleSchema>
export type HuntingQuery = z.infer<typeof HuntingQuerySchema>
export type AsimParser = z.infer<typeof AsimParserSchema>
export type Workbook = z.infer<typeof WorkbookSchema>
