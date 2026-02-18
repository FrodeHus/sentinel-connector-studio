import { z } from "zod"

export const columnTypes = [
  "string", "int", "long", "real", "bool", "datetime", "dynamic", "guid"
] as const

export type ColumnType = typeof columnTypes[number]

export const ColumnSchema = z.object({
  name: z.string(),
  type: z.enum(columnTypes),
})

// Lenient schemas for state storage — no strict validation, just shape
export const MetaSchema = z.object({
  connectorId: z.string().default(""),
  title: z.string().default(""),
  publisher: z.string().default(""),
  descriptionMarkdown: z.string().default(""),
  logo: z.string().optional().default(""),
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
  type: z.enum(["Markdown", "CopyableLabel", "DeployPushConnectorButton"]),
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
  permissions: PermissionsSchema.default({
    resourceProvider: [],
    customs: [],
  }),
  instructionSteps: z.array(InstructionStepSchema).default([]),
})

export const SolutionSchema = z.object({
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
  firstPublishDate: z.string().default(new Date().toISOString().split("T")[0]),
});

export const ConnectorConfigSchema = z.object({
  meta: MetaSchema.default({}),
  schema: TableSchemaSchema.default({}),
  dataFlow: DataFlowSchema.default({}),
  connectorUI: ConnectorUISchema.default({}),
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

// --- Inferred types ---

export type Column = z.infer<typeof ColumnSchema>
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
export type ConnectorConfig = z.infer<typeof ConnectorConfigSchema>
