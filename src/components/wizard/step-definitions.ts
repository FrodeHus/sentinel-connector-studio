import * as React from "react"
import type { ConnectorConfig, ConnectorKind, ConnectorData } from "@/lib/schemas"
import {
  MetaValidation,
  TableSchemaValidation,
  DataFlowValidation,
  SolutionValidation,
} from "@/lib/schemas"
import { StepBasics } from "./StepBasics"
import { StepSchema } from "./StepSchema"
import { StepDcr } from "./StepDcr"
import { StepApiConfig } from "./StepApiConfig"
import { StepConnectorUI } from "./StepConnectorUI"
import { StepContent } from "./StepContent"
import { StepSolution } from "./StepSolution"
import { StepExport } from "./StepExport"

export interface StepDef {
  id: string
  label: string
  group: string
  about: string[]
  component: React.ComponentType
  isValid: (connectors: ConnectorData[], config: ConnectorConfig) => boolean
  showSidebar: boolean
  preview: "arm" | "content" | null
  kinds?: ConnectorKind[]
  badge?: string
}

export const ALL_STEPS: StepDef[] = [
  {
    id: "basics",
    label: "Basics",
    group: "Connectors",
    about: [
      "This step captures the identity and branding of your connector. The information here determines how your connector appears in the Sentinel Data Connector gallery.",
      "Title is the main display name users see. Make it descriptive, for example: Contoso Security Alerts (Push).",
      "Publisher is shown as the author of the connector.",
      "Description supports Markdown and appears on the connector detail page. Include links to your product documentation.",
    ],
    component: StepBasics,
    isValid: (cs) => cs.every((c) => MetaValidation.safeParse(c.meta).success),
    showSidebar: true,
    preview: "arm",
  },
  {
    id: "api-config",
    label: "API Config",
    group: "Connectors",
    about: [
      "This step configures how Microsoft Sentinel polls a REST API to ingest data.",
      "Authentication defines how Sentinel authenticates with the API (Basic, API Key, or OAuth2).",
      "Request specifies the API endpoint, HTTP method, polling interval, and time windowing.",
      "Response tells Sentinel how to extract events from the API response using JSON paths.",
      "Paging handles paginated API responses. Choose the paging strategy that matches your API.",
    ],
    component: StepApiConfig,
    isValid: (cs) =>
      cs.every((c) => {
        if (c.meta.connectorKind !== "RestApiPoller") return true
        return (
          !!c.pollerConfig?.request.apiEndpoint &&
          (c.pollerConfig?.response.eventsJsonPaths?.length ?? 0) > 0
        )
      }),
    showSidebar: true,
    preview: "arm",
    kinds: ["RestApiPoller"],
  },
  {
    id: "schema",
    label: "Schema",
    group: "Connectors",
    about: [
      "This table is where your data lands in Log Analytics. Think of columns as the fields in your events.",
      "Tip: paste a sample JSON event from your application to auto-generate the schema.",
      "Column types: string (text), long (integer), real (decimal), bool (true/false), datetime (timestamp), dynamic (JSON object/array), guid (UUID).",
    ],
    component: StepSchema,
    isValid: (cs) => cs.every((c) => TableSchemaValidation.safeParse(c.schema).success),
    showSidebar: true,
    preview: "arm",
  },
  {
    id: "dcr",
    label: "DCR",
    group: "Connectors",
    about: [
      "The DCR acts as a pipeline: data comes in from your app, gets transformed, and lands in the table.",
      "If your app already sends a TimeGenerated field, use source as the transform. Otherwise, the default adds it automatically.",
      "The stream name is used by your application when sending data to the ingestion endpoint.",
    ],
    component: StepDcr,
    isValid: (cs) => cs.every((c) => DataFlowValidation.safeParse(c.dataFlow).success),
    showSidebar: true,
    preview: "arm",
  },
  {
    id: "connector-ui",
    label: "Connector UI",
    group: "Connectors",
    about: [
      "This configures what users see when they open the connector in the Sentinel portal.",
      "Graph queries show metrics on the connector page, such as events over time.",
      "Sample queries appear in Next steps to help users explore the data.",
      "Instruction steps guide users through deploying and configuring the connector.",
    ],
    component: StepConnectorUI,
    isValid: () => true,
    showSidebar: true,
    preview: "arm",
  },
  {
    id: "content",
    label: "Content",
    group: "Solution",
    about: [
      "Analytic Rules are threat detection logic that runs against ingested data and can generate Sentinel alerts.",
      "Hunting Queries are investigator-focused KQL queries for proactive threat hunting without creating alerts.",
      "ASIM Parsers are KQL functions that normalize data into standard schemas for cross-source analytics.",
      "Workbooks are interactive dashboards from Azure Monitor that you can include in the solution package.",
      "All four are optional solution-level content and are not tied to individual connectors.",
    ],
    component: StepContent,
    isValid: () => true,
    showSidebar: false,
    preview: "content",
  },
  {
    id: "solution",
    label: "Solution Metadata",
    group: "Solution",
    about: [
      "This step defines the package identity published in Sentinel Content Hub, including publisher, offer, version, and support contact.",
      "Publisher ID and Offer ID should be lowercase and globally unique for reliable packaging and publishing.",
      "Support details are shown to users and used in solution metadata.",
    ],
    component: StepSolution,
    isValid: (_cs, config) => SolutionValidation.safeParse(config.solution).success,
    showSidebar: false,
    preview: null,
  },
  {
    id: "export",
    label: "Export",
    group: "Solution",
    about: [
      "This final step packages your connector for deployment to Azure.",
      "You can download a solution ZIP with resource files and metadata for createSolutionV3.ps1, or build a deployable template when the packager is available.",
      "After packaging, deploy the generated template and then enable the connector in Sentinel.",
    ],
    component: StepExport,
    isValid: () => true,
    showSidebar: false,
    preview: null,
  },
]
