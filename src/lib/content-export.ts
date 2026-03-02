import yaml from "js-yaml"
import type { AnalyticRule, HuntingQuery, AsimParser, Workbook } from "./schemas"
import { isoToShorthand } from "./duration-utils"

const TRIGGER_OPERATOR_SHORTHAND: Record<AnalyticRule["triggerOperator"], string> = {
  GreaterThan: "gt",
  LessThan: "lt",
  Equal: "eq",
  NotEqual: "ne",
}

export function generateAnalyticRuleYaml(rule: AnalyticRule): string {
  // Build the output document with only the fields Sentinel expects,
  // in the conventional key order. Internal UI fields (id on mappings) are omitted.
  const doc: Record<string, unknown> = {
    id: rule.id,
    name: rule.name,
    description: rule.description,
    severity: rule.severity,
    kind: rule.kind,
    enabled: rule.enabled,
    version: rule.version,
  }

  if (rule.kind === "Scheduled") {
    doc.queryPeriod = isoToShorthand(rule.queryPeriod ?? "")
    doc.queryFrequency = isoToShorthand(rule.queryFrequency ?? "")
  }

  doc.triggerOperator = TRIGGER_OPERATOR_SHORTHAND[rule.triggerOperator] ?? rule.triggerOperator
  doc.triggerThreshold = rule.triggerThreshold

  if (rule.tactics.length > 0) {
    doc.tactics = rule.tactics
  }

  if (rule.relevantTechniques.length > 0) {
    doc.relevantTechniques = rule.relevantTechniques
  }

  doc.query = rule.query || "// Add your KQL query here"

  if (rule.entityMappings.length > 0) {
    doc.entityMappings = rule.entityMappings.map((m) => ({
      entityType: m.entityType,
      fieldMappings: m.fieldMappings.map((f) => ({
        identifier: f.identifier,
        columnName: f.columnName,
      })),
    }))
  }

  if (rule.requiredDataConnectors.length > 0) {
    doc.requiredDataConnectors = rule.requiredDataConnectors.map((r) => ({
      connectorId: r.connectorId,
      dataTypes: r.dataTypes,
    }))
  }

  return yaml.dump(doc, { lineWidth: -1, quotingType: '"', forceQuotes: false })
}

export function generateAsimParserYaml(parser: AsimParser): string {
  const doc = {
    id: parser.id,
    name: parser.name,
    targetSchema: parser.targetSchema,
    version: parser.version,
    query: parser.query || "// Add your KQL parser query here",
  }

  return yaml.dump(doc, { lineWidth: -1, quotingType: '"', forceQuotes: false })
}

export function generateHuntingQueryYaml(query: HuntingQuery): string {
  const doc: Record<string, unknown> = {
    id: query.id,
    name: query.name,
    description: query.description,
    version: query.version,
    query: query.query || "// Add your KQL hunting query here",
  }

  if (query.tactics.length > 0) {
    doc.tactics = query.tactics
  }

  if (query.relevantTechniques.length > 0) {
    doc.relevantTechniques = query.relevantTechniques
  }

  if (query.entityMappings.length > 0) {
    doc.entityMappings = query.entityMappings.map((m) => ({
      entityType: m.entityType,
      fieldMappings: m.fieldMappings.map((f) => ({
        identifier: f.identifier,
        columnName: f.columnName,
      })),
    }))
  }

  if (query.requiredDataConnectors.length > 0) {
    doc.requiredDataConnectors = query.requiredDataConnectors.map((r) => ({
      connectorId: r.connectorId,
      dataTypes: r.dataTypes,
    }))
  }

  return yaml.dump(doc, { lineWidth: -1, quotingType: '"', forceQuotes: false })
}

export function generateWorkbookJson(workbook: Workbook): string {
  let parsed: Record<string, unknown> = {}
  if (workbook.serializedData) {
    try {
      const raw: unknown = JSON.parse(workbook.serializedData)
      if (raw != null && typeof raw === "object" && !Array.isArray(raw)) {
        // Only accept plain object keys — reject prototype-polluting keys
        const safe: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
          if (k === "__proto__" || k === "constructor" || k === "prototype") continue
          safe[k] = v
        }
        parsed = safe
      }
    } catch {
      parsed = {}
    }
  }

  if (workbook.fromTemplateId && !parsed.fromTemplateId) {
    parsed.fromTemplateId = workbook.fromTemplateId
  }
  if (!parsed.$schema) {
    parsed.$schema = "https://github.com/Microsoft/Application-Insights-Workbooks/blob/master/schema/workbook.json"
  }
  if (workbook.version && !parsed.version) {
    parsed.version = workbook.version
  }

  return JSON.stringify(parsed, null, 2)
}
