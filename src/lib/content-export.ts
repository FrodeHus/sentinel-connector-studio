import yaml from "js-yaml"
import type { AnalyticRule, AsimParser } from "./schemas"

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
    doc.queryPeriod = rule.queryPeriod
    doc.queryFrequency = rule.queryFrequency
  }

  doc.triggerOperator = rule.triggerOperator
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
