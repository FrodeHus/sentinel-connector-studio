import yaml from "js-yaml"
import { AnalyticRuleSchema, AsimParserSchema } from "@/lib/schemas"
import type { AnalyticRule, AsimParser } from "@/lib/schemas"

const TRIGGER_OPERATOR_MAP: Record<string, AnalyticRule["triggerOperator"]> = {
  gt: "GreaterThan",
  lt: "LessThan",
  eq: "Equal",
  ne: "NotEqual",
  greaterthan: "GreaterThan",
  lessthan: "LessThan",
  equal: "Equal",
  notequal: "NotEqual",
}

/**
 * Convert duration shorthand (1d, 7d, 5h, 30m) or ISO 8601 (PT5H, P1D) to ISO 8601.
 */
function normalizeDuration(value: unknown): string {
  if (typeof value !== "string") return ""
  const trimmed = value.trim().toUpperCase()

  // Already ISO 8601
  if (/^P/.test(trimmed)) return trimmed

  // Shorthand: e.g. "1d", "7d", "5h", "30m"
  const match = trimmed.match(/^(\d+)\s*([DHMS])$/i)
  if (match) {
    const num = match[1]
    const unit = match[2].toUpperCase()
    if (unit === "D") return `P${num}D`
    return `PT${num}${unit}`
  }

  return value
}

function normalizeTriggerOperator(value: unknown): AnalyticRule["triggerOperator"] {
  if (typeof value !== "string") return "GreaterThan"
  return TRIGGER_OPERATOR_MAP[value.toLowerCase()] ?? "GreaterThan"
}

function normalizeEntityMappings(value: unknown): AnalyticRule["entityMappings"] {
  if (!Array.isArray(value)) return []
  return value
    .filter((m): m is Record<string, unknown> => m != null && typeof m === "object")
    .map((m) => ({
      entityType: typeof m.entityType === "string" ? m.entityType : "",
      fieldMappings: Array.isArray(m.fieldMappings)
        ? m.fieldMappings
            .filter((f): f is Record<string, unknown> => f != null && typeof f === "object")
            .map((f) => ({
              identifier: typeof f.identifier === "string" ? f.identifier : "",
              columnName: typeof f.columnName === "string" ? f.columnName : "",
            }))
        : [],
    }))
}

function cleanString(value: unknown): string {
  if (typeof value !== "string") return ""
  // Sentinel YAML sometimes wraps descriptions in single quotes
  return value.replace(/^'+|'+$/g, "").trim()
}

export function parseAnalyticRuleYaml(yamlText: string): AnalyticRule {
  let doc: unknown
  try {
    doc = yaml.load(yamlText)
  } catch (e) {
    throw new Error(`Invalid YAML: ${e instanceof Error ? e.message : String(e)}`)
  }

  if (doc == null || typeof doc !== "object") {
    throw new Error("YAML must contain a mapping (object) at the top level.")
  }

  const d = doc as Record<string, unknown>

  if (!d.name && !d.query) {
    throw new Error("YAML does not appear to be an analytic rule — missing 'name' and 'query' fields.")
  }

  const partial: Partial<AnalyticRule> = {
    id: crypto.randomUUID(),
    name: typeof d.name === "string" ? d.name : undefined,
    description: d.description != null ? cleanString(d.description) : undefined,
    severity: undefined,
    kind: undefined,
    queryPeriod: d.queryPeriod != null ? normalizeDuration(d.queryPeriod) : undefined,
    queryFrequency: d.queryFrequency != null ? normalizeDuration(d.queryFrequency) : undefined,
    triggerOperator: d.triggerOperator != null ? normalizeTriggerOperator(d.triggerOperator) : undefined,
    triggerThreshold: typeof d.triggerThreshold === "number" ? d.triggerThreshold : undefined,
    tactics: Array.isArray(d.tactics) ? d.tactics.filter((t): t is string => typeof t === "string") : undefined,
    relevantTechniques: Array.isArray(d.relevantTechniques)
      ? d.relevantTechniques.map((t) => String(t))
      : undefined,
    query: typeof d.query === "string" ? d.query.trim() : undefined,
    entityMappings: d.entityMappings != null ? normalizeEntityMappings(d.entityMappings) : undefined,
    version: d.version != null ? String(d.version) : undefined,
    enabled: typeof d.enabled === "boolean" ? d.enabled : undefined,
  }

  // Validate severity
  if (typeof d.severity === "string") {
    const sev = d.severity.charAt(0).toUpperCase() + d.severity.slice(1).toLowerCase()
    if (["High", "Medium", "Low", "Informational"].includes(sev)) {
      partial.severity = sev as AnalyticRule["severity"]
    }
  }

  // Validate kind
  if (typeof d.kind === "string") {
    const kindLower = d.kind.toLowerCase()
    if (kindLower === "scheduled") partial.kind = "Scheduled"
    else if (kindLower === "nrt") partial.kind = "NRT"
  }

  // Remove undefined keys so schema defaults fill them
  const cleaned = Object.fromEntries(
    Object.entries(partial).filter(([, v]) => v !== undefined),
  )

  return AnalyticRuleSchema.parse(cleaned)
}

export function parseAsimParserYaml(yamlText: string): AsimParser {
  let doc: unknown
  try {
    doc = yaml.load(yamlText)
  } catch (e) {
    throw new Error(`Invalid YAML: ${e instanceof Error ? e.message : String(e)}`)
  }

  if (doc == null || typeof doc !== "object") {
    throw new Error("YAML must contain a mapping (object) at the top level.")
  }

  const d = doc as Record<string, unknown>
  const fn = d.Function as Record<string, unknown> | undefined

  const name =
    typeof d.FunctionName === "string"
      ? d.FunctionName
      : typeof d.FunctionAlias === "string"
        ? d.FunctionAlias
        : typeof d.name === "string"
          ? d.name
          : ""

  const query =
    typeof d.FunctionQuery === "string"
      ? d.FunctionQuery.trim()
      : typeof d.query === "string"
        ? d.query.trim()
        : ""

  const version =
    fn && typeof fn.Version === "string"
      ? fn.Version
      : typeof d.version === "string"
        ? d.version
        : undefined

  if (!name && !query) {
    throw new Error("YAML does not appear to be an ASIM parser — missing 'FunctionName' and 'FunctionQuery' fields.")
  }

  // Derive targetSchema from parser name pattern: ASim<Schema>... or vim<Schema>...
  let targetSchema = ""
  const schemaNames = [
    "AuditEvent", "Authentication", "Dhcp", "Dns", "FileEvent",
    "NetworkSession", "ProcessEvent", "RegistryEvent", "UserManagement", "WebSession",
  ]
  const asimMatch = name.match(/^[Aa][Ss]im(\w+?)(?:[A-Z][a-z]|$)/)
  const vimMatch = name.match(/^vim(\w+?)(?:[A-Z][a-z]|$)/)
  const candidate = asimMatch?.[1] ?? vimMatch?.[1] ?? ""
  if (candidate) {
    targetSchema = schemaNames.find((s) => candidate.startsWith(s)) ?? ""
  }

  const cleaned = Object.fromEntries(
    Object.entries({
      id: crypto.randomUUID(),
      name,
      targetSchema,
      query,
      version,
    }).filter(([, v]) => v !== undefined),
  )

  return AsimParserSchema.parse(cleaned)
}
