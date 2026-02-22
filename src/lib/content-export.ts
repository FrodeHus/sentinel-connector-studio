import type { AnalyticRule, AsimParser } from "./schemas"

function indent(text: string, spaces: number): string {
  const pad = " ".repeat(spaces)
  return text
    .split("\n")
    .map((line) => (line.trim() ? pad + line : line))
    .join("\n")
}

function yamlString(value: string): string {
  if (
    value.includes("\n") ||
    value.includes(":") ||
    value.includes("#") ||
    value.includes("'") ||
    value.includes('"')
  ) {
    // Use literal block scalar for multi-line
    if (value.includes("\n")) {
      return `|\n${indent(value, 2)}`
    }
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
  }
  return value
}

function yamlList(items: string[], indentLevel: number = 0): string {
  const pad = " ".repeat(indentLevel)
  return items.map((item) => `${pad}- ${yamlString(item)}`).join("\n")
}

export function generateAnalyticRuleYaml(rule: AnalyticRule): string {
  const lines: string[] = []
  lines.push(`id: ${rule.id}`)
  lines.push(`name: ${yamlString(rule.name)}`)
  lines.push(`description: ${yamlString(rule.description)}`)
  lines.push(`severity: ${rule.severity}`)
  lines.push(`kind: ${rule.kind}`)
  lines.push(`enabled: ${rule.enabled}`)
  lines.push(`version: ${rule.version}`)

  if (rule.kind === "Scheduled") {
    lines.push(`queryPeriod: ${rule.queryPeriod}`)
    lines.push(`queryFrequency: ${rule.queryFrequency}`)
  }

  lines.push(`triggerOperator: ${rule.triggerOperator}`)
  lines.push(`triggerThreshold: ${rule.triggerThreshold}`)

  if (rule.tactics.length > 0) {
    lines.push(`tactics:`)
    lines.push(yamlList(rule.tactics))
  }

  if (rule.relevantTechniques.length > 0) {
    lines.push(`relevantTechniques:`)
    lines.push(yamlList(rule.relevantTechniques))
  }

  lines.push(`query: |`)
  lines.push(indent(rule.query || "// Add your KQL query here", 2))

  if (rule.entityMappings.length > 0) {
    lines.push(`entityMappings:`)
    for (const mapping of rule.entityMappings) {
      lines.push(`  - entityType: ${mapping.entityType}`)
      if (mapping.fieldMappings.length > 0) {
        lines.push(`    fieldMappings:`)
        for (const fm of mapping.fieldMappings) {
          lines.push(`      - identifier: ${fm.identifier}`)
          lines.push(`        columnName: ${fm.columnName}`)
        }
      }
    }
  }

  if (rule.requiredDataConnectors.length > 0) {
    lines.push(`requiredDataConnectors:`)
    for (const rdc of rule.requiredDataConnectors) {
      lines.push(`  - connectorId: ${rdc.connectorId}`)
      if (rdc.dataTypes.length > 0) {
        lines.push(`    dataTypes:`)
        lines.push(yamlList(rdc.dataTypes, 6))
      }
    }
  }

  return lines.join("\n") + "\n"
}

export function generateAsimParserYaml(parser: AsimParser): string {
  const lines: string[] = []
  lines.push(`id: ${parser.id}`)
  lines.push(`name: ${yamlString(parser.name)}`)
  lines.push(`targetSchema: ${parser.targetSchema}`)
  lines.push(`version: ${parser.version}`)
  lines.push(`query: |`)
  lines.push(indent(parser.query || "// Add your KQL parser query here", 2))

  return lines.join("\n") + "\n"
}
