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
    component: StepBasics,
    isValid: (cs) => cs.every((c) => MetaValidation.safeParse(c.meta).success),
    showSidebar: true,
    preview: "arm",
  },
  {
    id: "api-config",
    label: "API Config",
    group: "Connectors",
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
    component: StepSchema,
    isValid: (cs) => cs.every((c) => TableSchemaValidation.safeParse(c.schema).success),
    showSidebar: true,
    preview: "arm",
  },
  {
    id: "dcr",
    label: "DCR",
    group: "Connectors",
    component: StepDcr,
    isValid: (cs) => cs.every((c) => DataFlowValidation.safeParse(c.dataFlow).success),
    showSidebar: true,
    preview: "arm",
  },
  {
    id: "connector-ui",
    label: "Connector UI",
    group: "Connectors",
    component: StepConnectorUI,
    isValid: () => true,
    showSidebar: true,
    preview: "arm",
  },
  {
    id: "content",
    label: "Content",
    group: "Solution",
    component: StepContent,
    isValid: () => true,
    showSidebar: false,
    preview: "content",
  },
  {
    id: "solution",
    label: "Solution Metadata",
    group: "Solution",
    component: StepSolution,
    isValid: (_cs, config) => SolutionValidation.safeParse(config.solution).success,
    showSidebar: false,
    preview: null,
  },
  {
    id: "export",
    label: "Export",
    group: "Solution",
    component: StepExport,
    isValid: () => true,
    showSidebar: false,
    preview: null,
  },
]
